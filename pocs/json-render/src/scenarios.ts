import type { ComputedFunction, Spec } from "@json-render/core";

export type PlaybookStep = {
  id: string;
  title: string;
  note: string;
  severity: "critical" | "high" | "medium" | "low";
  done: boolean;
};

export const baselinePlaybook: PlaybookStep[] = [
  {
    id: "lock-feed",
    title: "Lock the power feed",
    note: "Confirm the berth is isolated before any crew crosses the threshold.",
    severity: "critical",
    done: true,
  },
  {
    id: "sweep-berth",
    title: "Run the electrical sweep",
    note: "Look for heat bloom around the stabilizer relay and cable trench.",
    severity: "high",
    done: false,
  },
  {
    id: "brief-crew",
    title: "Brief the responder pair",
    note: "Share the telemetry line and point them at the relay enclosure first.",
    severity: "high",
    done: false,
  },
  {
    id: "shape-handoff",
    title: "Shape the next-shift handoff",
    note: "Capture the desk decision while the board is still fresh.",
    severity: "medium",
    done: false,
  },
];

export function clonePlaybook(): PlaybookStep[] {
  return baselinePlaybook.map((step) => ({ ...step }));
}

export function createInitialState() {
  return {
    session: {
      location: "Orbital Ring 04",
      channel: "OPS-17",
    },
    stats: {
      queue: 14,
      responders: 3,
      stabilized: 11,
    },
    briefing: {
      line: "Power oscillation across berth 7C with cargo still staged on the bridge.",
      source: "Camera mesh + dock telemetry",
    },
    filters: {
      severity: "high",
      freezeBoard: false,
    },
    report: {
      operator: "Nadia Vale",
      summary:
        "Hold the berth closed until the responder pair clears the relay enclosure, then package the status for the midnight desk.",
    },
    copilot: {
      label: "Recommended move",
      recommendation:
        "Dispatch the electrical sweep before reopening the berth and keep the checklist moving in order.",
      focus: "Check the stabilizer relay after confirming dock isolation.",
      tone: "amber",
      updatedAt: "watching severity changes",
    },
    reportStatus: {
      lastSubmission: null as
        | null
        | {
            at: string;
            operator: string;
            severity: string;
            openItems: number;
            summary: string;
          },
    },
    playbook: clonePlaybook(),
  };
}

function asSteps(value: unknown): PlaybookStep[] {
  return Array.isArray(value) ? (value as PlaybookStep[]) : [];
}

export const computedFunctions: Record<string, ComputedFunction> = {
  openItems: ({ steps }) => asSteps(steps).filter((step) => !step.done).length,
  completionPercent: ({ steps }) => {
    const list = asSteps(steps);
    if (list.length === 0) {
      return 0;
    }

    const completed = list.filter((step) => step.done).length;
    return Math.round((completed / list.length) * 100);
  },
  severityTone: ({ severity }) => {
    switch (severity) {
      case "critical":
        return "ruby";
      case "high":
        return "amber";
      case "medium":
      case "low":
        return "teal";
      default:
        return "ink";
    }
  },
  reportState: ({ summary }) => {
    const text = typeof summary === "string" ? summary.trim() : "";
    if (text.length > 96) {
      return "Strong draft";
    }
    if (text.length > 36) {
      return "Usable draft";
    }
    return "Needs more detail";
  },
};

export const initialSpec: Spec = {
  root: "shell",
  elements: {
    shell: {
      type: "WorkbenchShell",
      props: {
        eyebrow: "json-render / live spec",
        title: "Orbit Desk Workbench",
        kicker: {
          $template: "${/session/location} // ${/session/channel}",
        },
      },
      children: ["lead-split", "lower-split"],
    },
    "lead-split": {
      type: "Split",
      props: {
        columns: "2",
        emphasis: "left",
      },
      children: ["overview-panel", "controls-panel"],
    },
    "overview-panel": {
      type: "Panel",
      props: {
        title: "Live brief",
        subtitle: {
          $template:
            "Incoming signal routed from ${/briefing/source}. Severity is currently ${/filters/severity}.",
        },
        accent: {
          $computed: "severityTone",
          args: {
            severity: {
              $state: "/filters/severity",
            },
          },
        },
      },
      children: [
        "brief-copy",
        "metrics-split",
        "freeze-copy",
        "recommendation-inline",
        "focus-copy",
      ],
    },
    "brief-copy": {
      type: "Copy",
      props: {
        text: {
          $template: "Signal: ${/briefing/line}",
        },
        variant: "body",
      },
      children: [],
    },
    "metrics-split": {
      type: "Split",
      props: {
        columns: "3",
        emphasis: "balanced",
      },
      children: ["queue-tile", "responders-tile", "open-items-tile"],
    },
    "queue-tile": {
      type: "StatTile",
      props: {
        label: "Queue",
        value: {
          $state: "/stats/queue",
        },
        detail: "threads still moving across the desk",
      },
      children: [],
    },
    "responders-tile": {
      type: "StatTile",
      props: {
        label: "Responders",
        value: {
          $state: "/stats/responders",
        },
        detail: "crew ready on the live channel",
      },
      children: [],
    },
    "open-items-tile": {
      type: "StatTile",
      props: {
        label: "Open playbook items",
        value: {
          $computed: "openItems",
          args: {
            steps: {
              $state: "/playbook",
            },
          },
        },
        detail: {
          $template: "desk lead: ${/report/operator}",
        },
      },
      children: [],
    },
    "freeze-copy": {
      type: "Copy",
      props: {
        text: "Board edits are frozen. Review mode is on until you unlock the checklist.",
        variant: "eyebrow",
      },
      visible: {
        $state: "/filters/freezeBoard",
      },
      children: [],
    },
    "recommendation-inline": {
      type: "RecommendationCard",
      props: {
        label: {
          $state: "/copilot/label",
        },
        text: {
          $state: "/copilot/recommendation",
        },
        tone: {
          $state: "/copilot/tone",
        },
      },
      children: [],
    },
    "focus-copy": {
      type: "Copy",
      props: {
        text: {
          $template: "Focus: ${/copilot/focus} // updated ${/copilot/updatedAt}",
        },
        variant: "mono",
      },
      children: [],
    },
    "controls-panel": {
      type: "Panel",
      props: {
        title: "Control surface",
        subtitle:
          "This side of the spec is doing the work: bindings, watchers, custom actions, and built-in actions.",
        accent: "ink",
      },
      children: [
        "severity-control",
        "operator-input",
        "summary-input",
        "freeze-toggle",
        "controls-actions",
      ],
    },
    "severity-control": {
      type: "ChoicePills",
      props: {
        label: "Severity band",
        value: {
          $bindState: "/filters/severity",
        },
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Critical", value: "critical" },
        ],
      },
      watch: {
        "/filters/severity": {
          action: "recommendProtocol",
          params: {
            severity: {
              $state: "/filters/severity",
            },
            frozen: {
              $state: "/filters/freezeBoard",
            },
          },
        },
      },
      children: [],
    },
    "operator-input": {
      type: "InputField",
      props: {
        label: "Desk lead",
        value: {
          $bindState: "/report/operator",
        },
        placeholder: "Name the operator",
      },
      children: [],
    },
    "summary-input": {
      type: "TextAreaField",
      props: {
        label: "Handoff summary",
        value: {
          $bindState: "/report/summary",
        },
        placeholder: "Shape the note the next shift would inherit.",
        rows: 5,
      },
      children: [],
    },
    "freeze-toggle": {
      type: "ToggleField",
      props: {
        label: "Freeze checklist",
        checked: {
          $bindState: "/filters/freezeBoard",
        },
        description: "Stops checklist edits while you refine the summary and export note.",
      },
      watch: {
        "/filters/freezeBoard": {
          action: "recommendProtocol",
          params: {
            severity: {
              $state: "/filters/severity",
            },
            frozen: {
              $state: "/filters/freezeBoard",
            },
          },
        },
      },
      children: [],
    },
    "controls-actions": {
      type: "Split",
      props: {
        columns: "3",
        emphasis: "balanced",
      },
      children: ["restore-button", "recommend-button", "submit-button"],
    },
    "restore-button": {
      type: "ActionButton",
      props: {
        label: "Restore playbook",
        hint: "Reset the checklist and clear the last package.",
        tone: "ghost",
      },
      on: {
        press: {
          action: "restoreChecklist",
        },
      },
      children: [],
    },
    "recommend-button": {
      type: "ActionButton",
      props: {
        label: "Refresh protocol",
        hint: "Call the custom action directly.",
        tone: "ghost",
      },
      on: {
        press: {
          action: "recommendProtocol",
          params: {
            severity: {
              $state: "/filters/severity",
            },
            frozen: {
              $state: "/filters/freezeBoard",
            },
          },
        },
      },
      children: [],
    },
    "submit-button": {
      type: "ActionButton",
      props: {
        label: "Package handoff",
        hint: {
          $computed: "reportState",
          args: {
            summary: {
              $state: "/report/summary",
            },
          },
        },
        tone: "solid",
      },
      on: {
        press: {
          action: "submitReport",
          params: {
            operator: {
              $state: "/report/operator",
            },
            summary: {
              $state: "/report/summary",
            },
            severity: {
              $state: "/filters/severity",
            },
          },
          confirm: {
            title: "Package the handoff?",
            message: "This snapshots the current summary and checklist state.",
            confirmLabel: "Package it",
            cancelLabel: "Keep editing",
          },
        },
      },
      children: [],
    },
    "lower-split": {
      type: "Split",
      props: {
        columns: "2",
        emphasis: "right",
      },
      children: ["playbook-panel", "export-panel"],
    },
    "playbook-panel": {
      type: "Panel",
      props: {
        title: "Checklist",
        subtitle: "This section shows repeat scopes and two-way $bindItem updates.",
        accent: "teal",
      },
      children: ["progress-meter", "source-copy", "playbook-row", "lock-note"],
    },
    "progress-meter": {
      type: "Meter",
      props: {
        label: {
          $template: "${/report/operator} is driving a ${/filters/severity} track",
        },
        value: {
          $computed: "completionPercent",
          args: {
            steps: {
              $state: "/playbook",
            },
          },
        },
        max: 100,
      },
      children: [],
    },
    "source-copy": {
      type: "Copy",
      props: {
        text: {
          $template: "Briefing source: ${/briefing/source}",
        },
        variant: "muted",
      },
      children: [],
    },
    "playbook-row": {
      type: "ChecklistRow",
      repeat: {
        statePath: "/playbook",
        key: "id",
      },
      props: {
        title: {
          $item: "title",
        },
        note: {
          $item: "note",
        },
        done: {
          $bindItem: "done",
        },
        severity: {
          $item: "severity",
        },
      },
      children: [],
    },
    "lock-note": {
      type: "Copy",
      props: {
        text: "Checklist rows are read-only while freeze mode is active.",
        variant: "eyebrow",
      },
      visible: {
        $state: "/filters/freezeBoard",
      },
      children: [],
    },
    "export-panel": {
      type: "Panel",
      props: {
        title: "Export surface",
        subtitle: "Use this area to inspect the prompt-shaped state and the last packaged report.",
        accent: {
          $computed: "severityTone",
          args: {
            severity: {
              $state: "/filters/severity",
            },
          },
        },
      },
      children: [
        "draft-card",
        "focus-export-copy",
        "monitor-button",
        "submission-card",
        "wire-copy",
      ],
    },
    "draft-card": {
      type: "RecommendationCard",
      props: {
        label: "Prompt-ready note",
        text: {
          $template: "${/report/operator}: ${/report/summary}",
        },
        tone: {
          $computed: "severityTone",
          args: {
            severity: {
              $state: "/filters/severity",
            },
          },
        },
      },
      children: [],
    },
    "focus-export-copy": {
      type: "Copy",
      props: {
        text: {
          $template: "Copilot focus: ${/copilot/focus}",
        },
        variant: "body",
      },
      children: [],
    },
    "monitor-button": {
      type: "ActionButton",
      props: {
        label: "Downgrade to monitor",
        hint: "Uses the built-in setState action on /filters/severity.",
        tone: "ghost",
      },
      on: {
        press: {
          action: "setState",
          params: {
            statePath: "/filters/severity",
            value: "medium",
          },
        },
      },
      children: [],
    },
    "submission-card": {
      type: "RecommendationCard",
      props: {
        label: "Last package",
        text: {
          $template:
            "Sent at ${/reportStatus/lastSubmission/at} by ${/reportStatus/lastSubmission/operator} with ${/reportStatus/lastSubmission/openItems} open items.",
        },
        tone: "teal",
      },
      visible: {
        $state: "/reportStatus/lastSubmission",
      },
      children: [],
    },
    "wire-copy": {
      type: "Copy",
      props: {
        text: {
          $template:
            "wire snapshot -> severity=${/filters/severity} // freeze=${/filters/freezeBoard} // update=${/copilot/updatedAt}",
        },
        variant: "mono",
      },
      children: [],
    },
  },
};

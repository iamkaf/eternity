import type { StateStore } from "@json-render/core";
import {
  JSONUIProvider,
  Renderer,
  useBoundProp,
  useStateValue,
  type ComponentRenderProps,
  type ComponentRegistry,
} from "@json-render/react";
import { catalog } from "./catalog";
import { clonePlaybook, baselinePlaybook, computedFunctions } from "./scenarios";

type Accent = "ink" | "teal" | "amber" | "ruby";

type WorkbenchShellProps = {
  eyebrow: string;
  title: string;
  kicker?: string | null;
};

type SplitProps = {
  columns: "2" | "3";
  emphasis?: "left" | "right" | "balanced" | null;
};

type PanelProps = {
  title: string;
  subtitle?: string | null;
  accent?: Accent | null;
};

type CopyProps = {
  text: string;
  variant?: "body" | "muted" | "eyebrow" | "mono" | null;
};

type StatTileProps = {
  label: string;
  value: string | number;
  detail?: string | null;
};

type InputFieldProps = {
  label: string;
  value?: string | null;
  placeholder?: string | null;
};

type TextAreaFieldProps = {
  label: string;
  value?: string | null;
  placeholder?: string | null;
  rows?: number | null;
};

type ChoicePillsProps = {
  label: string;
  value?: string | null;
  options: Array<{
    label: string;
    value: string;
  }>;
};

type ToggleFieldProps = {
  label: string;
  checked?: boolean | null;
  description?: string | null;
};

type ActionButtonProps = {
  label: string;
  hint?: string | null;
  tone?: "solid" | "ghost" | "danger" | null;
};

type MeterProps = {
  label: string;
  value: number;
  max: number;
};

type RecommendationCardProps = {
  label: string;
  text: string;
  tone?: Accent | null;
};

type ChecklistRowProps = {
  title: string;
  note?: string | null;
  done?: boolean | null;
  severity?: string | null;
};

function WorkbenchShell({ element, children }: ComponentRenderProps<WorkbenchShellProps>) {
  const props = element.props;

  return (
    <section className="jr-shell">
      <header className="jr-shell__header">
        <span className="jr-shell__eyebrow">{props.eyebrow}</span>
        <div className="jr-shell__heading">
          <h1>{props.title}</h1>
          {props.kicker ? <p>{props.kicker}</p> : null}
        </div>
      </header>
      <div className="jr-shell__body">{children}</div>
    </section>
  );
}

function Split({ element, children }: ComponentRenderProps<SplitProps>) {
  const props = element.props;
  const emphasis = props.emphasis ?? "balanced";
  return (
    <div className={`jr-split jr-split--${props.columns} jr-split--${emphasis}`}>{children}</div>
  );
}

function Panel({ element, children }: ComponentRenderProps<PanelProps>) {
  const props = element.props;
  const accent = props.accent ?? "ink";

  return (
    <article className={`jr-panel jr-panel--${accent}`}>
      <header className="jr-panel__header">
        <div>
          <h2>{props.title}</h2>
          {props.subtitle ? <p>{props.subtitle}</p> : null}
        </div>
      </header>
      <div className="jr-panel__body">{children}</div>
    </article>
  );
}

function Copy({ element }: ComponentRenderProps<CopyProps>) {
  const props = element.props;
  const variant = props.variant ?? "body";
  return <p className={`jr-copy jr-copy--${variant}`}>{props.text}</p>;
}

function StatTile({ element }: ComponentRenderProps<StatTileProps>) {
  const props = element.props;
  return (
    <div className="jr-stat">
      <span className="jr-stat__label">{props.label}</span>
      <strong className="jr-stat__value">{props.value}</strong>
      {props.detail ? <span className="jr-stat__detail">{props.detail}</span> : null}
    </div>
  );
}

function InputField({ element, bindings }: ComponentRenderProps<InputFieldProps>) {
  const props = element.props;
  const [value, setValue] = useBoundProp<string>(props.value ?? "", bindings?.value);

  return (
    <label className="jr-field">
      <span className="jr-field__label">{props.label}</span>
      <input
        className="jr-input"
        value={value ?? ""}
        placeholder={props.placeholder ?? ""}
        onChange={(event) => setValue(event.target.value)}
      />
    </label>
  );
}

function TextAreaField({ element, bindings }: ComponentRenderProps<TextAreaFieldProps>) {
  const props = element.props;
  const [value, setValue] = useBoundProp<string>(props.value ?? "", bindings?.value);

  return (
    <label className="jr-field">
      <span className="jr-field__label">{props.label}</span>
      <textarea
        className="jr-textarea"
        rows={props.rows ?? 4}
        value={value ?? ""}
        placeholder={props.placeholder ?? ""}
        onChange={(event) => setValue(event.target.value)}
      />
    </label>
  );
}

function ChoicePills({ element, bindings }: ComponentRenderProps<ChoicePillsProps>) {
  const props = element.props;
  const [value, setValue] = useBoundProp<string>(props.value ?? "", bindings?.value);

  return (
    <div className="jr-field">
      <span className="jr-field__label">{props.label}</span>
      <div className="jr-pills">
        {props.options.map((option: ChoicePillsProps["options"][number]) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              className={`jr-pill ${active ? "is-active" : ""}`}
              type="button"
              onClick={() => setValue(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleField({ element, bindings }: ComponentRenderProps<ToggleFieldProps>) {
  const props = element.props;
  const [checked, setChecked] = useBoundProp<boolean>(Boolean(props.checked), bindings?.checked);

  return (
    <label className="jr-toggle">
      <div className="jr-toggle__copy">
        <span className="jr-field__label">{props.label}</span>
        {props.description ? <span className="jr-toggle__description">{props.description}</span> : null}
      </div>
      <button
        className={`jr-switch ${checked ? "is-on" : ""}`}
        type="button"
        onClick={() => setChecked(!checked)}
      >
        <span />
      </button>
    </label>
  );
}

function ActionButton({ element, emit }: ComponentRenderProps<ActionButtonProps>) {
  const props = element.props;
  const tone = props.tone ?? "ghost";

  return (
    <button className={`jr-action jr-action--${tone}`} type="button" onClick={() => emit("press")}>
      <span>{props.label}</span>
      {props.hint ? <small>{props.hint}</small> : null}
    </button>
  );
}

function Meter({ element }: ComponentRenderProps<MeterProps>) {
  const props = element.props;
  const max = props.max <= 0 ? 1 : props.max;
  const progress = Math.max(0, Math.min(100, Math.round((props.value / max) * 100)));

  return (
    <div className="jr-meter">
      <div className="jr-meter__meta">
        <span>{props.label}</span>
        <strong>{progress}%</strong>
      </div>
      <div className="jr-meter__rail">
        <div className="jr-meter__fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function RecommendationCard({ element }: ComponentRenderProps<RecommendationCardProps>) {
  const props = element.props;
  const tone = props.tone ?? "ink";

  return (
    <div className={`jr-recommendation jr-recommendation--${tone}`}>
      <span className="jr-recommendation__label">{props.label}</span>
      <p>{props.text}</p>
    </div>
  );
}

function ChecklistRow({ element, bindings }: ComponentRenderProps<ChecklistRowProps>) {
  const props = element.props;
  const [done, setDone] = useBoundProp<boolean>(Boolean(props.done), bindings?.done);
  const frozen = Boolean(useStateValue<boolean>("/filters/freezeBoard"));

  return (
    <label className={`jr-check ${done ? "is-done" : ""} ${frozen ? "is-frozen" : ""}`}>
      <input
        checked={done}
        disabled={frozen}
        type="checkbox"
        onChange={(event) => setDone(event.target.checked)}
      />
      <div className="jr-check__body">
        <div className="jr-check__title">
          <strong>{props.title}</strong>
          {props.severity ? <span className={`jr-tag jr-tag--${props.severity}`}>{props.severity}</span> : null}
        </div>
        {props.note ? <p>{props.note}</p> : null}
      </div>
    </label>
  );
}

export const registry: ComponentRegistry = {
  WorkbenchShell,
  Split,
  Panel,
  Copy,
  StatTile,
  InputField,
  TextAreaField,
  ChoicePills,
  ToggleField,
  ActionButton,
  Meter,
  RecommendationCard,
  ChecklistRow,
};

function timestampLabel() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function buildRecommendation(severity?: string | null, frozen?: boolean | null, openItems?: number) {
  if (frozen) {
    return {
      label: "Board frozen",
      recommendation:
        "Hold the checklist static and shape the export note before you reopen live edits.",
      focus: "Use the summary panel to capture what changed and what the next shift inherits.",
      tone: "ink",
    } as const;
  }

  switch (severity) {
    case "critical":
      return {
        label: "Critical protocol",
        recommendation:
          "Escalate to live response, isolate the berth, and keep cargo movement paused until the responder pair clears the relay.",
        focus: "Confirm power isolation, then keep the handoff concise and explicit.",
        tone: "ruby",
      } as const;
    case "high":
      return {
        label: "High-severity track",
        recommendation:
          "Dispatch the electrical sweep before reopening the berth and keep the checklist moving in order.",
        focus: "Check the stabilizer relay after confirming dock isolation.",
        tone: "amber",
      } as const;
    case "low":
      return {
        label: "Monitor mode",
        recommendation:
          "Keep the berth open, document the anomaly, and only escalate if the signal repeats under load.",
        focus: "Trim the handoff into a concise monitoring note for the next desk.",
        tone: "teal",
      } as const;
    case "medium":
    default:
      return {
        label: "Stabilize then watch",
        recommendation: `Keep one responder on the berth and review the remaining ${openItems ?? 0} open items before escalating.`,
        focus: "Compare fresh telemetry against the previous shift log and tighten the summary.",
        tone: "teal",
      } as const;
  }
}

export function createActionHandlers(store: StateStore) {
  return {
    recommendProtocol: async (params?: Record<string, unknown>) => {
      const state = store.getSnapshot();
      const severity =
        typeof params?.severity === "string"
          ? params.severity
          : typeof state.filters === "object" && state.filters !== null && "severity" in state.filters
            ? String((state.filters as { severity?: string }).severity ?? "")
            : "";
      const frozen =
        typeof params?.frozen === "boolean"
          ? params.frozen
          : Boolean(
              typeof state.filters === "object" &&
                state.filters !== null &&
                "freezeBoard" in state.filters &&
                (state.filters as { freezeBoard?: boolean }).freezeBoard,
            );
      const playbook = Array.isArray(state.playbook) ? state.playbook : [];
      const openItems = playbook.filter(
        (item) => typeof item === "object" && item !== null && "done" in item && !(item as { done?: boolean }).done,
      ).length;
      const next = buildRecommendation(severity, frozen, openItems);

      store.update({
        "/copilot/label": next.label,
        "/copilot/recommendation": next.recommendation,
        "/copilot/focus": next.focus,
        "/copilot/tone": next.tone,
        "/copilot/updatedAt": timestampLabel(),
      });
    },
    submitReport: async (params?: Record<string, unknown>) => {
      const state = store.getSnapshot();
      const operator =
        typeof params?.operator === "string" && params.operator.trim().length > 0
          ? params.operator
          : typeof state.report === "object" && state.report !== null && "operator" in state.report
            ? String((state.report as { operator?: string }).operator ?? "Unknown operator")
            : "Unknown operator";
      const summary =
        typeof params?.summary === "string" && params.summary.trim().length > 0
          ? params.summary.trim()
          : "No summary provided.";
      const severity =
        typeof params?.severity === "string" && params.severity.trim().length > 0
          ? params.severity
          : typeof state.filters === "object" && state.filters !== null && "severity" in state.filters
            ? String((state.filters as { severity?: string }).severity ?? "medium")
            : "medium";
      const playbook = Array.isArray(state.playbook) ? state.playbook : [];
      const openItems = playbook.filter(
        (item) => typeof item === "object" && item !== null && "done" in item && !(item as { done?: boolean }).done,
      ).length;

      store.update({
        "/reportStatus/lastSubmission": {
          at: timestampLabel(),
          operator,
          severity,
          openItems,
          summary,
        },
        "/copilot/label": "Handoff packaged",
        "/copilot/recommendation": `Snapshot captured with ${openItems} open playbook items still in motion.`,
        "/copilot/focus":
          openItems > 0
            ? "Keep the remaining checklist items visible so the next desk can resume cleanly."
            : "Checklist is clear. The next desk can reopen the berth if telemetry stays calm.",
        "/copilot/tone": openItems > 0 ? "amber" : "teal",
        "/copilot/updatedAt": timestampLabel(),
      });
    },
    restoreChecklist: async () => {
      store.update({
        "/playbook": clonePlaybook(),
        "/filters/freezeBoard": false,
        "/copilot/label": "Baseline restored",
        "/copilot/recommendation":
          "Checklist reset to the default posture. Adjust severity or shape the summary to generate a fresh recommendation.",
        "/copilot/focus": "Walk the playbook from the top before packaging another handoff.",
        "/copilot/tone": "ink",
        "/copilot/updatedAt": timestampLabel(),
        "/reportStatus/lastSubmission": null,
        "/stats/queue": 10 + baselinePlaybook.length,
      });
    },
  };
}

type PreviewProps = {
  spec: Parameters<typeof Renderer>[0]["spec"];
  store: StateStore;
};

export function JsonRenderPreview({ spec, store }: PreviewProps) {
  return (
    <JSONUIProvider
      functions={computedFunctions}
      handlers={createActionHandlers(store)}
      registry={registry}
      store={store}
    >
      <Renderer registry={registry} spec={spec} />
    </JSONUIProvider>
  );
}

export const catalogPrompt = catalog.prompt({
  system: "You are designing a compact operations desk for a human operator.",
  customRules: [
    "Favor concise copy and strong visual hierarchy.",
    "Keep the board useful while it is being actively edited.",
    "Use actions when state changes should trigger visible recommendations.",
  ],
});

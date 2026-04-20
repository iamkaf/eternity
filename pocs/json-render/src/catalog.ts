import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const accentSchema = z.enum(["ink", "teal", "amber", "ruby"]);
const buttonToneSchema = z.enum(["solid", "ghost", "danger"]);

export const catalog = defineCatalog(schema, {
  components: {
    WorkbenchShell: {
      props: z.object({
        eyebrow: z.string(),
        title: z.string(),
        kicker: z.string().nullable().optional(),
      }),
      description: "A stage wrapper with a header for the rendered workbench.",
    },
    Split: {
      props: z.object({
        columns: z.enum(["2", "3"]),
        emphasis: z.enum(["left", "right", "balanced"]).nullable().optional(),
      }),
      description: "A responsive layout split used to arrange cards in columns.",
    },
    Panel: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().nullable().optional(),
        accent: accentSchema.nullable().optional(),
      }),
      description: "A framed surface with a title, subtitle, and optional accent.",
    },
    Copy: {
      props: z.object({
        text: z.string(),
        variant: z.enum(["body", "muted", "eyebrow", "mono"]).nullable().optional(),
      }),
      description: "Standalone copy used for briefs, notes, and status text.",
    },
    StatTile: {
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        detail: z.string().nullable().optional(),
      }),
      description: "A compact metric with a large value and short detail line.",
    },
    InputField: {
      props: z.object({
        label: z.string(),
        value: z.string().nullable().optional(),
        placeholder: z.string().nullable().optional(),
      }),
      description: "A single-line input that can bind to state.",
    },
    TextAreaField: {
      props: z.object({
        label: z.string(),
        value: z.string().nullable().optional(),
        placeholder: z.string().nullable().optional(),
        rows: z.number().nullable().optional(),
      }),
      description: "A multi-line text field for editable notes and handoff summaries.",
    },
    ChoicePills: {
      props: z.object({
        label: z.string(),
        value: z.string().nullable().optional(),
        options: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        ),
      }),
      description: "A segmented pill control for selecting one option from a short list.",
    },
    ToggleField: {
      props: z.object({
        label: z.string(),
        checked: z.boolean().nullable().optional(),
        description: z.string().nullable().optional(),
      }),
      description: "A toggle switch for boolean state.",
    },
    ActionButton: {
      props: z.object({
        label: z.string(),
        hint: z.string().nullable().optional(),
        tone: buttonToneSchema.nullable().optional(),
      }),
      description: "An interactive button that emits a press event.",
    },
    Meter: {
      props: z.object({
        label: z.string(),
        value: z.number(),
        max: z.number(),
      }),
      description: "A progress meter used to show completion against a ceiling.",
    },
    RecommendationCard: {
      props: z.object({
        label: z.string(),
        text: z.string(),
        tone: accentSchema.nullable().optional(),
      }),
      description: "A highlighted recommendation or export-ready message.",
    },
    ChecklistRow: {
      props: z.object({
        title: z.string(),
        note: z.string().nullable().optional(),
        done: z.boolean().nullable().optional(),
        severity: z.string().nullable().optional(),
      }),
      description: "A repeat-friendly checklist row with a bindable completion state.",
    },
  },
  actions: {
    recommendProtocol: {
      params: z
        .object({
          severity: z.string().nullable().optional(),
          frozen: z.boolean().nullable().optional(),
        })
        .optional(),
      description: "Refresh the copilot recommendation based on severity and freeze mode.",
    },
    submitReport: {
      params: z
        .object({
          operator: z.string().nullable().optional(),
          summary: z.string().nullable().optional(),
          severity: z.string().nullable().optional(),
        })
        .optional(),
      description: "Package the current board into a handoff snapshot.",
    },
    restoreChecklist: {
      params: z.object({}).optional(),
      description: "Restore the default checklist and clear the last exported handoff.",
    },
  },
});

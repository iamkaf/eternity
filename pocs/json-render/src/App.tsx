import {
  autoFixSpec,
  createStateStore,
  formatSpecIssues,
  registerActionObserver,
  validateSpec,
  type Spec,
} from "@json-render/core";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { JsonRenderPreview, catalogPrompt } from "./registry";
import { createInitialState, initialSpec } from "./scenarios";

type DraftAnalysis = {
  spec: Spec | null;
  parseError: string | null;
  issues: string[];
};

type ActionLogEntry = {
  id: string;
  name: string;
  at: number;
  status: "running" | "ok" | "error";
  params?: Record<string, unknown>;
  durationMs?: number;
  error?: string;
};

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function analyzeDraft(source: string): DraftAnalysis {
  try {
    const parsed = JSON.parse(source) as Spec;
    const { issues } = validateSpec(parsed);
    const formatted = issues.length > 0 ? formatSpecIssues(issues).split("\n").filter(Boolean) : [];

    return {
      spec: parsed,
      parseError: null,
      issues: formatted,
    };
  } catch (error) {
    return {
      spec: null,
      parseError: error instanceof Error ? error.message : "Unable to parse JSON.",
      issues: [],
    };
  }
}

const initialSpecText = prettyJson(initialSpec);

export default function App() {
  const [store, setStore] = useState(() => createStateStore(createInitialState()));
  const [runtimeState, setRuntimeState] = useState<Record<string, unknown>>(store.getSnapshot());
  const [specText, setSpecText] = useState(initialSpecText);
  const [appliedSpec, setAppliedSpec] = useState<Spec>(initialSpec);
  const [lastAppliedText, setLastAppliedText] = useState(initialSpecText);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [statusLine, setStatusLine] = useState("Editing the live spec updates diagnostics before you apply it.");

  const deferredSpecText = useDeferredValue(specText);
  const draft = useMemo(() => analyzeDraft(deferredSpecText), [deferredSpecText]);
  const isDirty = specText !== lastAppliedText;
  const promptExcerpt = useMemo(() => catalogPrompt.split("\n").slice(0, 36).join("\n"), []);

  useEffect(() => {
    setRuntimeState(store.getSnapshot());
    return store.subscribe(() => {
      setRuntimeState(store.getSnapshot());
    });
  }, [store]);

  useEffect(() => {
    return registerActionObserver({
      onDispatch: (event) => {
        setActionLog((current) =>
          [
            { id: event.id, name: event.name, at: event.at, params: event.params, status: "running" as const },
            ...current,
          ].slice(0, 18),
        );
      },
      onSettle: (event) => {
        setActionLog((current) =>
          current.map((entry) =>
            entry.id === event.id
              ? {
                  ...entry,
                  status: event.ok ? "ok" : "error",
                  durationMs: event.durationMs,
                  error: event.ok ? undefined : String(event.error ?? "Unknown error"),
                }
              : entry,
          ),
        );
      },
    });
  }, []);

  function applyDraft() {
    if (!draft.spec) {
      setStatusLine(`Cannot apply: ${draft.parseError ?? "draft is invalid"}`);
      return;
    }

    const nextText = prettyJson(draft.spec);
    startTransition(() => {
      setAppliedSpec(draft.spec!);
      setSpecText(nextText);
      setLastAppliedText(nextText);
      setStatusLine(
        draft.issues.length > 0
          ? `Applied with ${draft.issues.length} structural warning${draft.issues.length === 1 ? "" : "s"}.`
          : "Applied cleanly. The preview now reflects the current draft.",
      );
    });
  }

  function autoFixDraft() {
    if (!draft.spec) {
      setStatusLine(`Cannot auto-fix: ${draft.parseError ?? "draft is invalid"}`);
      return;
    }

    const fixed = autoFixSpec(draft.spec);
    startTransition(() => {
      setSpecText(prettyJson(fixed));
      setStatusLine("Auto-fix rewrote the draft. Review the result, then apply it.");
    });
  }

  function formatDraft() {
    if (!draft.spec) {
      setStatusLine(`Cannot format: ${draft.parseError ?? "draft is invalid"}`);
      return;
    }

    setSpecText(prettyJson(draft.spec));
    setStatusLine("Draft formatted.");
  }

  function resetWorkbench() {
    startTransition(() => {
      const nextStore = createStateStore(createInitialState());
      setStore(nextStore);
      setRuntimeState(nextStore.getSnapshot());
      setAppliedSpec(initialSpec);
      setSpecText(initialSpecText);
      setLastAppliedText(initialSpecText);
      setActionLog([]);
      setStatusLine("Workbench restored to the baseline scenario.");
    });
  }

  return (
    <div className="app">
      <aside className="rail">
        <section className="rail-card rail-card--intro">
          <span className="rail-card__eyebrow">POC / json-render</span>
          <h1>Spec-first workbench</h1>
          <p>
            This playground exercises the library where it matters: live spec editing, two-way bindings, repeat
            scopes, watchers, computed props, custom actions, and built-in state actions.
          </p>
          <ul className="feature-list">
            <li>`$bindState` and `$bindItem` on inputs and checklist rows</li>
            <li>`watch` driving a custom recommendation action</li>
            <li>`repeat` for the playbook checklist</li>
            <li>`$computed`, `$template`, and `visible` in the rendered UI</li>
            <li>Built-in `setState` plus custom `submitReport` and `restoreChecklist`</li>
          </ul>
        </section>

        <section className="rail-card">
          <div className="rail-card__topline">
            <span className="rail-card__eyebrow">Draft spec</span>
            <span className={`status-dot ${isDirty ? "is-dirty" : "is-clean"}`}>{isDirty ? "dirty" : "synced"}</span>
          </div>
          <textarea
            className="spec-editor"
            spellCheck={false}
            value={specText}
            onChange={(event) => setSpecText(event.target.value)}
          />
          <div className="button-row">
            <button className="shell-button shell-button--solid" type="button" onClick={applyDraft}>
              Apply
            </button>
            <button className="shell-button" type="button" onClick={formatDraft}>
              Format
            </button>
            <button className="shell-button" type="button" onClick={autoFixDraft}>
              Auto-fix
            </button>
            <button className="shell-button" type="button" onClick={resetWorkbench}>
              Reset
            </button>
          </div>
          <p className="status-line">{statusLine}</p>
        </section>

        <section className="rail-card">
          <span className="rail-card__eyebrow">Diagnostics</span>
          {draft.parseError ? (
            <div className="diagnostic diagnostic--error">{draft.parseError}</div>
          ) : draft.issues.length > 0 ? (
            <div className="diagnostic diagnostic--warn">
              {draft.issues.map((issue) => (
                <p key={issue}>{issue}</p>
              ))}
            </div>
          ) : (
            <div className="diagnostic diagnostic--ok">Spec parses and passes structural validation.</div>
          )}
        </section>

        <section className="rail-card">
          <span className="rail-card__eyebrow">Catalog prompt excerpt</span>
          <pre className="prompt-preview">{promptExcerpt}</pre>
        </section>
      </aside>

      <main className="stage">
        <section className="stage-card stage-card--preview">
          <header className="stage-card__header">
            <div>
              <span className="rail-card__eyebrow">Rendered preview</span>
              <h2>Interactive surface</h2>
            </div>
            <p>The right side is a real `json-render` tree, not a mockup.</p>
          </header>
          <div className="preview-frame">
            <JsonRenderPreview spec={appliedSpec} store={store} />
          </div>
        </section>

        <section className="dock">
          <article className="stage-card">
            <header className="stage-card__header">
              <div>
                <span className="rail-card__eyebrow">State</span>
                <h2>Live snapshot</h2>
              </div>
              <p>Mirrors the external `StateStore` feeding the renderer.</p>
            </header>
            <pre className="dock-pre">{prettyJson(runtimeState)}</pre>
          </article>

          <article className="stage-card">
            <header className="stage-card__header">
              <div>
                <span className="rail-card__eyebrow">Actions</span>
                <h2>Dispatch log</h2>
              </div>
              <p>Collected through `registerActionObserver`.</p>
            </header>
            <div className="action-log">
              {actionLog.length === 0 ? (
                <p className="empty-copy">Trigger a button, watcher, or built-in state action to populate the log.</p>
              ) : (
                actionLog.map((entry) => (
                  <div key={entry.id} className={`action-log__entry is-${entry.status}`}>
                    <div className="action-log__title">
                      <strong>{entry.name}</strong>
                      <span>{new Date(entry.at).toLocaleTimeString()}</span>
                    </div>
                    {entry.params ? <pre>{prettyJson(entry.params)}</pre> : null}
                    <p>
                      {entry.status === "running"
                        ? "running"
                        : `${entry.status} in ${entry.durationMs ?? 0}ms${entry.error ? ` // ${entry.error}` : ""}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

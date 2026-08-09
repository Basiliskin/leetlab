import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { Annotation, EditorState, StateEffect } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  toggleComment,
} from "@codemirror/commands";
import { useAppStore } from "../infrastructure/store";

// Marks transactions dispatched by the editor itself (programmatic doc
// replacement, language reconfiguration) so the update listener can tell
// them apart from user edits and avoid a saveCode/store render ping-pong.
const external = Annotation.define<boolean>();

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    backgroundColor: "var(--panel2)",
    color: "#dbe4ee",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--mono)",
    lineHeight: "1.62",
    overflow: "auto",
  },
  ".cm-content": {
    padding: "14px 16px",
    caretColor: "var(--amber2)",
    tabSize: "2",
  },
  ".cm-line": { padding: "0" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-selectionMatch":
    { backgroundColor: "rgba(88,196,220,.25)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--amber2)" },
  ".cm-gutters": {
    backgroundColor: "var(--panel2)",
    borderRight: "1px solid var(--line-soft)",
    color: "#3d4a5a",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: "24px",
    padding: "0 12px 0 8px",
    textAlign: "right",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--amber)",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--panel)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    fontFamily: "var(--mono)",
    fontSize: "12.5px",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "rgba(255,161,22,.15)",
    color: "var(--amber)",
  },
});

function extensionsFor(lang: "js" | "ts") {
  const language = javascript(lang === "ts" ? { typescript: true } : undefined);
  return [
    language,
    autocompletion(),
    closeBrackets(),
    history(),
    keymap.of([
      { key: "Mod-/", run: toggleComment },
      { key: "Ctrl-/", run: toggleComment },
      indentWithTab,
      ...closeBracketsKeymap,
      ...completionKeymap,
      ...defaultKeymap,
      ...historyKeymap,
    ]),
    EditorView.updateListener.of((update) => {
      if (update.transactions.some((tr) => tr.annotation(external))) return;
      if (update.docChanged) {
        useAppStore.getState().saveCode(update.state.doc.toString());
      }
      if (update.selectionSet) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        useAppStore
          .getState()
          .setCursorPos(line.number, head - line.from + 1);
      }
    }),
    editorTheme,
  ];
}

export function CodeEditor() {
  const lang = useAppStore((s) => s.lang);
  const currentSlug = useAppStore((s) => s.currentSlug);
  const getProblem = useAppStore((s) => s.getProblem);
  const getProblemState = useAppStore((s) => s.getProblemState);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langRef = useRef(lang);

  const problem = getProblem(currentSlug);
  const state = getProblemState(currentSlug);
  const value = state[lang] ?? problem?.starter[lang] ?? "";

  // Mount exactly one EditorView; StrictMode-safe mount/destroy cycle.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const st = useAppStore.getState();
    const prob = st.getProblem(st.currentSlug);
    const ps = st.getProblemState(st.currentSlug);
    const doc = ps[st.lang] ?? prob?.starter[st.lang] ?? "";
    const view = new EditorView({
      state: EditorState.create({
        doc,
        extensions: extensionsFor(st.lang),
      }),
      parent: container,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Swap the language extension live when the JS/TS seg changes.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || langRef.current === lang) return;
    langRef.current = lang;
    view.dispatch({
      effects: StateEffect.reconfigure.of(extensionsFor(lang)),
      annotations: external.of(true),
    });
  }, [lang]);

  // Load the right document on problem/lang switch; skip when unchanged.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      annotations: external.of(true),
    });
  }, [value]);

  return (
    <div className="editor-body">
      <div ref={containerRef} className="cm-host" />
    </div>
  );
}

export default CodeEditor;

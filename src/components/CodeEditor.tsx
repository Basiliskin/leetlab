import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { Annotation, EditorState, StateEffect } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { javascript, javascriptLanguage, scopeCompletionSource } from "@codemirror/lang-javascript";
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
import { checkCode } from "../infrastructure/tsCheck";

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

const syntaxStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#5c6877", fontStyle: "italic" },
  { tag: [tags.keyword, tags.controlKeyword, tags.moduleKeyword, tags.self], color: "#ffa116" },
  { tag: [tags.string, tags.special(tags.string), tags.character], color: "#3fb950" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "#d29922" },
  { tag: [tags.regexp, tags.escape], color: "#f85149" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "#58c4dc" },
  { tag: [tags.definition(tags.variableName), tags.variableName], color: "#e8edf4" },
  { tag: [tags.propertyName, tags.attributeName], color: "#e8edf4" },
  { tag: [tags.typeName, tags.className, tags.namespace], color: "#ffc25e" },
  { tag: [tags.operator, tags.punctuation, tags.bracket, tags.separator], color: "#8b98a9" },
]);

// Flag Lezer parse-error nodes ("⚠") as lint diagnostics. Error nodes are
// skipped during traversal so nested errors only report the outermost span.
function syntaxDiag(view: EditorView): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state).iterate({
    enter(node) {
      if (node.type.isError) {
        if (node.from < node.to) {
          const text = view.state.doc.sliceString(node.from, node.to);
          diagnostics.push({
            from: node.from,
            to: node.to,
            severity: "error",
            message:
              text.length > 24
                ? "Syntax error"
                : `Unexpected ${text.trim() ? JSON.stringify(text) : "token"}`,
          });
        }
        return false;
      }
    },
  });
  return diagnostics;
}

const syntaxLint = linter((view) => syntaxDiag(view), { delay: 300 });

// TS mode: semantic + syntactic diagnostics from the runtime-loaded TS
// compiler. Degrades to parser-based errors while the compiler/libs load or
// if the CDN is unreachable.
const tsLint = linter(
  async (view) => {
    const ts = (window as any).ts;
    if (ts && typeof ts.createLanguageService === "function") {
      try {
        const code = view.state.doc.toString();
        const diags = await checkCode(code, ts);
        if (view.state.doc.toString() !== code) return []; // stale - doc changed mid-check
        // The doc may have been replaced while the async check was in
        // flight; drop stale out-of-range diagnostics so the lint renderer
        // never sees positions beyond the current document.
        const len = view.state.doc.length;
        return diags.filter((d) => d.from >= 0 && d.to <= len);
      } catch {
        return syntaxDiag(view);
      }
    }
    return syntaxDiag(view);
  },
  {
    delay: 400,
    // Re-check on selection changes too, so the no-op dispatch after the TS
    // compiler loads triggers a fresh type check without any edit.
    needsRefresh: (update) => update.selectionSet,
  }
);

function extensionsFor(lang: "js" | "ts") {
  const language = javascript(lang === "ts" ? { typescript: true } : undefined);
  return [
    language,
    javascriptLanguage.data.of({
      autocomplete: scopeCompletionSource(globalThis),
    }),
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
    syntaxHighlighting(syntaxStyle),
    lintGutter(),
    lang === "ts" ? tsLint : syntaxLint,
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
  const tsStatus = useAppStore((s) => s.tsStatus);
  const lastTsRef = useRef(tsStatus);

  // The linter only re-runs on editor transactions, so once the CDN TypeScript
  // compiler finishes loading (async, after the editor mounted) force a no-op
  // selection dispatch to trigger a fresh type check.
  useEffect(() => {
    if (lastTsRef.current === tsStatus) return;
    lastTsRef.current = tsStatus;
    const view = viewRef.current;
    if (view && tsStatus) {
      view.dispatch({
        selection: { anchor: view.state.selection.main.head },
        annotations: external.of(true),
      });
    }
  }, [tsStatus]);

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

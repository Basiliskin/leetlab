import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EditorView, keymap, showTooltip, ViewPlugin, type Tooltip, type TooltipView } from "@codemirror/view";
import { Annotation, EditorState, StateEffect, StateField } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
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
import { checkCode } from "../infrastructure/tsCheck";
import { editorCompletionSources } from "../infrastructure/editorCompletions";
import {
  close as closePopover,
  getState as getPopoverState,
  subscribe as subscribePopover,
  type PopoverState,
} from "../infrastructure/popoverBridge";
import {
  dispatchChoose,
  dispatchDecline,
  shouldRenderPopover,
} from "../infrastructure/usageTemplateDispatch";
import type { UsageTemplate } from "../infrastructure/typeUsageTemplates";
import { UsageTemplatePopover } from "./UsageTemplatePopover";

// Marks transactions dispatched by the editor itself (programmatic doc
// replacement, language reconfiguration) so the update listener can tell
// them apart from user edits and avoid a saveCode/store render ping-pong.
const external = Annotation.define<boolean>();

/**
 * The state field that holds the current usage-template popover, or
 * `null` when the popover is closed. The `provide` plugs this field
 * into the `showTooltip` facet — CodeMirror's tooltip rendering
 * machinery reads the field's value to decide what to mount. The
 * field is updated exclusively via `setUsageTemplateTooltip.of(...)`
 * from the bridge listener / `handlePick` / `handleDecline` paths.
 *
 * `Tooltip | null` is the facet's input shape (a single tooltip per
 * open); the field is initialised to `null` and never holds an
 * array. Storing the `Tooltip` value (the full descriptor with
 * `pos`, `create`, `getCoords`, etc.) means CodeMirror re-evaluates
 * the tooltip only when the field changes — and the picker's
 * `TooltipView.destroy` runs in lockstep with the field going back
 * to `null`.
 */
const usageTemplateTooltipField = StateField.define<Tooltip | null>({
  create: () => null,
  update: (value, tr) => {
    for (const e of tr.effects) {
      if (e.is(setUsageTemplateTooltip)) return e.value
    }
    return value
  },
  provide: (field) => showTooltip.from(field),
});

/**
 * Effect that swaps the field's value. Building a fresh `Tooltip`
 * for each open keeps the `TooltipView` lifecycle clean: every
 * `open` call replaces the field, CodeMirror destroys the old view
 * (calling our `destroy` which `root.unmount()`s the React tree)
 * and creates a new one.
 */
const setUsageTemplateTooltip = StateEffect.define<Tooltip | null>();

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
  // Usage-template popover (Phase 4, codeeditor-usage-templates). Inherits
  // the .cm-tooltip panel chrome (background/border/font/color) from the
  // block above; this rule layers the list layout, padding, and the
  // row/active/decline visual treatment on top. The list itself is
  // rendered by the React UsageTemplatePopover component.
  ".usage-template-popover": {
    listStyle: "none",
    margin: "0",
    padding: "4px 0",
    minWidth: "220px",
    maxWidth: "360px",
  },
  ".usage-template-popover__row": {
    display: "flex",
    flexDirection: "column",
    padding: "6px 14px",
    cursor: "pointer",
    color: "var(--ink)",
  },
  ".usage-template-popover__row--active, .usage-template-popover__row:hover": {
    backgroundColor: "rgba(255,161,22,.15)",
    color: "var(--amber)",
  },
  ".usage-template-popover__row--decline": {
    borderBottom: "1px solid var(--line-soft)",
    color: "var(--ink-dim, #8b98a9)",
  },
  ".usage-template-popover__label": {
    fontWeight: "600",
    fontSize: "12.5px",
  },
  ".usage-template-popover__desc": {
    fontSize: "11.5px",
    opacity: "0.75",
    marginTop: "2px",
  },
  ".usage-template-popover code": {
    fontFamily: "var(--mono)",
    color: "var(--amber)",
  },
  ".usage-template-popover:focus-visible": {
    outline: "1px solid var(--amber)",
    outlineOffset: "-1px",
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
    const ts = (window as unknown as { ts?: typeof import("typescript") }).ts;
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

/**
 * The usage-template popover extension (Phase 4, codeeditor-usage-templates).
 * Bridges the `popoverBridge` (module-level state owned by
 * `builtInTsCompletion.ts`'s function-form `apply`) to a CodeMirror
 * `showTooltip` facet that hosts the React picker. The extension is
 * built as a single `ViewPlugin` whose `update` listener dispatches
 * `showTooltip.of(...)` effects in response to bridge transitions.
 *
 * Two render-time guards — one at the dispatch site here, one inside
 * the React picker — guarantee the rubric's "no auto-insert" and
 * "only when templates exist" requirements. The popover is closed
 * silently when the document changes while the popover is open
 * (the bridge-anchor payload is stale, so further picks would
 * mis-splice); pure selection/cursor changes are ignored.
 *
 * Module-level state is shared with the production `popoverBridge`
 * (singleton); the test surface resets via the bridge's
 * `__resetForTests`.
 */
function usageTemplatePopoverExtension() {
  return ViewPlugin.fromClass(
    class {
      readonly view: EditorView;
      private readonly unsubscribe: () => void;
      // `true` while the tooltip is mounted; flipped to `false` in
      // `destroy` so a late `handlePick` / `handleDecline` from the
      // React root (e.g. queued from a keypress right before teardown)
      // is a no-op rather than a stray dispatch.
      private mounted = false;
      // The current `PopoverState` snapshot. Captured here (not in a
      // module-level slot) so each editor view has its own anchor;
      // the bridge is shared because there is only one editor in
      // production, but the test surface mounts a fresh view in
      // each case.
      private currentState: PopoverState | null = null;

      constructor(view: EditorView) {
        this.view = view;
        // Seed with the bridge's current state on mount so an accept
        // that fires before the editor's first measure still renders.
        this.currentState = getPopoverState();
        this.unsubscribe = subscribePopover((state) => this.handleBridge(state));
        // If the bridge is already open at mount time, mount the
        // tooltip immediately. Otherwise the next bridge transition
        // (an accept) will mount it.
        if (shouldRenderPopover(this.currentState)) {
          this.showTooltip();
        }
        // Click-outside / window-blur dismiss:
        //   - click-outside: a mousedown anywhere not inside the
        //     popover triggers decline. We use a capture-phase
        //     listener on the document so the popover's own clicks
        //     (which fire *inside* the popover) are not seen here.
        //   - window-blur: alt-tab / devtools / window-minimize
        //     fires `blur` on the window. Decline is a no-op when
        //     the popover is already closed.
        document.addEventListener("mousedown", this.onDocMouseDown, true);
        window.addEventListener("blur", this.onWindowBlur);
      }

      update(update: { docChanged: boolean }): void {
        // The bridge-anchor payload (source/pos/from/to) is a
        // snapshot of the document at accept time. If the doc moves
        // under us, the resolved range is no longer meaningful —
        // close the popover without dispatching. Pure selection
        // changes are ignored; phase 3's `coordsAtPos` was measured
        // at accept time and we don't re-anchor.
        if (this.currentState !== null && update.docChanged) {
          closePopover();
        }
      }

      destroy(): void {
        this.mounted = false;
        this.unsubscribe();
        document.removeEventListener("mousedown", this.onDocMouseDown, true);
        window.removeEventListener("blur", this.onWindowBlur);
      }

      /**
       * Build and dispatch the tooltip descriptor that mounts the
       * popover at the bridge's stored coords. The tooltip is a
       * host element for a React root; the React `UsageTemplatePopover`
       * renders the rows inside it.
       */
      private showTooltip(): void {
        const state = this.currentState;
        if (!state) return;
        const tooltip: Tooltip = {
          pos: state.from,
          // `above: false` so the popover hangs below the cursor by
          // default. The picker can grow upward on small viewports
          // but CodeMirror's `TooltipView.offset` handles that.
          above: false,
          // `clip: false` keeps the popover visible even if the
          // anchor coords are slightly outside the editor viewport.
          clip: false,
          create: (): TooltipView => {
            const dom = document.createElement("div");
            dom.className = "cm-tooltip";
            let root: Root | null = null;
            return {
              dom,
              getCoords: () => ({
                left: state.coords.x,
                top: state.coords.y,
                right: state.coords.x,
                bottom: state.coords.y,
              }),
              mount: () => {
                this.mounted = true;
                root = createRoot(dom);
                root.render(
                  <UsageTemplatePopover
                    state={state}
                    onPick={(tpl: UsageTemplate) => this.handlePick(tpl)}
                    onDecline={() => this.handleDecline()}
                  />,
                );
              },
              destroy: () => {
                this.mounted = false;
                if (root) {
                  root.unmount();
                  root = null;
                }
              },
            };
          },
        };
        this.view.dispatch({ effects: setUsageTemplateTooltip.of(tooltip) });
      }

      /**
       * Clear the popover. Dispatched when the bridge closes (e.g.
       * the user picks a row) or when the document drifts under us.
       */
      private hideTooltip(): void {
        this.view.dispatch({ effects: setUsageTemplateTooltip.of(null) });
      }

      private handleBridge(state: PopoverState | null): void {
        this.currentState = state;
        if (shouldRenderPopover(state)) {
          this.showTooltip();
        } else {
          this.hideTooltip();
        }
      }

      /**
       * User picked a template row. Compute the dispatch via
       * `dispatchChoose`, hand it to `view.dispatch`, and close the
       * bridge so the `showTooltip.of(null)` effect tears the
       * tooltip down. Wrapped in `try / finally` so a thrown
       * dispatch (e.g. invalid range) still tears the popover down.
       */
      private handlePick(template: UsageTemplate): void {
        if (!this.mounted) return;
        const state = this.currentState;
        if (!state) return;
        try {
          const payload = dispatchChoose(state, template);
          this.view.dispatch({
            changes: payload.changes,
            selection: payload.selection,
            annotations: payload.annotations,
          });
        } finally {
          closePopover();
        }
      }

      /**
       * User declined (Escape / click-outside / window-blur / the
       * explicit "Decline" row). Same shape as `handlePick` but
       * uses `dispatchDecline` so the splice is the bare identifier.
       */
      private handleDecline(): void {
        if (!this.mounted) return;
        const state = this.currentState;
        if (!state) return;
        try {
          const payload = dispatchDecline(state);
          this.view.dispatch({
            changes: payload.changes,
            selection: payload.selection,
            annotations: payload.annotations,
          });
        } finally {
          closePopover();
        }
      }

      /**
       * Document-level click handler. A mousedown anywhere not
       * inside the popover closes it (which triggers decline via
       * the `close` → `handleBridge(null)` → `hideTooltip` path).
       * Inside-the-popover clicks are filtered out by walking up
       * the DOM tree from the click target — the picker renders
       * `<ul class="usage-template-popover">` inside the popover,
       * and `target.closest(".usage-template-popover")` matches
       * any descendant. The capture phase is used so the close
       * fires before any bubbled click handler on the editor.
       */
      private onDocMouseDown = (event: MouseEvent): void => {
        if (this.currentState === null) return;
        const target = event.target;
        if (target instanceof Element && target.closest(".usage-template-popover")) {
          return;
        }
        closePopover();
      };

      /**
       * Window-blur handler. The user alt-tabbed, opened devtools,
       * or minimized the window. We decline (insert the bare
       * identifier) so the accept isn't lost. `close` is a no-op
       * when the popover is already closed.
       */
      private onWindowBlur = (): void => {
        if (this.currentState === null) return;
        // `handleDecline` reads `this.mounted`; if the tooltip is
        // gone (the editor view was destroyed) we still call
        // `closePopover` to drop bridge state for the next mount.
        if (this.mounted) {
          this.handleDecline();
        } else {
          closePopover();
        }
      };
    },
  );
}

function extensionsFor(lang: "js" | "ts") {
  const language = javascript(lang === "ts" ? { typescript: true } : undefined);
  return [
    language,
    // The three autocomplete facet entries (scope, sandbox service, and the
    // TS-only built-in type-aware source) live in editorCompletions.ts; each
    // is a separate .of(), never an array.
    ...editorCompletionSources(lang),
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
    // The usage-template popover field is registered as its own
    // extension so CodeMirror's tooltip rendering can read it via
    // the `showTooltip.from(field)` provide. The ViewPlugin below
    // holds the bridge subscription; together they form the
    // popover extension pair.
    usageTemplateTooltipField,
    usageTemplatePopoverExtension(),
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

import { useEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useAppStore } from "../infrastructure/store";

const HL_RE =
  /(\/\/[^\n]*)|(\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*")|('(?:\\.|[^'\\\n])*')|(`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|if|else|for|while|do|switch|case|default|break|continue|new|class|extends|super|import|export|from|try|catch|finally|throw|async|await|yield|delete|void|typeof|instanceof|in|of|static|get|set|this|interface|type|enum|implements|declare|readonly|public|private|protected|namespace|as|keyof|infer|abstract|is)\b|\b(true|false|null|undefined|NaN|Infinity)\b|(\b\d[\w]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|(\b[A-Z][A-Za-z0-9_$]*\b)/g;
const HL_CLS = [
  "tk-com",
  "tk-com",
  "tk-str",
  "tk-str",
  "tk-str",
  "tk-kw",
  "tk-lit",
  "tk-num",
  "tk-fn",
  "tk-cls",
];

function esc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function CodeEditor() {
  const lang = useAppStore((s) => s.lang);
  const currentSlug = useAppStore((s) => s.currentSlug);
  const getProblem = useAppStore((s) => s.getProblem);
  const getProblemState = useAppStore((s) => s.getProblemState);
  const saveCode = useAppStore((s) => s.saveCode);
  const setCursorPos = useAppStore((s) => s.setCursorPos);

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const numsRef = useRef<HTMLDivElement | null>(null);

  const problem = getProblem(currentSlug);
  const state = getProblemState(currentSlug);
  const value = state[lang] || problem?.starter[lang] || "";

  useEffect(() => {
    if (!preRef.current || !taRef.current) return;
    preRef.current.innerHTML = highlight(value);
    taRef.current.value = value;
    renderNums(value.split("\n").length);
  }, [currentSlug, lang]);

  function highlight(src: string) {
    const re = new RegExp(HL_RE.source, "g");
    let out = "";
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += esc(src.slice(last, m.index));
      let cls = "";
      for (let g = 1; g <= 10; g++)
        if (m[g] !== undefined) {
          cls = HL_CLS[g - 1] || "";
          break;
        }
      out += `<span class="${cls}">${esc(m[0])}</span>`;
      last = re.lastIndex;
    }
    if (last < src.length) out += esc(src.slice(last));
    return out;
  }

  function renderNums(lineCount: number) {
    let html = "";
    for (let i = 1; i <= lineCount; i++) html += `<div>${i}</div>`;
    if (numsRef.current) numsRef.current.innerHTML = html;
  }

  function onInput() {
    const ta = taRef.current!;
    const pre = preRef.current!;
    pre.innerHTML = highlight(ta.value);
    renderNums(ta.value.split("\n").length);
    saveCode(ta.value);
  }

  function toggleComment() {
    const ta = taRef.current!;
    const v = ta.value;
    const s = ta.selectionStart;
    const en = ta.selectionEnd;
    const ls = v.lastIndexOf("\n", s - 1) + 1;
    let le = v.indexOf("\n", en);
    if (le === -1) le = v.length;
    const lines = v.slice(ls, le).split("\n");
    const allC = lines.every((l) => /^\s*\/\/|^$/.test(l));
    const mod = lines
      .map((l) =>
        allC
          ? l.replace(/^(\s*)\/\/ ?/, "$1")
          : l.trim()
            ? l.replace(/^(\s*)/, "$1// ")
            : l,
      )
      .join("\n");
    ta.setRangeText(mod, ls, le, "select");
    onInput();
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    const ta = taRef.current!;
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ta.selectionStart;
      const en = ta.selectionEnd;
      const v = ta.value;
      if (s !== en && v.slice(s, en).includes("\n")) {
        const ls = v.lastIndexOf("\n", s - 1) + 1;
        let le = v.indexOf("\n", en);
        if (le === -1) le = v.length;
        const block = v.slice(ls, le);
        const mod = e.shiftKey
          ? block.replace(/^ {1,2}/gm, "")
          : block.replace(/^/gm, "  ");
        ta.setRangeText(mod, ls, le, "select");
        onInput();
      } else if (e.shiftKey) {
        const ls = v.lastIndexOf("\n", s - 1) + 1;
        const m = v.slice(ls).match(/^ {1,2}/);
        if (m) {
          ta.setRangeText("", ls, ls + m[0].length, "end");
          onInput();
        }
      } else {
        ta.setRangeText("  ", s, en, "end");
        onInput();
      }
    } else if (
      e.key === "Enter" &&
      !e.nativeEvent.isComposing &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      const s = ta.selectionStart;
      const before = ta.value.slice(0, s);
      const line = before.slice(before.lastIndexOf("\n") + 1);
      const indent = (line.match(/^\s*/) || [""])[0];
      const extra = /[{([:]\s*$/.test(line) ? "  " : "";
      ta.setRangeText("\n" + indent + extra, s, ta.selectionEnd, "end");
      onInput();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      toggleComment();
    }
  }

  function trackCaret() {
    const ta = taRef.current!;
    const s = ta.selectionStart;
    const before = ta.value.slice(0, s);
    const ln = before.split("\n").length;
    const col = s - before.lastIndexOf("\n");
    setCursorPos(ln, col);
  }

  function onScroll() {
    const ta = taRef.current!;
    const pre = preRef.current!;
    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
    if (numsRef.current) {
      numsRef.current.style.transform = `translateY(${-ta.scrollTop}px)`;
    }
  }

  return (
    <div className="editor-pane">
      <div className="editor-body">
        <div className="gutter">
          <div className="nums" ref={numsRef} />
        </div>
        <div className="code-area">
          <pre id="hl" ref={preRef} aria-hidden="true" />
          <textarea
            id="ta"
            ref={taRef}
            wrap="off"
            spellCheck={false}
            onInput={onInput}
            onKeyDown={onKeyDown}
            onScroll={onScroll}
            onSelect={trackCaret}
            onKeyUp={trackCaret}
            onClick={trackCaret}
          />
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;

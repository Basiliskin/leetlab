import { useEffect, useRef } from "react";
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

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  const problem = getProblem(currentSlug);
  const state = getProblemState(currentSlug);
  const value = state[lang] || problem?.starter[lang] || "";

  useEffect(() => {
    if (!preRef.current || !taRef.current) return;
    preRef.current.innerHTML = highlight(value);
    taRef.current.value = value;
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

  function onInput() {
    const ta = taRef.current!;
    const pre = preRef.current!;
    pre.innerHTML = highlight(ta.value);
    saveCode(ta.value);
  }

  return (
    <div className="editor-pane">
      <div className="editor-body">
        <div className="gutter">
          <div className="nums" />
        </div>
        <div className="code-area">
          <pre id="hl" ref={preRef} aria-hidden="true" />
          <textarea
            id="ta"
            ref={taRef}
            wrap="off"
            spellCheck={false}
            onInput={onInput}
          />
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;

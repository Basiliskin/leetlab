import Editor from "@monaco-editor/react";
import { useAppStore } from "@infra/store";

export function EditorPane() {
  const { lang, currentSlug, getProblem, getProblemState, saveCode } =
    useAppStore();

  const problem = getProblem(currentSlug);
  const state = getProblemState(currentSlug);
  const defaultValue = state[lang] || problem?.starter[lang] || "";

  return (
    <div className="editor-pane">
      <div className="editor-head">
        <div className={`seg ${lang === "ts" ? "ts" : ""}`}>
          <div className="thumb" />
          <button
            data-lang="js"
            className={lang === "js" ? "on" : ""}
            onClick={() => useAppStore.getState().setLang("js")}
          >
            JavaScript
          </button>
          <button
            data-lang="ts"
            className={lang === "ts" ? "on" : ""}
            onClick={() => useAppStore.getState().setLang("ts")}
          >
            TypeScript
          </button>
        </div>
      </div>
      <div className="editor-body">
        <Editor
          height="100%"
          language={lang === "ts" ? "typescript" : "javascript"}
          value={defaultValue}
          onChange={(v) => v && saveCode(v)}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "JetBrains Mono, monospace",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "off",
          }}
        />
      </div>
    </div>
  );
}

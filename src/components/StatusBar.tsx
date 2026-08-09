import { useAppStore } from "../infrastructure/store";

export function StatusBar() {
  const lang = useAppStore((s) => s.lang);
  const cursorLine = useAppStore((s) => s.cursorLine);
  const cursorCol = useAppStore((s) => s.cursorCol);
  return (
    <footer className="statusbar">
      <span id="sbPos">
        Ln {cursorLine}, Col {cursorCol}
      </span>
      <span id="sbLang">{lang === "ts" ? "typescript" : "javascript"}</span>
      <span className="led">
        <i></i>sandbox · worker ready
      </span>
      <div className="spacer" />
      <span>code runs 100% locally in your browser</span>
    </footer>
  );
}

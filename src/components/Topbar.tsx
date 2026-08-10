import { useState } from "react";
import { useAppStore, useMergedBank } from "../infrastructure/store";
import { downloadFullState } from "../infrastructure/fullStateExport";
import { GenerateModal } from "./GenerateModal";
import { ImportModal } from "./ImportModal";

export function Topbar() {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const bankLength = useMergedBank().length;
  const solvedCount = Object.values(
    useAppStore((s) => s.problems) || {},
  ).filter((p) => p.solvedAt).length;
  const tsStatus = useAppStore((s) => s.tsStatus);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">{}</div>
        <div>
          <b>
            leet<span>lab</span>
          </b>{" "}
          <small>in-browser judge</small>
        </div>
      </div>
      <div className="spacer" />
      <div className="progress">
        <div className="segs">
          {Array.from({ length: bankLength }).map((_, i) => (
            <i key={i} className={i < solvedCount ? "on" : ""} />
          ))}
        </div>
        <div className="cnt">
          <b>{solvedCount}</b>/<span>{bankLength}</span> solved
        </div>
      </div>
      <div
        className={`tsbadge ${tsStatus === "ready" ? "ok" : tsStatus === "fallback" ? "warn" : ""}`}
        id="tsBadge"
      >
        {tsStatus === "ready"
          ? "TS · compiler ready"
          : tsStatus === "fallback"
            ? "TS · fallback stripper"
            : "TS · loading…"}
      </div>
      <button className="gen-btn" onClick={() => setGenerateOpen(true)}>
        + Generate
      </button>
      <button className="gen-btn" onClick={downloadFullState}>
        ⇩ Export
      </button>
      <button className="gen-btn" onClick={() => setImportOpen(true)}>
        ⇧ Import
      </button>
      <GenerateModal open={generateOpen} onClose={() => setGenerateOpen(false)} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </header>
  );
}

import { useState } from "react";
import { useAppStore, useMergedBank } from "../infrastructure/store";
import { downloadFullState } from "../infrastructure/fullStateExport";
import { GenerateModal } from "./GenerateModal";
import { ImportModal } from "./ImportModal";
import { ManageProvidersModal } from "./ManageProvidersModal";

interface TopbarProps {
  navOpen?: boolean;
  onToggleNav?: () => void;
}

export function Topbar({ navOpen = false, onToggleNav }: TopbarProps) {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [providersOpen, setProvidersOpen] = useState(false);
  // Phone-only overflow menu: at phone widths the four action buttons fold
  // behind this toggle (the menu is inert/hidden on desktop).
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const bankLength = useMergedBank().length;
  const visualSegments = 20;
  const solvedCount = Object.values(
    useAppStore((s) => s.problems) || {},
  ).filter((p) => p.solvedAt).length;
  const solvedSegments = bankLength
    ? Math.round((solvedCount / bankLength) * visualSegments)
    : 0;
  const tsStatus = useAppStore((s) => s.tsStatus);

  return (
    <header className="topbar">
      <button
        className="gen-btn nav-toggle"
        aria-label="Problem list"
        aria-expanded={navOpen}
        onClick={onToggleNav}
      >
        ☰
      </button>
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
          {Array.from({ length: visualSegments }).map((_, i) => (
            <i key={i} className={i < solvedSegments ? "on" : ""} />
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
      <button
        className="gen-btn mobile-menu-btn"
        aria-label="More actions"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        ⋯
      </button>
      <div className={`top-actions ${menuOpen ? "open" : ""}`}>
        <button
          className="gen-btn"
          onClick={() => {
            setGenerateOpen(true);
            closeMenu();
          }}
        >
          + Generate
        </button>
        <button
          className="gen-btn"
          onClick={() => {
            setProvidersOpen(true);
            closeMenu();
          }}
        >
          ⚙ Providers
        </button>
        <button
          className="gen-btn"
          onClick={() => {
            downloadFullState();
            closeMenu();
          }}
        >
          ⇩ Export
        </button>
        <button
          className="gen-btn"
          onClick={() => {
            setImportOpen(true);
            closeMenu();
          }}
        >
          ⇧ Import
        </button>
      </div>
      {menuOpen && <div className="menu-backdrop" onClick={closeMenu} />}
      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
      />
      <ManageProvidersModal
        open={providersOpen}
        onClose={() => setProvidersOpen(false)}
      />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </header>
  );
}

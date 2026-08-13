import { useEffect, useState } from "react";
import { Topbar } from "@components/Topbar";
import { Sidebar } from "@components/Sidebar";
import { EditorPane } from "@components/EditorPane";
import { DescPane } from "@components/DescPane";
import { Drawer } from "@components/Drawer";
import { StatusBar } from "@components/StatusBar";
import { initVisualViewport } from "./infrastructure/visualViewport";
import "./styles/globals.css";

export function App() {
  // Publish --visual-viewport-height / --keyboard-offset on :root so the
  // mobile keyboard bar can anchor Run/Submit above the OS soft keyboard.
  useEffect(() => {
    const dispose = initVisualViewport();
    return () => dispose?.();
  }, []);

  // Mobile view-state flags: at phone widths the code editor claims the full
  // workspace and the problem description becomes a tabbed overlay, while the
  // sidebar is reached through a slide-in drawer. On desktop the flags are
  // inert (the CSS that reacts to `.desc-open` / `.sidebar.open` is
  // phone-scoped), and the workspace keeps the split layout regardless.
  const [mobileDescOpen, setMobileDescOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const closeNav = () => setMobileNavOpen(false);

  return (
    <>
      <div className="bgfx" aria-hidden="true">
        <i />
        <i />
      </div>
      <Topbar
        navOpen={mobileNavOpen}
        onToggleNav={() => setMobileNavOpen((o) => !o)}
      />
      <div className="shell">
        <Sidebar open={mobileNavOpen} onClose={closeNav} />
        {mobileNavOpen && (
          <div className="sidebar-backdrop" onClick={closeNav} />
        )}
        <main className={`workspace ${mobileDescOpen ? "desc-open" : ""}`}>
          <div className="mobile-tabs">
            <button
              className={`ptab ${!mobileDescOpen ? "on" : ""}`}
              onClick={() => setMobileDescOpen(false)}
            >
              Editor
            </button>
            <button
              className={`ptab ${mobileDescOpen ? "on" : ""}`}
              onClick={() => setMobileDescOpen(true)}
            >
              Description
            </button>
          </div>
          <DescPane />
          <div className="divider" />
          <section className="pane editor-pane">
            <EditorPane />
            <Drawer />
          </section>
        </main>
      </div>
      <StatusBar />
    </>
  );
}

export default App;

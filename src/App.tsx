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

  // Mobile view-state flag: at phone widths the code editor claims the full
  // workspace and the problem description becomes a tabbed overlay. On
  // desktop the flag is inert (the CSS that reacts to `.desc-open` is
  // phone-scoped), and the workspace keeps the split layout regardless.
  const [mobileDescOpen, setMobileDescOpen] = useState(false);

  return (
    <>
      <div className="bgfx" aria-hidden="true">
        <i />
        <i />
      </div>
      <Topbar />
      <div className="shell">
        <Sidebar />
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

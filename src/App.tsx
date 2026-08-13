import { useEffect } from "react";
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

  return (
    <>
      <div className="bgfx" aria-hidden="true">
        <i />
        <i />
      </div>
      <Topbar />
      <div className="shell">
        <Sidebar />
        <main className="workspace">
          <DescPane />
          <div className="divider" />
          <section className="pane editor-pane">
            <EditorPane />
            <Drawer />
            {/* Footer buttons here */}
          </section>
        </main>
      </div>
      <StatusBar />
    </>
  );
}

export default App;

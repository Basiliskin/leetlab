import { Topbar } from "@components/Topbar";
import { Sidebar } from "@components/Sidebar";
import { EditorPane } from "@components/EditorPane";
import { DescPane } from "@components/DescPane";
import { Drawer } from "@components/Drawer";
import { StatusBar } from "@components/StatusBar";
import "./styles/globals.css";

export function App() {
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

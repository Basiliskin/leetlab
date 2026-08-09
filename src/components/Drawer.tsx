import { useAppStore } from "../infrastructure/store";

export function Drawer() {
  const cases = useAppStore((s) => s.getCases());
  const selected = useAppStore((s) => s.selectedCaseIdx);
  const selectCase = useAppStore((s) => s.selectCase);
  const addCase = useAppStore((s) => s.addCase);
  const deleteCase = useAppStore((s) => s.deleteCase);
  const updateCase = useAppStore((s) => s.updateCase);
  const restoreCases = useAppStore((s) => s.restoreCases);

  const cur = cases[selected] || null;
  const currentSlug = useAppStore((s) => s.currentSlug);
  const caseMarks = useAppStore((s) => s.caseMarks);
  const lastRun = useAppStore((s) => (s.lastRuns || {})[currentSlug] || null);
  const activeTab = useAppStore((s) => s.activeResultTab);
  const setActiveTab = useAppStore((s) => s.setActiveResultTab);

  return (
    <div className="drawer">
      <div className="pane-tabs">
        <button
          className={`ptab ${activeTab === "test" ? "on" : ""}`}
          id="tabTest"
          onClick={() => setActiveTab("test")}
        >
          Testcases
        </button>
        <button
          className={`ptab ${activeTab === "result" ? "on" : ""}`}
          id="tabResult"
          onClick={() => setActiveTab("result")}
        >
          Result{" "}
          <span className="badge" hidden={!lastRun}>
            {lastRun ? `${lastRun.passed}/${lastRun.total}` : ""}
          </span>
        </button>
        <button
          className={`ptab ${activeTab === "console" ? "on" : ""}`}
          id="tabConsole"
          onClick={() => setActiveTab("console")}
        >
          Console{" "}
          <span className="badge" hidden={!(lastRun && lastRun.logs && lastRun.logs.length)}>
            {lastRun && lastRun.logs ? lastRun.logs.length : ""}
          </span>
        </button>
      </div>
      <div className="drawer-body">
        <div className="tc-view" hidden={activeTab !== "test"}>
          <div className="case-pills">
            {cases.map((c, i) => (
              <button
                key={c.id}
                className={`cpill ${i === selected ? "on" : ""}`}
                data-i={i}
                onClick={() => selectCase(i)}
              >
                <span className="mk" />
                Case {i + 1}
              </button>
            ))}
            <button className="cpill cpill-add" onClick={() => addCase()}>
              + Add case
            </button>
          </div>
          <div className="tc-grid">
            <div className="tc-field">
              <label>
                <span>Input · JSON args</span>
              </label>
              <textarea
                value={cur?.inputText || ""}
                onChange={(e) =>
                  updateCase(selected, "inputText", e.target.value)
                }
              />
              <div className="parse-err" />
            </div>
            <div className="tc-field">
              <label>
                <span>Expected · JSON</span>
              </label>
              <textarea
                value={cur?.expectedText || ""}
                onChange={(e) =>
                  updateCase(selected, "expectedText", e.target.value)
                }
              />
              <div className="parse-err" />
            </div>
          </div>
          <div className="drawer-tools">
            <button className="ghost-btn" onClick={() => restoreCases()}>
              Restore default cases
            </button>
            <button className="ghost-btn" onClick={() => deleteCase(selected)}>
              Delete case
            </button>
          </div>
        </div>

        <div className="res-view" hidden={activeTab !== "result"}>
          {lastRun ? (
            <>
              {lastRun.compile ? (
                <div className="compile-banner">
                  <b>{lastRun.compile.name}:</b> {lastRun.compile.message}
                </div>
              ) : null}
              <div className="res-summary">
                <span
                  className={`rchip ${lastRun.verdict === "Accepted" ? "good" : lastRun.verdict === "Time Limit Exceeded" ? "warn" : "bad"}`}
                >
                  {lastRun.verdict}
                </span>
                <span className="rchip">
                  {lastRun.passed}/{lastRun.total} expected passed
                </span>
                <span className="rchip">
                  runtime{" "}
                  {lastRun.ms != null ? lastRun.ms.toFixed(2) + " ms" : "—"}
                </span>
              </div>
              <div id="resRows">
                {(lastRun.results || []).map((m: any, idx: number) => {
                  const parsed = cases[idx] || {};
                  const mark = caseMarks[parsed.id] || "";
                  return (
                    <div key={idx} className={`rrow ${mark}`}>
                      <div className="rrow-h">
                        <span className="ic">
                          {mark === "pass"
                            ? "✓"
                            : mark === "fail"
                              ? "✗"
                              : mark === "err"
                                ? "!"
                                : "⏱"}
                        </span>
                        <span className="nm">Case {idx + 1}</span>
                        <span className="vd">
                          {m && m.pass === null && m.ok ? "output only" : ""}
                        </span>
                        <span className="ms">
                          {m && m.ms ? m.ms.toFixed(2) + " ms" : ""}
                        </span>
                      </div>
                      <div className="rrow-b">
                        <div className="row-line">
                          <b>input</b>
                          {JSON.stringify(parsed.inputText || "")}
                        </div>
                        {!m || !m.ok ? (
                          <div className="row-line errmsg">
                            <b>error</b>
                            {m && m.error
                              ? `${m.error.name}: ${m.error.message}`
                              : "Runtime error"}
                          </div>
                        ) : (
                          <>
                            {m.hasExp ? (
                              <div
                                className={`row-line ${m.pass ? "good-val" : "bad-val"}`}
                              >
                                <b>expected</b>
                                {m.hasExp
                                  ? JSON.stringify(parsed.expectedText || "")
                                  : ""}
                              </div>
                            ) : null}
                            <div
                              className={`row-line ${m.pass ? "good-val" : m.hasExp ? "bad-val" : ""}`}
                            >
                              <b>output</b>
                              {m ? m.output : ""}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {lastRun.logs && lastRun.logs.length ? (
                <div className="console-block">
                  <div className="ch">
                    console output · {lastRun.logs.length} line
                    {lastRun.logs.length > 1 ? "s" : ""}
                  </div>
                  {lastRun.logs.map((l: any, i: number) => (
                    <div key={i} className={`cl ${l.l === "log" ? "" : l.l}`}>
                      {l.t}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty">
              <b>No results yet</b>
            </div>
          )}
        </div>

        <div className="console-view" hidden={activeTab !== "console"}>
          {lastRun && lastRun.logs && lastRun.logs.length ? (
            <div className="console-block">
              <div className="ch">
                console output · {lastRun.logs.length} line
                {lastRun.logs.length > 1 ? "s" : ""}
              </div>
              {lastRun.logs.map((l: any, i: number) => (
                <div key={i} className={`cl ${l.l === "log" ? "" : l.l}`}>
                  {l.t}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <b>No console output</b>
              <span>Logs from console.log() will appear here.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useAppStore } from "../infrastructure/store";

export function DescPane() {
  const currentSlug = useAppStore((s) => s.currentSlug);
  const getProblem = useAppStore((s) => s.getProblem);
  const solvedAt = useAppStore((s) => s.problems[currentSlug]?.solvedAt);
  const subs = useAppStore((s) => s.problems[currentSlug]?.subs) ?? [];

  const p = getProblem(currentSlug);
  const reversed = subs.slice().reverse();

  return (
    <section className="pane desc-pane" id="descPane">
      <div className="pane-tabs">
        <button className="ptab on" id="tabDesc">
          Description
        </button>
        <button className="ptab" id="tabSubs">
          Submissions <span className="badge">{subs.length}</span>
        </button>
      </div>
      <div className="pane-scroll" id="descView">
        <div className="desc-body" id="descBody">
          {p ? (
            <>
              <div className="d-top">
                <span className="d-num">#{p.num}</span>
                <span className={`pill ${p.difficulty}`}>{p.difficulty}</span>
                {solvedAt ? (
                  <span className="solved-badge">
                    ✓ ACCEPTED · {new Date(solvedAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
              <h1>{p.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: p.desc }} />
              {p.hints?.length ? (
                <>
                  <h4>Hints</h4>
                  {p.hints.map((h, i) => (
                    <details className="hint" key={`${currentSlug}-${i}`}>
                      <summary>Hint {i + 1}</summary>
                      <p>{h}</p>
                    </details>
                  ))}
                </>
              ) : null}
            </>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: "<div />" }} />
          )}
        </div>
      </div>
      <div className="pane-scroll" id="subsView" hidden>
        <div className="subs">
          {reversed.length ? (
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Language</th>
                  <th>Verdict</th>
                  <th>Cases</th>
                  <th>Runtime</th>
                </tr>
              </thead>
              <tbody>
                {reversed.map((s, i) => (
                  <tr key={i}>
                    <td>{new Date(s.t).toLocaleString()}</td>
                    <td>{s.lang === "ts" ? "TypeScript" : "JavaScript"}</td>
                    <td
                      style={{
                        color:
                          s.verdict === "Accepted"
                            ? "var(--green)"
                            : s.verdict === "Compile Error"
                              ? "var(--amber2)"
                              : "var(--red)",
                      }}
                    >
                      {s.verdict}
                    </td>
                    <td>
                      {s.passed}/{s.total}
                    </td>
                    <td>{s.ms != null ? s.ms.toFixed(1) + " ms" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <b>No submissions yet</b> Press Submit to record your first
              attempt.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

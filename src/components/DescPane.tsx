import { useEffect, useRef } from "react";
import { useAppStore, type PaneTab } from "../infrastructure/store";
import { RunViews } from "./RunViews";

export function DescPane() {
  const currentSlug = useAppStore((s) => s.currentSlug);
  const getProblem = useAppStore((s) => s.getProblem);
  const solvedAt = useAppStore((s) => s.problems[currentSlug]?.solvedAt);
  const subs = useAppStore((s) => s.problems[currentSlug]?.subs) ?? [];
  const collapsed = useAppStore((s) => s.collapsed.desc);
  const toggleCollapsed = useAppStore((s) => s.toggleCollapsed);
  const tab = useAppStore((s) => s.activePaneTab);
  const setTab = useAppStore((s) => s.setActivePaneTab);
  const lastRun = useAppStore((s) => s.lastRuns?.[currentSlug] ?? null);
  const logCount = lastRun?.logs?.length ?? 0;

  // Five tabs can overflow a narrow pane (the bar scrolls horizontally);
  // keep the active one in view, e.g. when a run jumps to Result (re-run
  // once the result lands, since its badge widens the tab).
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [tab, lastRun]);

  const tabs: { id: PaneTab; label: string; badge?: string | number }[] = [
    { id: "desc", label: "Description" },
    { id: "subs", label: "Submissions", badge: subs.length },
    { id: "test", label: "Testcases" },
    {
      id: "result",
      label: "Result",
      badge: lastRun ? `${lastRun.passed}/${lastRun.total}` : undefined,
    },
    { id: "console", label: "Console", badge: logCount || undefined },
  ];

  const p = getProblem(currentSlug);
  const reversed = subs.slice().reverse();

  return (
    <section
      className={`pane desc-pane ${collapsed ? "collapsed" : ""}`}
      id="descPane"
    >
      <button
        className="rail-btn"
        onClick={() => toggleCollapsed("desc")}
        title="Show problem pane"
        aria-label="Show problem pane"
      >
        <span className="rail-ico">»</span>
        <span className="rail-label">Problem · Tests</span>
      </button>
      <div className="pane-tabs">
        <div className="tabs-scroll">
          {tabs.map((t) => (
            <button
              key={t.id}
              ref={tab === t.id ? activeTabRef : undefined}
              className={`ptab ${tab === t.id ? "on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.badge !== undefined ? (
                <span className="badge">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
        <button
          className="collapse-btn"
          onClick={() => toggleCollapsed("desc")}
          title="Hide problem pane"
          aria-label="Hide problem pane"
        >
          «
        </button>
      </div>
      <div className="pane-scroll" id="descView" hidden={tab !== "desc"}>
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
      <div className="pane-scroll" id="subsView" hidden={tab !== "subs"}>
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
      <RunViews />
    </section>
  );
}

import { PROBLEM_BANK } from "../infrastructure/problemBank";
import { useAppStore } from "../infrastructure/store";

export function Sidebar() {
  const selectProblem = useAppStore((s) => s.selectProblem);
  const currentSlug = useAppStore((s) => s.currentSlug);
  const filter = useAppStore((s) => s.filter);
  const status = useAppStore((s) => s.status);
  const search = useAppStore((s) => s.search);
  const setFilter = useAppStore((s) => s.setFilter);
  const setStatus = useAppStore((s) => s.setStatus);
  const setSearch = useAppStore((s) => s.setSearch);
  const problems = useAppStore((s) => s.problems);

  const counts = {
    All: PROBLEM_BANK.length,
    Easy: 0,
    Medium: 0,
    Hard: 0,
  } as Record<string, number>;
  PROBLEM_BANK.forEach(
    (p) => (counts[p.difficulty] = (counts[p.difficulty] || 0) + 1),
  );

  const doneCount = PROBLEM_BANK.filter((p) => !!problems[p.slug]?.solvedAt)
    .length;
  const statusCounts = {
    All: PROBLEM_BANK.length,
    Done: doneCount,
    Undone: PROBLEM_BANK.length - doneCount,
  } as Record<string, number>;

  const filtered = PROBLEM_BANK.filter((p) => {
    const okFilter = filter === "All" || p.difficulty === filter;
    const solved = !!problems[p.slug]?.solvedAt;
    const okStatus =
      status === "All" || (status === "Done" ? solved : !solved);
    const okSearch =
      !search ||
      (p.title + " " + p.tags.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase());
    return okFilter && okStatus && okSearch;
  });

  return (
    <aside className="sidebar">
      <div className="side-head">
        <h2>Problem Set</h2>
        <div className="search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems, tags..."
          />
        </div>
        <div className="chips">
          {Object.keys(counts).map((k) => (
            <button
              key={k}
              className={`chip ${filter === k ? "on" : ""}`}
              onClick={() => setFilter(k as any)}
              data-f={k}
            >
              {k} · {counts[k]}
            </button>
          ))}
        </div>
        <div className="chips">
          {Object.keys(statusCounts).map((k) => (
            <button
              key={k}
              className={`chip ${status === k ? "on" : ""}`}
              onClick={() => setStatus(k as any)}
              data-f={k}
            >
              {k} · {statusCounts[k]}
            </button>
          ))}
        </div>
      </div>

      <ul className="plist">
        {filtered.length ? (
          filtered.map((p, i) => {
            const solved = !!problems[p.slug]?.solvedAt;
            return (
              <li
                key={p.slug}
                className={`p-item ${p.slug === currentSlug ? "active" : ""} ${solved ? "solved" : ""}`}
                data-slug={p.slug}
                onClick={() => selectProblem(p.slug)}
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <span className="p-status">✓</span>
                <div className="p-meta">
                  <div className="p-title">
                    <em>{p.num}</em>
                    {p.title}
                  </div>
                  <div className="p-tags">{p.tags.join(" · ")}</div>
                </div>
                <span className={`pill ${p.difficulty}`}>{p.difficulty}</span>
              </li>
            );
          })
        ) : (
          <li className="empty">No matches</li>
        )}
      </ul>
    </aside>
  );
}

import { useAppStore, useMergedBank } from "../infrastructure/store";
import { CATEGORIES, type CategoryFilter } from "../domain/Category";

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const bank = useMergedBank();
  const selectProblem = useAppStore((s) => s.selectProblem);
  const currentSlug = useAppStore((s) => s.currentSlug);
  const filter = useAppStore((s) => s.filter);
  const status = useAppStore((s) => s.status);
  const category = useAppStore((s) => s.category);
  const search = useAppStore((s) => s.search);
  const setFilter = useAppStore((s) => s.setFilter);
  const setStatus = useAppStore((s) => s.setStatus);
  const setCategory = useAppStore((s) => s.setCategory);
  const setSearch = useAppStore((s) => s.setSearch);
  const problems = useAppStore((s) => s.problems);

  const counts = {
    All: bank.length,
    Easy: 0,
    Medium: 0,
    Hard: 0,
  } as Record<string, number>;
  bank.forEach(
    (p) => (counts[p.difficulty] = (counts[p.difficulty] || 0) + 1),
  );

  const doneCount = bank.filter((p) => !!problems[p.slug]?.solvedAt).length;
  const statusCounts = {
    All: bank.length,
    Done: doneCount,
    Undone: bank.length - doneCount,
  } as Record<string, number>;

  // Category counts include 'All' (the merged-bank length). Each Category is
  // only shown if at least one problem is tagged with it, so an empty
  // 'Generated' bucket is hidden until the user accepts their first one.
  const categoryCounts = { All: bank.length } as Record<CategoryFilter, number>;
  for (const c of CATEGORIES) categoryCounts[c] = 0;
  bank.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
  });
  const visibleCategories = CATEGORIES.filter(
    (c) => (categoryCounts[c] ?? 0) > 0,
  );

  const filtered = bank.filter((p) => {
    const okFilter = filter === "All" || p.difficulty === filter;
    const okCategory = category === "All" || p.category === category;
    const solved = !!problems[p.slug]?.solvedAt;
    const okStatus =
      status === "All" || (status === "Done" ? solved : !solved);
    const okSearch =
      !search ||
      (p.title + " " + p.tags.join(" "))
        .toLowerCase()
        .includes(search.toLowerCase());
    return okFilter && okCategory && okStatus && okSearch;
  });

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
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
              onClick={() => setFilter(k as 'All' | 'Easy' | 'Medium' | 'Hard')}
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
              onClick={() => setStatus(k as 'All' | 'Done' | 'Undone')}
              data-f={k}
            >
              {k} · {statusCounts[k]}
            </button>
          ))}
        </div>
        {visibleCategories.length > 0 && (
          <div className="chips" data-row="category">
            {(['All', ...visibleCategories] as const).map((k) => (
              <button
                key={k}
                className={`chip ${category === k ? "on" : ""}`}
                onClick={() => setCategory(k)}
                data-f={k}
                title={`Category: ${k}`}
              >
                {k} · {categoryCounts[k]}
              </button>
            ))}
          </div>
        )}
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
                onClick={() => {
                  selectProblem(p.slug)
                  onClose?.()
                }}
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

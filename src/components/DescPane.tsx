import { useAppStore } from "../infrastructure/store";

export function DescPane() {
  const currentSlug = useAppStore((s) => s.currentSlug);
  const getProblem = useAppStore((s) => s.getProblem);

  const p = getProblem(currentSlug);

  return (
    <section className="pane desc-pane" id="descPane">
      <div className="pane-tabs">
        <button className="ptab on" id="tabDesc">
          Description
        </button>
        <button className="ptab" id="tabSubs">
          Submissions <span className="badge">0</span>
        </button>
      </div>
      <div className="pane-scroll" id="descView">
        <div
          className="desc-body"
          id="descBody"
          dangerouslySetInnerHTML={{
            __html: p
              ? `<div class="d-top"><span class="d-num">#${p.num}</span><span class="pill ${p.difficulty}">${p.difficulty}</span></div><h1>${p.title}</h1>${p.desc}`
              : "<div />",
          }}
        />
      </div>
      <div className="pane-scroll" id="subsView" hidden>
        <div className="subs">No submissions yet</div>
      </div>
    </section>
  );
}

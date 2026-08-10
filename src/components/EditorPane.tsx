import { useAppStore } from "../infrastructure/store";
import type { LastRunCase } from "../infrastructure/store";
import { useState, useEffect, useRef } from "react";
import { useRunCode, parseCases, isRunError } from "../hooks/useRunCode";
import { tsCompiler } from "../infrastructure/tsCompiler";
import { formatCode } from "../infrastructure/formatCode";
import type { ParsedTestCase } from "../domain/TestCase";
import CodeEditor from "./CodeEditor";

// Timestamp helper for submission records. Kept behind a function so the
// purity rule sees run/submit handlers as side-effecting only, not render.
const now = () => Date.now();

export function EditorPane() {
  const { lang, currentSlug, getProblem, getProblemState } = useAppStore();

  const { run } = useRunCode();
  const [busy, setBusy] = useState(false);
  const [fmtBusy, setFmtBusy] = useState(false);
  const [fmtMsg, setFmtMsg] = useState<string | null>(null);
  const fmtTimer = useRef<number | null>(null);
  const setLastRun = useAppStore((s) => s.setLastRun);
  const setTsStatus = useAppStore((s) => s.setTsStatus);

  function flash(msg: string) {
    setFmtMsg(msg);
    if (fmtTimer.current) window.clearTimeout(fmtTimer.current);
    fmtTimer.current = window.setTimeout(() => setFmtMsg(null), 1800);
  }

  async function handleFormat() {
    if (fmtBusy) return;
    setFmtBusy(true);
    try {
      const prob = getProblem(currentSlug);
      if (!prob) return;
      const st = getProblemState(currentSlug);
      const code = st[lang] ?? prob.starter[lang] ?? "";
      const formatted = await formatCode(code, lang);
      if (formatted !== code) {
        useAppStore.getState().saveCode(formatted);
      }
      flash("Formatted");
    } catch {
      flash("Fix syntax errors first");
    } finally {
      setFmtBusy(false);
    }
  }

  useEffect(() => {
    // load typescript compiler and update badge status
    tsCompiler.load().then(() => {
      setTsStatus(tsCompiler.ready ? "ready" : "fallback");
    });
  }, [setTsStatus]);

  async function handleRun(isSubmit: boolean) {
    if (busy) return;
    setBusy(true);
    let runnable: ParsedTestCase[] = [];
    try {
      const prob = getProblem(currentSlug)!;
      const st = getProblemState(currentSlug);
      let code = st[lang] || prob.starter[lang];
      if (lang === "ts") {
        try {
          code = tsCompiler.compile(code);
        } catch (e) {
          const err =
            e instanceof Error
              ? { name: e.name, message: e.message }
              : { name: "TS Error", message: String(e) };
          // save compile error and abort run
          setLastRun(currentSlug, {
            compile: err,
            results: [],
            logs: [],
            verdict: "Compile Error",
            passed: 0,
            total: 0,
            ms: null,
          });
          useAppStore.getState().setActiveResultTab("result");
          setBusy(false);
          return;
        }
      }

      const cases = getCasesForUI();
      const parsed = parseCases(cases, prob);
      runnable = parsed.filter((p) => !p.parseError);
      if (!runnable.length) {
        alert("No valid testcases to run");
        return;
      }

      const { results, logs } = await run(code, prob, runnable);

      // process results
      let passed = 0,
        total = 0,
        ms = 0;
      runnable.forEach((p, i) => {
        const m = results[i];
        const hasExp = Object.prototype.hasOwnProperty.call(p, "expected");
        if (hasExp) {
          total++;
          if (m && m.ok && m.pass) passed++;
        }
        if (m && m.ms) ms += m.ms;
        const mark = !m
          ? "tle"
          : !m.ok
            ? "err"
            : m.pass === null
              ? "pass"
              : m.pass
                ? "pass"
                : "fail";
        useAppStore.getState().setCaseMark(p.id, mark);
      });

      let verdict = "Wrong Answer";
      if (total > 0 && passed === total) verdict = "Accepted";
      if (total === 0) verdict = "No Expected Cases";

      if (isSubmit) {
        useAppStore.getState().addSubmission({
          t: now(),
          lang,
          verdict,
          passed,
          total,
          ms: total > 0 ? ms : null,
        });
      }

      // save last run details for result view
      setLastRun(currentSlug, { results, logs, verdict, passed, total, ms });
      useAppStore.getState().setActiveResultTab("result");

      if (isSubmit && verdict === "Accepted") {
        useAppStore.getState().markSolved();
      }
    } catch (e) {
      const err = isRunError(e) ? e : null;
      if (err?.type === "timeout") {
        const tleResults: LastRunCase[] = err.results || [];
        runnable.forEach((p, i) => {
          const m = tleResults[i];
          if (!m || m.tle) {
            useAppStore.getState().setCaseMark(p.id, "tle");
          } else {
            const mark = !m.ok
              ? "err"
              : m.pass === null
                ? "pass"
                : m.pass
                  ? "pass"
                  : "fail";
            useAppStore.getState().setCaseMark(p.id, mark);
          }
        });

        let passed = 0;
        let total = 0;
        runnable.forEach((p, i) => {
          const m = tleResults[i];
          const hasExp = Object.prototype.hasOwnProperty.call(p, "expected");
          if (hasExp) {
            total++;
            if (m && !m.tle && m.ok && m.pass) passed++;
          }
        });

        const verdict = "Time Limit Exceeded";
        setLastRun(currentSlug, {
          results: tleResults,
          logs: err.logs || [],
          verdict,
          passed,
          total,
          ms: null,
        });
        useAppStore.getState().setActiveResultTab("result");

        if (isSubmit) {
          useAppStore.getState().addSubmission({
            t: now(),
            lang,
            verdict,
            passed,
            total,
            ms: null,
          });
        }
      } else if (err?.type === "compile") {
        // Sandbox compile failure (e.g. the expected function/class is not
        // defined): surface the banner and any judge logs in the result view.
        setLastRun(currentSlug, {
          compile: err.error,
          results: [],
          logs: err.logs || [],
          verdict: "Compile Error",
          passed: 0,
          total: 0,
          ms: null,
        });
        useAppStore.getState().setActiveResultTab("result");
      } else {
        console.error(e);
        alert(
          "Run failed: " +
            (err?.type || (e instanceof Error ? e.message : String(e))),
        );
      }
    } finally {
      setBusy(false);
    }
  }

  function getCasesForUI() {
    const state = getProblemState(currentSlug);
    const ps = state?.cases || [];
    // fallback to defaults from problem if empty
    if (!ps.length) {
      const p = getProblem(currentSlug)!;
      return p.tests.map((t, i) => ({
        id: `builtin-${i}`,
        inputText: JSON.stringify(
          p.mode === "class" ? t.calls : t.in,
          null,
          1,
        ),
        expectedText: JSON.stringify(t.out),
      }));
    }
    return ps.map((c) => ({
      id: c.id,
      inputText: c.inputText,
      expectedText: c.expectedText,
    }));
  }

  return (
    <div className="editor-pane">
      <div className="editor-head">
        <div className={`seg ${lang === "ts" ? "ts" : ""}`}>
          <div className="thumb" />
          <button
            data-lang="js"
            className={lang === "js" ? "on" : ""}
            onClick={() => useAppStore.getState().setLang("js")}
          >
            JavaScript
          </button>
          <button
            data-lang="ts"
            className={lang === "ts" ? "on" : ""}
            onClick={() => useAppStore.getState().setLang("ts")}
          >
            TypeScript
          </button>
        </div>
        <span className={`autosave ${fmtMsg ? "show" : ""} ${fmtMsg === "Fix syntax errors first" ? "err" : ""}`}>
          {fmtMsg}
        </span>
        <div className="spacer" />
        <button
          className={`btn-format ${fmtBusy ? "busy" : ""}`}
          onClick={handleFormat}
          disabled={fmtBusy}
          title="Format code with Prettier"
        >
          <span className="spin" />
          {fmtBusy ? "Formatting…" : "Format"}
        </button>
      </div>
      <CodeEditor />
      <div className="editor-foot">
        <span className="kbd-hint">
          <kbd>Ctrl</kbd>+<kbd>↵</kbd> run · <kbd>Ctrl</kbd>+<kbd>⇧</kbd>+
          <kbd>↵</kbd> submit
        </span>
        <div className="spacer" />
        <button
          className={`btn btn-run ${busy ? "busy" : ""}`}
          onClick={() => handleRun(false)}
          disabled={busy}
        >
          <span className="spin" />
          Run Code
        </button>
        <button
          className={`btn btn-submit ${busy ? "busy" : ""}`}
          onClick={() => handleRun(true)}
          disabled={busy}
        >
          <span className="spin" />
          Submit
        </button>
      </div>
    </div>
  );
}

export default EditorPane;

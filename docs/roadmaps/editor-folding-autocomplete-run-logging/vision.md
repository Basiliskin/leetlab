# Vision — editor-folding-autocomplete-run-logging

**Objective:** Deliver a series of prototype-level quality-of-life improvements to the CodeMirror 6 editor in the leetlab client-only SPA — starting with code folding, a non-blocking autocomplete pipeline, and an automatic per-run console.log of the run counter and result.

**Success definition:** Each improvement works in a local dev build with light manual verification, the app still typechecks (`tsc -b`) and builds (`vite build`), and no regression to existing editor behaviour (line numbers, keymaps, language switching, run/submit flow).

**Domain shape:** technical — the work is entirely CodeMirror extension wiring, a completion computation pipeline, and console diagnostics; there are no business entities, rules, or workflows.

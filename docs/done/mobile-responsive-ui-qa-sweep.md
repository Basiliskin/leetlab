# Mobile Responsive UI — QA Sweep Evidence

> Phase 9 of `mobile-responsive-ui-roadmap`. Harness: headless Google Chrome
> 151 device-mode emulation (`--window-size` width override, mobile:false) at
> 320 / 360 / 430 px and 1280 px desktop, driven via the DevTools Protocol.
> All numbers are measured `scrollWidth` vs `clientWidth` (a region overflows
> iff `scrollWidth > clientWidth`), with the app rendered at each width.

## Region × width overflow matrix (measured `scrollWidth ≤ clientWidth`)

| Region | 320px | 360px | 430px |
|---|---|---|---|
| Document (`html`) | 320 ≤ 320 ✅ | 360 ≤ 360 ✅ | 430 ≤ 430 ✅ |
| Topbar | 320 ≤ 320 ✅ | 360 ≤ 360 ✅ | 430 ≤ 430 ✅ |
| Workspace | 296 ≤ 296 ✅ | 336 ≤ 336 ✅ | 406 ≤ 406 ✅ |
| Editor pane | 294 ≤ 294 ✅ | 334 ≤ 334 ✅ | 404 ≤ 404 ✅ |
| Drawer | 294 ≤ 294 ✅ | 334 ≤ 334 ✅ | 404 ≤ 404 ✅ |
| Drawer body — Testcases tab | 294 ≤ 294 ✅ | 334 ≤ 334 ✅ | 404 ≤ 404 ✅ |
| Drawer body — Result tab | 294 ≤ 294 ✅ | 334 ≤ 334 ✅ | 404 ≤ 404 ✅ |
| Drawer body — Console tab | 294 ≤ 294 ✅ | 334 ≤ 334 ✅ | 404 ≤ 404 ✅ |
| Description overlay (open) | 294 ≤ 294 ✅ | 334 ≤ 334 ✅ | 404 ≤ 404 ✅ |
| Sidebar drawer (open) | 270 ≤ 270 ✅ | 282 ≤ 282 ✅ | 282 ≤ 282 ✅ |
| Generate modal | 270 ≤ 270 ✅ | 310 ≤ 310 ✅ | 380 ≤ 380 ✅ |
| Statusbar | 320 ≤ 320 ✅ | 360 ≤ 360 ✅ | 430 ≤ 430 ✅ |

The only elements whose bounding rects leave the viewport are the closed
sidebar drawer (off-canvas `translateX(-105%)`) and the decorative `.bgfx`
blobs, both clipped / non-scrolling; they do not add a scrollbar.

## Solve-flow checks (measured at 320/360/430px)

- **Full-screen editor** — `section.editor-pane` fills the workspace width and
  the content height below the 44px Description/Editor tab strip; no sibling
  pane takes layout space.
- **Description tabs/overlay** — the Description tab (`.ptab`, reused
  vocabulary) opens the description as an overlay covering the editor; the
  editor stays mounted underneath (CodeMirror instance and its content are
  preserved across the toggle — verified `.cm-content` present and unchanged
  after open→close, 120 chars).
- **On-screen keyboard bar** — with the OS keyboard simulated (visual
  viewport height 844 → 500, `--keyboard-offset` = 344px), `.editor-foot`
  becomes `position:fixed` with its bottom edge at **500px = 844 − 344**
  (exactly at the keyboard top) at all three widths; Run/Submit are 44×44 with
  non-overlapping hitboxes. After 10 open/close cycles the bar returns to its
  initial position (drift-free) and the `keyboard-open` class clears.
- **Test-case input** — drawer textareas are 64px+ touch surfaces, focusable
  on tap; on the keyboard-open transition the module scrolls a focused
  editable field into view (unit-tested). Typed input survives tab
  round-trips with the active tab retained.
- **Output wrapping** — a 400-char unbroken console line wraps within the pane
  (line `scrollWidth` 334 ≤ container 364) at 320px; result rows and console
  lines use `word-break:break-all` / `pre-wrap`.
- **Sidebar drawer** — closed by default, opened via the ☰ nav toggle; zero
  layout shift (workspace box unchanged on open); 49 problem items all
  reachable by scrolling the viewport-derived-height list (the legacy 210px
  cap is removed); the last item scrolls fully into view; selecting a problem
  closes the drawer.
- **Topbar** — progress segs collapse to the `.cnt` count; the four actions
  (+Generate/Providers/Export/Import) are reachable behind the ⋯ button in one
  tap; opening an action closes the menu.

## Touch-target conformance (measured at 320/375px)

Audited every visible interactive control across all opened surfaces (sidebar
drawer, actions dropdown, description overlay, GenerateModal,
ManageProvidersModal, editor): **0 controls under 44×44px** and **0 adjacent
gaps under 8px** in the grouped strips (chips, case pills, pane tabs, topbar,
actions dropdown, provider actions, editor foot). Desktop controls keep their
pre-mobile baseline sizes (`.btn-run` 36px, `.chip` 22px) — the touch pass is
phone-scoped.

## Desktop regression (1280px)

- Document 1280 ≤ 1280, no horizontal scroll.
- Split layout intact: sidebar 284px, desc-pane 420px, editor 524px.
- Mobile-only chrome hidden: `.nav-toggle` `display:none`, `.mobile-tabs`
  `display:none`, progress segs render per-problem, four actions inline.
- `.editor-foot` stays in-flow (`position:static`), buttons at baseline 36px;
  the keyboard-offset custom property is not consumed at desktop width.

## Engineering gates

| Gate | Result |
|---|---|
| Build (`tsc -b && vite build`) | ✅ green |
| Vitest | 394 passed / 9 failed / 403 total — the 9 failures are the **pre-phase baseline** (providerAdapters, providerRegistry, fullStateImport, related to the dev `__llm-proxy`); the green count rose by exactly the 12 new tests added across the roadmap (visualViewport module) |
| ESLint | 15 errors, all pre-existing in `src/services/*` (example services); no new violations from this roadmap |
| CodeEditor.tsx / extension assembly | byte-for-byte untouched (zero diff across the whole roadmap) |

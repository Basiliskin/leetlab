// Visual-viewport / soft-keyboard infrastructure.
//
// iOS Safari and Android Chrome do not resize the *layout* viewport when the
// OS soft keyboard opens: window.innerHeight stays constant while the visible
// area shrinks, so anything anchored to the layout viewport (Run/Submit in
// .editor-foot, the on-screen keyboard bar) slides under the keyboard.
//
// window.visualViewport *does* shrink when the keyboard opens. This module
// subscribes to it and publishes two CSS custom properties on :root so the
// layout can key off the visual viewport instead of the layout viewport:
//
//   --visual-viewport-height : height of the visible area, in px
//   --keyboard-offset        : px of the visual viewport occluded by the
//                              keyboard at the bottom (0 when closed)
//
// The on-screen keyboard bar (phase 3, .editor-foot) binds its position to
// --keyboard-offset to stay tappable above the soft keyboard. The module is
// browser-only; on any environment without window.visualViewport it fails
// soft (returns a no-op dispose) so the app still renders.

export const VISUAL_VIEWPORT_HEIGHT_VAR = "--visual-viewport-height";
export const KEYBOARD_OFFSET_VAR = "--keyboard-offset";

let wiredCleanup: (() => void) | null = null;

export function initVisualViewport(): (() => void) | null {
  // Idempotent: a second call returns the existing dispose without stacking
  // another pair of listeners (React StrictMode remounts and HMR call this
  // repeatedly).
  if (wiredCleanup) return wiredCleanup;

  const vv = typeof window !== "undefined" ? window.visualViewport : undefined;

  if (!vv || typeof document === "undefined") {
    // No visualViewport (older browsers, SSR, unit tests without a DOM):
    // expose a no-op dispose, attach nothing, never throw.
    wiredCleanup = () => {
      wiredCleanup = null;
    };
    return wiredCleanup;
  }

  const docEl = document.documentElement;

  let prevOffset = 0;

  const apply = () => {
    // Keyboard occlusion = layout-viewport height minus visual-viewport
    // height. Floored at 0: 0 when closed, grows as the keyboard covers the
    // bottom of the screen. Never derived from window.innerHeight alone,
    // which does not shrink when the keyboard opens on iOS.
    const keyboardOffset = Math.max(0, window.innerHeight - vv.height);
    docEl.style.setProperty(VISUAL_VIEWPORT_HEIGHT_VAR, `${vv.height}px`);
    docEl.style.setProperty(KEYBOARD_OFFSET_VAR, `${keyboardOffset}px`);
    // Toggle a class so CSS can switch the editor-foot into the fixed
    // "on-screen keyboard bar" only while the keyboard actually occludes
    // (when closed it stays in-flow and never floats over the drawer).
    const keyboardOpened = prevOffset === 0 && keyboardOffset > 0;
    docEl.classList.toggle("keyboard-open", keyboardOffset > 0);
    if (keyboardOpened) revealFocusedElement();
    prevOffset = keyboardOffset;
  };

  // Both events matter: resize fires when the keyboard opens (height drops),
  // scroll fires as the URL bar collapses / the visual viewport pans.
  vv.addEventListener("resize", apply);
  vv.addEventListener("scroll", apply);
  apply();

  wiredCleanup = () => {
    vv.removeEventListener("resize", apply);
    vv.removeEventListener("scroll", apply);
    wiredCleanup = null;
  };
  return wiredCleanup;
}

export function destroyVisualViewport(): void {
  if (wiredCleanup) wiredCleanup();
}

// When the OS keyboard opens it can cover the focused field (e.g. a drawer
// test-case textarea). The browser usually auto-scrolls the focused element
// into view, but with nested scroll containers that can fail, so on the
// open transition we explicitly bring an editable active element back into
// view within its nearest scroll container.
function revealFocusedElement(): void {
  const el = document.activeElement;
  if (!el) return;
  const host = el as HTMLElement;
  if (typeof host.scrollIntoView !== "function") return;
  const isEditable =
    host.isContentEditable ||
    (typeof HTMLTextAreaElement !== "undefined" &&
      el instanceof HTMLTextAreaElement) ||
    (typeof HTMLInputElement !== "undefined" && el instanceof HTMLInputElement) ||
    (typeof HTMLSelectElement !== "undefined" &&
      el instanceof HTMLSelectElement);
  if (isEditable) host.scrollIntoView({ block: "nearest" });
}

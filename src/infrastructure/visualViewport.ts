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

  const apply = () => {
    // Keyboard occlusion = layout-viewport height minus visual-viewport
    // height. Floored at 0: 0 when closed, grows as the keyboard covers the
    // bottom of the screen. Never derived from window.innerHeight alone,
    // which does not shrink when the keyboard opens on iOS.
    const keyboardOffset = Math.max(0, window.innerHeight - vv.height);
    docEl.style.setProperty(VISUAL_VIEWPORT_HEIGHT_VAR, `${vv.height}px`);
    docEl.style.setProperty(KEYBOARD_OFFSET_VAR, `${keyboardOffset}px`);
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

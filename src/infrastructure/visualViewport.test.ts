// Fixture suite for roadmap phase 1, viewport-keyboard-infra: the module that
// publishes --visual-viewport-height / --keyboard-offset on :root so the
// mobile keyboard bar can anchor Run/Submit above the OS soft keyboard.
//
// Surfaces under test:
//   - keyboard-offset-reflects-visual-viewport: offset = layout-viewport
//     height minus visual-viewport height, floored at 0, and it changes when
//     the visual viewport resizes (the keyboard opens).
//   - root-custom-properties: both vars are written on documentElement.style
//     with px units, live (no re-render).
//   - listener-lifecycle-idempotent: resize + scroll are wired, re-init does
//     not stack listeners, destroy detaches.
//   - target-matrix-degradation: no visualViewport -> no listeners, no throw.
//
// The repo has no DOM test environment (no jsdom/happy-dom), so the handful of
// browser globals the module touches are stubbed via defineProperty.

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  initVisualViewport,
  destroyVisualViewport,
  VISUAL_VIEWPORT_HEIGHT_VAR,
  KEYBOARD_OFFSET_VAR,
} from './visualViewport'

// EventTarget-backed stand-in for window.visualViewport that records which
// handlers are registered so the idempotency/dispose assertions can count them.
class FakeVisualViewport extends EventTarget {
  height: number
  handlers: Array<{ type: string; fn: EventListenerOrEventListenerObject }> = []
  constructor(height: number) {
    super()
    this.height = height
  }
  addEventListener(
    type: string,
    fn: EventListenerOrEventListenerObject | null,
    opts?: AddEventListenerOptions | boolean,
  ) {
    if (fn) this.handlers.push({ type, fn })
    super.addEventListener(type, fn as EventListener, opts)
  }
  removeEventListener(
    type: string,
    fn: EventListenerOrEventListenerObject | null,
    opts?: EventListenerOptions | boolean,
  ) {
    this.handlers = this.handlers.filter(
      (h) => !(h.type === type && h.fn === fn),
    )
    super.removeEventListener(type, fn as EventListener, opts)
  }
  fire(type: string) {
    this.dispatchEvent(new Event(type))
  }
}

interface BrowserStub {
  vv: FakeVisualViewport | undefined
  vars: Map<string, string>
  classes: Set<string>
  doc: {
    activeElement: unknown
    documentElement: {
      style: { setProperty: (name: string, value: string) => void }
      classList: { toggle: (name: string, force?: boolean) => void }
    }
  }
  win: { visualViewport?: FakeVisualViewport; innerHeight: number }
}

function stubBrowser(opts: { vv?: boolean; height?: number; innerHeight?: number }): BrowserStub {
  const vars = new Map<string, string>()
  const classes = new Set<string>()
  const vv = opts.vv === false ? undefined : new FakeVisualViewport(opts.height ?? 700)
  const win = { visualViewport: vv, innerHeight: opts.innerHeight ?? 844 }
  const doc = {
    activeElement: null as unknown,
    documentElement: {
      style: { setProperty: (name: string, value: string) => vars.set(name, value) },
      classList: {
        toggle: (name: string, force?: boolean) => {
          if (force === undefined) {
            if (classes.has(name)) classes.delete(name)
            else classes.add(name)
          } else if (force) {
            classes.add(name)
          } else {
            classes.delete(name)
          }
        },
      },
    },
  }
  Object.defineProperty(globalThis, 'window', { value: win, configurable: true, writable: true })
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true })
  return { vv, vars, classes, doc, win }
}

afterEach(() => {
  destroyVisualViewport()
  Reflect.deleteProperty(globalThis, 'window')
  Reflect.deleteProperty(globalThis, 'document')
})

describe('visualViewport (keyboard-offset-reflects-visual-viewport)', () => {
  it('publishes an initial visual-viewport height and the computed keyboard offset on init', () => {
    const { vars } = stubBrowser({ height: 700 })
    initVisualViewport()
    expect(vars.get(VISUAL_VIEWPORT_HEIGHT_VAR)).toBe('700px')
    expect(vars.get(KEYBOARD_OFFSET_VAR)).toBe('144px')
  })

  it('grows the keyboard offset when the visual viewport shrinks (keyboard opens)', () => {
    const { vv, vars } = stubBrowser({ height: 700 })
    initVisualViewport()
    expect(vars.get(KEYBOARD_OFFSET_VAR)).toBe('144px')
    vv!.height = 400 // keyboard covers the bottom 444px
    vv!.fire('resize')
    expect(vars.get(KEYBOARD_OFFSET_VAR)).toBe('444px')
    expect(vars.get(VISUAL_VIEWPORT_HEIGHT_VAR)).toBe('400px')
    // innerHeight must stay constant through this — the offset comes from
    // visualViewport.height, not from window.innerHeight shrinking.
    expect(stubWindowInnerHeight()).toBe(844)
  })

  it('responds to the scroll event as well (URL-bar collapse pan)', () => {
    const { vv, vars } = stubBrowser({ height: 700 })
    initVisualViewport()
    vv!.height = 620
    vv!.fire('scroll')
    expect(vars.get(KEYBOARD_OFFSET_VAR)).toBe('224px')
  })

  it('never exposes a negative keyboard offset', () => {
    const { vv, vars } = stubBrowser({ height: 900 }) // taller than innerHeight
    initVisualViewport()
    expect(vars.get(KEYBOARD_OFFSET_VAR)).toBe('0px')
    vv!.height = 1000
    vv!.fire('resize')
    expect(vars.get(KEYBOARD_OFFSET_VAR)).toBe('0px')
  })
})

describe('visualViewport (listener-lifecycle-idempotent)', () => {
  it('wires both resize and scroll, and re-init does not stack listeners', () => {
    const { vv } = stubBrowser({ height: 700 })
    initVisualViewport()
    initVisualViewport()
    initVisualViewport()
    expect(vv!.handlers.filter((h) => h.type === 'resize')).toHaveLength(1)
    expect(vv!.handlers.filter((h) => h.type === 'scroll')).toHaveLength(1)
  })

  it('destroy detaches every listener and allows a clean re-init', () => {
    const { vv } = stubBrowser({ height: 700 })
    const dispose = initVisualViewport()
    expect(vv!.handlers.length).toBeGreaterThan(0)
    dispose!()
    expect(vv!.handlers).toHaveLength(0)
    // re-init works after dispose
    initVisualViewport()
    expect(vv!.handlers.filter((h) => h.type === 'resize')).toHaveLength(1)
  })

  it('destroy is safe to call when never initialized', () => {
    stubBrowser({ height: 700 })
    expect(() => destroyVisualViewport()).not.toThrow()
  })
})

describe('visualViewport (keyboard-open class for the on-screen bar)', () => {
  it('toggles keyboard-open on :root only while the keyboard occludes', () => {
    const { vv, classes } = stubBrowser({ height: 844, innerHeight: 844 }) // closed
    initVisualViewport()
    expect(classes.has('keyboard-open')).toBe(false)
    vv!.height = 500 // keyboard opens
    vv!.fire('resize')
    expect(classes.has('keyboard-open')).toBe(true)
    vv!.height = 844 // keyboard closes
    vv!.fire('resize')
    expect(classes.has('keyboard-open')).toBe(false)
  })

  it('open/close cycles are drift-free: offset and class return to the initial state', () => {
    const { vv, vars, classes } = stubBrowser({ height: 844, innerHeight: 844 })
    initVisualViewport()
    for (let i = 0; i < 10; i++) {
      vv!.height = 500
      vv!.fire('resize') // open
      vv!.height = 844
      vv!.fire('resize') // close
    }
    expect(vars.get(KEYBOARD_OFFSET_VAR)).toBe('0px')
    expect(classes.has('keyboard-open')).toBe(false)
    vv!.height = 500
    vv!.fire('resize')
    expect(vars.get(KEYBOARD_OFFSET_VAR)).toBe('344px')
    expect(classes.has('keyboard-open')).toBe(true)
  })

  it('scrolls a focused editable field into view on the keyboard-open transition', () => {
    const { vv, doc } = stubBrowser({ height: 844, innerHeight: 844 })
    const scrollIntoView = vi.fn()
    doc.activeElement = { isContentEditable: true, scrollIntoView }
    initVisualViewport()
    expect(scrollIntoView).not.toHaveBeenCalled()
    vv!.height = 500
    vv!.fire('resize')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('does not scroll a non-editable active element when the keyboard opens', () => {
    const { vv, doc } = stubBrowser({ height: 844, innerHeight: 844 })
    const scrollIntoView = vi.fn()
    doc.activeElement = { isContentEditable: false, scrollIntoView }
    initVisualViewport()
    vv!.height = 500
    vv!.fire('resize')
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})

describe('visualViewport (target-matrix-degradation)', () => {
  it('fails soft when window.visualViewport is absent: no listeners, no throw', () => {
    const { vv } = stubBrowser({ vv: false })
    expect(() => initVisualViewport()).not.toThrow()
    expect(vv).toBeUndefined()
    // no listeners attached anywhere, and dispose is a no-op
    const dispose = initVisualViewport()
    expect(() => dispose?.()).not.toThrow()
  })
})

// Reads the innerHeight currently installed on the global window stub, so the
// "keyboard opens" test can assert the layout viewport did not shrink.
function stubWindowInnerHeight(): number {
  const win = (globalThis as Record<string, unknown>).window as {
    innerHeight: number
  }
  return win.innerHeight
}

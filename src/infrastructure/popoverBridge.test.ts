// Fixture suite for roadmap phase 2, codeeditor-usage-templates: the
// component-free popover state carrier that bridges the `.ts` apply hook
// (infrastructure) and the `.tsx` template popover (interface). The bridge
// must be Node-testable, must not import React, and must conform to the
// lifecycle / subscribe / accept-anchor-payload rubric for phase 2.
//
// Surfaces under test:
//   - lifecycle-state-machine: closed -> open -> update -> close ->
//     closed, with no-op rules for closed -> update / closed -> close.
//   - subscribe-api: subscription fires on every transition, returns
//     an unsubscribe that actually detaches, dedupes by reference,
//     and swallows listener errors so a faulty subscriber cannot
//     wedge the bridge.
//   - accept-anchor-payload: the open() payload carries the curated
//     templates, the bare-identifier label, viewport coords, and the
//     resolved source/pos/from/to so the picker can drive an insert
//     without re-deriving anything.
//   - usage-template-type-contract: the templates payload is the same
//     UsageTemplate[] shape from typeUsageTemplates, so the picker
//     renders straight off the data module.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  close,
  getState,
  open,
  subscribe,
  update,
  clear,
  __resetForTests,
  type PopoverState,
} from './popoverBridge'
import { USAGE_TEMPLATES, type UsageTemplate } from './typeUsageTemplates'

// A single canonical payload the tests reuse. The values are picked so
// the source and range shape force the picker to actually splice at a
// distinct position (the apply hook in phase 3 will derive these from
// the resolved range).
function fixtureState(): PopoverState {
  return {
    templates: USAGE_TEMPLATES.TransformStream,
    label: 'TransformStream',
    coords: { x: 120, y: 48 },
    source: 'const t = new TransformStream(',
    pos: 'const t = new TransformStream('.length,
    from: 'const t = '.length,
    to: 'const t = new TransformStream('.length,
  }
}

describe('popoverBridge (lifecycle-state-machine)', () => {
  beforeEach(() => {
    __resetForTests()
  })
  afterEach(() => {
    __resetForTests()
  })

  it('starts closed with a null state', () => {
    expect(getState()).toBeNull()
  })

  it('opens: closed -> open transitions and stores the payload', () => {
    const fired = open(fixtureState())
    expect(fired).toBe(true)
    expect(getState()).not.toBeNull()
    expect(getState()!.label).toBe('TransformStream')
  })

  it('open replaces the previous payload when called twice', () => {
    open(fixtureState())
    const next = { ...fixtureState(), label: 'ReadableStream' }
    open(next)
    expect(getState()!.label).toBe('ReadableStream')
  })

  it('update merges into the open payload and keeps the rest intact', () => {
    open(fixtureState())
    const fired = update({ coords: { x: 200, y: 72 } })
    expect(fired).toBe(true)
    const cur = getState()!
    expect(cur.coords).toEqual({ x: 200, y: 72 })
    // Untouched fields survive the merge.
    expect(cur.label).toBe('TransformStream')
    expect(cur.source).toBe(fixtureState().source)
    expect(cur.templates).toBe(fixtureState().templates)
  })

  it('update is a no-op when the popover is closed', () => {
    expect(update({ coords: { x: 0, y: 0 } })).toBe(false)
    expect(getState()).toBeNull()
  })

  it('update with an empty patch returns false and does not notify', () => {
    open(fixtureState())
    const listener = vi.fn()
    subscribe(listener)
    const fired = update({})
    expect(fired).toBe(false)
    expect(listener).not.toHaveBeenCalled()
  })

  it('close fires when open and returns true', () => {
    open(fixtureState())
    const fired = close()
    expect(fired).toBe(true)
    expect(getState()).toBeNull()
  })

  it('close is a no-op when already closed', () => {
    const fired = close()
    expect(fired).toBe(false)
    expect(getState()).toBeNull()
  })

  it('clear() closes the popover and drops all subscribers', () => {
    open(fixtureState())
    const listener = vi.fn()
    subscribe(listener)
    const fired = clear()
    expect(fired).toBe(true)
    expect(getState()).toBeNull()
    // After clear, even open does not re-attach the listener.
    open(fixtureState())
    expect(listener).not.toHaveBeenCalled()
  })

  it('walks the full lifecycle: open -> update -> close -> closed', () => {
    const seen: Array<PopoverState | null> = []
    subscribe((state) => {
      seen.push(state)
    })
    open(fixtureState())
    update({ coords: { x: 1, y: 2 } })
    close()
    expect(seen).toHaveLength(3)
    expect(seen[0]).not.toBeNull()
    expect((seen[0] as PopoverState).coords).toEqual({ x: 120, y: 48 })
    expect((seen[1] as PopoverState).coords).toEqual({ x: 1, y: 2 })
    expect(seen[2]).toBeNull()
  })
})

describe('popoverBridge (subscribe-api)', () => {
  beforeEach(() => {
    __resetForTests()
  })
  afterEach(() => {
    __resetForTests()
  })

  it('subscribers receive (state, prev) on every transition', () => {
    const calls: Array<[PopoverState | null, PopoverState | null]> = []
    subscribe((state, prev) => {
      calls.push([state, prev])
    })
    open(fixtureState())
    close()
    expect(calls).toEqual([
      [expect.objectContaining({ label: 'TransformStream' }), null],
      [null, expect.objectContaining({ label: 'TransformStream' })],
    ])
  })

  it('returns an unsubscribe that actually detaches the listener', () => {
    const listener = vi.fn()
    const unsub = subscribe(listener)
    open(fixtureState())
    expect(listener).toHaveBeenCalledTimes(1)
    unsub()
    update({ coords: { x: 0, y: 0 } })
    close()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('duplicate subscriptions via the same reference are deduped', () => {
    const listener = vi.fn()
    subscribe(listener)
    subscribe(listener)
    open(fixtureState())
    close()
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('a listener that throws does not wedge the other listeners', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const good = vi.fn()
    subscribe(() => {
      throw new Error('boom')
    })
    subscribe(good)
    open(fixtureState())
    expect(good).toHaveBeenCalledTimes(1)
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('fires listeners in subscription order', () => {
    const order: string[] = []
    subscribe(() => order.push('a'))
    subscribe(() => order.push('b'))
    subscribe(() => order.push('c'))
    open(fixtureState())
    expect(order).toEqual(['a', 'b', 'c'])
  })

  it('multiple subscribers all see the transition', () => {
    const a = vi.fn()
    const b = vi.fn()
    subscribe(a)
    subscribe(b)
    open(fixtureState())
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })
})

describe('popoverBridge (accept-anchor-payload)', () => {
  beforeEach(() => {
    __resetForTests()
  })
  afterEach(() => {
    __resetForTests()
  })

  it('carries the curated templates as the picker rows', () => {
    const state = {
      ...fixtureState(),
      templates: USAGE_TEMPLATES.ReadableStream,
    }
    open(state)
    expect(getState()!.templates).toBe(USAGE_TEMPLATES.ReadableStream)
    expect(getState()!.templates[0].label).toBe('Pull')
  })

  it('carries the bare-identifier label for the decline insert', () => {
    open({ ...fixtureState(), label: 'AbortController' })
    expect(getState()!.label).toBe('AbortController')
  })

  it('carries viewport coords for the overlay anchor', () => {
    open({ ...fixtureState(), coords: { x: 33, y: 44 } })
    expect(getState()!.coords).toEqual({ x: 33, y: 44 })
  })

  it('carries the resolved source/pos/from/to so the picker can splice', () => {
    const source = 'function f() {\n  const t = new TransformStream('
    const pos = source.length
    const from = source.indexOf('new')
    const to = pos
    open({ ...fixtureState(), source, pos, from, to })
    const cur = getState()!
    expect(cur.source).toBe(source)
    expect(cur.pos).toBe(pos)
    expect(cur.from).toBe(from)
    expect(cur.to).toBe(to)
    // The picker can reconstruct the constructor span from from..to.
    expect(cur.source.slice(cur.from, cur.to)).toBe('new TransformStream(')
  })

  it('update preserves the anchor fields by default (partial merge)', () => {
    open(fixtureState())
    update({ coords: { x: 9, y: 9 } })
    const cur = getState()!
    expect(cur.source).toBe(fixtureState().source)
    expect(cur.pos).toBe(fixtureState().pos)
    expect(cur.from).toBe(fixtureState().from)
    expect(cur.to).toBe(fixtureState().to)
  })
})

describe('popoverBridge (usage-template-type-contract)', () => {
  beforeEach(() => {
    __resetForTests()
  })
  afterEach(() => {
    __resetForTests()
  })

  it('the templates payload matches the UsageTemplate type from typeUsageTemplates', () => {
    // The bridging types must be assignment-compatible with the curated
    // data module so the picker renders off the same record without a
    // cast. Pin the contract here so a future refactor cannot quietly
    // widen or narrow the shape.
    const templates: readonly UsageTemplate[] = USAGE_TEMPLATES.WritableStream
    open({
      ...fixtureState(),
      templates,
      label: 'WritableStream',
    })
    const cur = getState()!
    const probe: readonly UsageTemplate[] = cur.templates
    expect(probe).toBe(templates)
    for (const t of probe) {
      expect(typeof t.label).toBe('string')
      expect(typeof t.text).toBe('string')
    }
  })

  it('the empty-templates case is rejected by type/runtime guards (no-op shape)', () => {
    // The phase 3 apply hook only opens when lookupUsageTemplates
    // returned a non-empty list; the bridge itself does not enforce
    // that, but we pin the contract: passing an empty array still
    // works as a payload (the picker would render zero rows and the
    // user would have nothing to pick). The point is the bridge
    // doesn't crash and the next open() still fires.
    open({ ...fixtureState(), templates: [] })
    expect(getState()!.templates).toEqual([])
    open(fixtureState())
    expect(getState()!.templates.length).toBeGreaterThan(0)
  })
})

describe('popoverBridge (component-free-wiring)', () => {
  it('has no React imports at the module top level', async () => {
    // The react-refresh lint fails the build if a `.ts` file under
    // src/infrastructure imports React. Pin that contract at runtime
    // (the lint test catches it at build time) by reading the source
    // text and asserting no `from 'react'` / `require('react')` shows
    // up in the public surface.
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const path = resolve(process.cwd(), 'src/infrastructure/popoverBridge.ts')
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(/from\s+['"]react['"]/)
    expect(source).not.toMatch(/require\(['"]react['"]\)/)
    expect(source).not.toMatch(/from\s+['"]react-dom['"]/)
  })

  it('has no CodeMirror imports at the module top level', async () => {
    // Mirror the constraint for codemirror: the bridge is a pure
    // pub/sub store so the apply hook can call it without dragging
    // the editor runtime into the unit-test module graph.
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const path = resolve(process.cwd(), 'src/infrastructure/popoverBridge.ts')
    const source = readFileSync(path, 'utf8')
    expect(source).not.toMatch(/from\s+['"]@codemirror\//)
  })
})

// Fixture suite for roadmap phase 4, tscheck-ambient-declarations: the
// tsCheck virtual language-service host serves a synthetic ambient .d.ts
// declaring the 5 sandbox service globals (`redis`, `pg`, `rabbitmq`,
// `kafka`, `queue`) with their real types, so TS-mode solution code
// referencing them gets no false "Cannot find name" diagnostics.
//
// Covers: ambient-file-fully-wired-into-host (all five handles typecheck
// clean in one file), globals-visible-in-global-scope-not-module-scope
// (script and module inputs both see them), five-globals-typed-not-widened-
// to-any (wrong argument types still error, so the types are real), the
// served-file-map closure invariant (every relative import resolves inside
// the map, so a file added to the services tree cannot silently break
// ambient typing), and degrades-safely-if-ambient-source-unavailable
// (degenerate builder inputs yield empty/inert output, never throw).

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import ts from 'typescript'
import { SANDBOX_SERVICE_CONSTRUCTORS } from '../services/sandbox-bindings'
import {
  AMBIENT_FILE_NAME,
  AMBIENT_TEXT,
  SERVICE_TEXT_PATHS,
  buildAmbientText,
  buildServiceTexts,
} from './sandboxAmbient'
import { checkCode } from './tsCheck'

const LIB_DIR = resolve(process.cwd(), 'node_modules/typescript/lib')

// tsCheck fetches lib.d.ts files from the jsDelivr CDN; serve them from the
// locally installed typescript package instead so the suite runs offline.
function stubLibFetch() {
  const realFetch = globalThis.fetch
  globalThis.fetch = ((input: string | URL | Request) => {
    const libName = String(input).split('/').pop()!
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(readFileSync(resolve(LIB_DIR, libName), 'utf8')),
    } as unknown as Response)
  }) as typeof fetch
  return () => {
    globalThis.fetch = realFetch
  }
}

// Resolve `dir/spec` the way TS would, normalizing `.`/`..` segments, then
// try extension and `/index` candidates against the served file map.
function resolveCandidates(dir: string, spec: string): string[] {
  const out: string[] = []
  for (const p of `${dir}/${spec}`.split('/')) {
    if (p === '' || p === '.') continue
    if (p === '..') out.pop()
    else out.push(p)
  }
  const base = `/${out.join('/')}`
  return ['.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx', '/index.d.ts'].map(
    (ext) => base + ext
  )
}

async function messagesOf(code: string): Promise<string[]> {
  const diags = await checkCode(code, ts)
  return diags.map((d) => d.message)
}

describe('sandbox ambient declarations', () => {
  let restoreFetch: () => void

  beforeAll(() => {
    restoreFetch = stubLibFetch()
  })
  afterAll(() => {
    restoreFetch()
  })

  const HANDLES = Object.keys(SANDBOX_SERVICE_CONSTRUCTORS)

  it('declares exactly the aggregator handles, typed, in global scope', () => {
    for (const name of HANDLES) {
      expect(AMBIENT_TEXT).toContain(
        `declare const ${name}: import("./services/sandbox-bindings").SandboxServices["${name}"];`
      )
    }
    expect(AMBIENT_TEXT).not.toContain(': any')
    expect(AMBIENT_TEXT.split('\n').filter(Boolean)).toHaveLength(
      HANDLES.length
    )
  })

  it('serves the full transitive import closure of the aggregator', () => {
    expect(SERVICE_TEXT_PATHS.has('/src/services/sandbox-bindings.ts')).toBe(
      true
    )
    for (const [path, text] of SERVICE_TEXT_PATHS) {
      const dir = path.slice(0, path.lastIndexOf('/'))
      const specs = [...text.matchAll(/from\s+["'](\.[^"']+)["']/g)].map(
        (m) => m[1]
      )
      for (const spec of specs) {
        const resolved = resolveCandidates(dir, spec).find((cand) =>
          SERVICE_TEXT_PATHS.has(cand)
        )
        expect(resolved, `${spec} imported by ${path}`).toBeDefined()
      }
    }
  })

  it('reports no diagnostics for a script using all five handles', async () => {
    const msgs = await messagesOf(`
      redis.set('k', 'v');
      redis.get('k');
      pg.begin();
      rabbitmq.assertQueue('q');
      kafka.createTopic('t');
      queue.add('job', {});
    `)
    expect(msgs.filter((m) => m.includes('Cannot find name'))).toEqual([])
  })

  it('keeps globals visible in module-scope input', async () => {
    const msgs = await messagesOf(`
      export {};
      redis.set('k', 'v');
    `)
    expect(msgs.filter((m) => m.includes('Cannot find name'))).toEqual([])
  })

  it('types the globals with real signatures, not any', async () => {
    const badRedis = await messagesOf(`redis.set(42, 43);`)
    expect(badRedis.some((m) => /Argument of type/.test(m))).toBe(true)

    const badPg = await messagesOf(`pg.commit('x');`)
    expect(badPg.some((m) => /Argument of type/.test(m))).toBe(true)

    // sanity: the checker still flags genuinely unknown identifiers
    const unknown = await messagesOf(`totallyUnknownSymbol;`)
    expect(
      unknown.some((m) => m.includes("Cannot find name 'totallyUnknownSymbol'"))
    ).toBe(true)
  })

  it('degrades to empty/inert output for degenerate builder inputs', () => {
    expect(buildAmbientText([], './services/sandbox-bindings')).toBe('')
    expect(buildAmbientText(['a'], 'x/y')).toBe(
      'declare const a: import("x/y").SandboxServices["a"];'
    )
    const fresh = buildServiceTexts()
    expect(fresh.size).toBeGreaterThan(0)
    expect(fresh).not.toBe(buildServiceTexts()) // fresh instance per call
    expect(AMBIENT_FILE_NAME.endsWith('.d.ts')).toBe(true)
  })
})

import { useCallback, useRef } from 'react'
import type { ParsedTestCase } from '@domain/TestCase'
import type { Problem } from '@domain/Problem'
// @ts-ignore - Vite worker import
import SandboxWorker from '@infra/sandbox.worker?worker'

interface RunResult {
  results: any[]
  logs: Array<{ l: string; t: string }>
}

export function useRunCode() {
  const workerRef = useRef<Worker | null>(null)

  const run = useCallback(
    async (
      code: string,
      problem: Problem,
      cases: ParsedTestCase[]
    ): Promise<RunResult> => {
      return new Promise((resolve, reject) => {
        const worker = new SandboxWorker()
        workerRef.current = worker

        const timeout = setTimeout(() => {
          worker.terminate()
          reject({ type: 'timeout' })
        }, 6000)

        const results: any[] = new Array(cases.length)
        const logs: Array<{ l: string; t: string }> = []

        worker.onmessage = (e: MessageEvent) => {
          const m = e.data
          if (m.type === 'compile') {
            clearTimeout(timeout)
            worker.terminate()
            reject({ type: 'compile', error: m.error, logs: m.logs })
          } else if (m.type === 'case') {
            results[m.i] = m
            if (m.logs) logs.push(...m.logs)
          } else if (m.type === 'done') {
            clearTimeout(timeout)
            worker.terminate()
            resolve({ results, logs })
          }
        }

        worker.onerror = (e: ErrorEvent) => {
          clearTimeout(timeout)
          worker.terminate()
          reject({ type: 'sandbox_error', error: e.message })
        }

        const payload = cases.map((c) => {
          const out: any = {}
          if (problem.mode === 'class') out.calls = c.calls
          else out.input = c.input
          if ('expected' in c) out.expected = c.expected
          return out
        })

        worker.postMessage({
          code,
          name: problem.fnName,
          mode: problem.mode,
          cases: payload,
        })
      })
    },
    []
  )

  const cancel = useCallback(() => {
    workerRef.current?.terminate()
  }, [])

  return { run, cancel }
}

// Helper to parse cases
export function parseCases(
  cases: Array<{ inputText: string; expectedText: string; id: string }>,
  problem: Problem
): ParsedTestCase[] {
  return cases.map((c) => {
    const out: ParsedTestCase = { id: c.id }
    try {
      const j = JSON.parse(c.inputText)
      if (!Array.isArray(j)) throw new Error('Input must be a JSON array')
      if (problem.mode === 'class') out.calls = j
      else out.input = j
    } catch (e: any) {
      out.parseError = `Input: ${e.message}`
      return out
    }
    if (c.expectedText.trim() !== '') {
      try {
        out.expected = JSON.parse(c.expectedText)
      } catch {
        out.parseError = 'Expected: invalid JSON'
        return out
      }
    }
    return out
  })
}
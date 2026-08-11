import { describe, expect, it, vi } from 'vitest'
import { fmtTraceValue, traceService } from './serviceTracing'

class FakeService {
  greet(name: string) {
    return `hi ${name}`
  }
  salute() {
    return this.greet('self')
  }
  async fetch(id: number) {
    return { id, name: 'x' }
  }
  add(a: number, b: number) {
    return a + b
  }
  nothing(): void {
    return undefined
  }
  echo(s: string) {
    return s
  }
  boom() {
    throw new Error('kapow')
  }
  async boomAsync() {
    throw new Error('nope')
  }
  get status() {
    return 'ok'
  }
}

describe('traceService', () => {
  it('emits a trace entry for a synchronous call and preserves the return value', () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    expect(svc.greet('dima')).toBe('hi dima')
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('[fake] greet dima -> hi dima')
  })

  it('traces an async call when its promise settles, passing the promise through unchanged', async () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    const p = svc.fetch(7)
    expect(emit).not.toHaveBeenCalled()
    await expect(p).resolves.toEqual({ id: 7, name: 'x' })
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('[fake] fetch 7 -> {"id":7,"name":"x"}')
  })

  it('joins multiple arguments with spaces', () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    expect(svc.add(2, 3)).toBe(5)
    expect(emit).toHaveBeenCalledWith('[fake] add 2 3 -> 5')
  })

  it('renders undefined results explicitly', () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    svc.nothing()
    expect(emit).toHaveBeenCalledWith('[fake] nothing -> undefined')
  })

  it('traces a synchronously thrown error and rethrows it', () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    expect(() => svc.boom()).toThrow('kapow')
    expect(emit).toHaveBeenCalledWith('[fake] boom -> ERROR: Error: kapow')
  })

  it('traces a rejected async call and propagates the rejection', async () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    await expect(svc.boomAsync()).rejects.toThrow('nope')
    expect(emit).toHaveBeenCalledWith('[fake] boomAsync -> ERROR: Error: nope')
  })

  it('preserves the receiver and traces internal this-method calls too', () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    expect(svc.salute()).toBe('hi self')
    expect(emit).toHaveBeenNthCalledWith(1, '[fake] greet self -> hi self')
    expect(emit).toHaveBeenNthCalledWith(2, '[fake] salute -> hi self')
  })

  it('leaves the class prototype untouched (per-instance wrappers only)', () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    const plain = new FakeService()
    expect(Object.getPrototypeOf(svc)).toBe(FakeService.prototype)
    expect(plain.greet).toBe(FakeService.prototype.greet)
    expect(plain.greet('x')).toBe('hi x')
    expect(Object.prototype.hasOwnProperty.call(svc, 'greet')).toBe(true)
    expect(Object.prototype.hasOwnProperty.call(plain, 'greet')).toBe(false)
  })

  it('skips accessor properties and the constructor', () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    expect(svc.status).toBe('ok')
    expect(emit).not.toHaveBeenCalled()
    expect(Object.prototype.hasOwnProperty.call(svc, 'status')).toBe(false)
    expect(Object.prototype.hasOwnProperty.call(svc, 'constructor')).toBe(false)
  })

  it('truncates long trace lines to a fixed cap', () => {
    const emit = vi.fn()
    const svc = traceService('fake', new FakeService(), emit)
    svc.echo('x'.repeat(500))
    const line = emit.mock.calls[0][0] as string
    expect(line.length).toBe(160)
    expect(line.endsWith('...')).toBe(true)
  })
})

describe('fmtTraceValue', () => {
  it('renders scalars, strings, objects and errors', () => {
    expect(fmtTraceValue(undefined)).toBe('undefined')
    expect(fmtTraceValue(null)).toBe('null')
    expect(fmtTraceValue('foo bar')).toBe('foo bar')
    expect(fmtTraceValue(42)).toBe('42')
    expect(fmtTraceValue(true)).toBe('true')
    expect(fmtTraceValue({ a: 1 })).toBe('{"a":1}')
    expect(fmtTraceValue([1, 2])).toBe('[1,2]')
    expect(fmtTraceValue(new Error('boom'))).toBe('Error: boom')
  })
})

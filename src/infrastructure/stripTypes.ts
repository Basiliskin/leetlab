// Lossy TypeScript type-stripper used when the CDN TypeScript compiler is
// unavailable. Strips type annotations (params, returns, fields, variables),
// as-casts, non-null assertions, and whole declarations (enum/interface/
// namespace/type) that plain JS cannot represent, while leaving strings,
// comments, ternaries, and object literals intact.

const isIdentChar = (c: string) => /[A-Za-z0-9_$]/.test(c)
const isWs = (c: string) => /\s/.test(c)

// Returns the index just past a type expression starting at `start`, stopping
// at declaration-ish terminators at the top level of the type. Nested
// <>, [], () and {} inside the type are consumed as part of it.
function skipType(src: string, start: number): number {
  let j = start
  while (j < src.length && isWs(src[j])) j++ // type may start after whitespace
  let angle = 0
  let square = 0
  let paren = 0
  let brace = src[j] === '{' ? 1 : 0
  if (brace > 0) j++
  const n = src.length
  while (j < n) {
    const c = src[j]
    if (c === '<') { angle++; j++; continue }
    if (c === '>') { if (angle > 0) angle--; else return j; j++; continue }
    if (c === '[') { square++; j++; continue }
    if (c === ']') { if (square > 0) square--; else return j; j++; continue }
    if (c === '(') { paren++; j++; continue }
    if (c === ')') { if (paren > 0) paren--; else return j; j++; continue }
    if (c === '{') { if (brace > 0) brace++; else return j; j++; continue }
    if (c === '}') { if (brace > 0) brace--; else return j; j++; continue }
    if (c === '=' && src[j + 1] === '>') { j += 2; continue } // `=>` in function types
    if (brace === 0 && angle === 0 && square === 0 && paren === 0) {
      if (';,={}:'.includes(c) || c === '\n') return j
    }
    j++
  }
  return n
}

export function stripTypes(src: string): string {
  // Whole-declaration removal (line-anchored, safe). Lazy match up to the
  // first closing brace handles both single-line and multi-line blocks.
  let code = src
    .replace(/^\s*(?:export\s+)?(?:interface|enum|namespace)\s+[^\n{]*\{[\s\S]*?\}/gm, '')
    .replace(/^\s*(?:export\s+)?type\s+[^\n=]+=[^\n;]+;\s*$/gm, '')
    .replace(/\b(?:public|private|protected|readonly|declare|override|abstract)\s+/g, '')
    .replace(/\bimplements\s+[A-Za-z_$][\w$,.<>|[\]]*\s*(?=\s*\{)/g, '')
    // Return types: `): Type {` / `): Type =>` / `): Type;`. The `{`/`=>`
    // lookahead keeps this from touching ternaries (`x ? f() : g`).
    .replace(/\)\s*:\s*[A-Za-z_$][\w$<>&|[\],.\s]*?(?=\s*\{|\s*=>)/g, ')')
    // Object-typed returns: `): { ... } {` / `): { ... } =>`.
    .replace(/\)\s*:\s*\{[^}]*\}(?=\s*\{|\s*=>)/g, ')')
    // Generic type arguments on functions/classes/arrows/calls: `f<T>`, `new Map<K,V>()`.
    // Requiring no space before `<` keeps comparisons (`a < b`) untouched.
    .replace(/\b(function|class)\s+([A-Za-z_$][\w$]*)\s*<[^<>(){};]+>/g, '$1 $2')
    .replace(/\b([A-Za-z_$][\w$]*)<([^<>(){};]+?)>\s*\(/g, '$1(')
    // Generic arrows: `= <T>(...)` / `( <T>(...)` / `, <T>(...)`.
    .replace(/([=(,]\s*)<([A-Za-z_$][\w$]*)(?:\s*,\s*[A-Za-z_$][\w$]*)*>\s*\(/g, '$1(')
    // Variable declarations: `const x: Type = ...` / `let y: Type;`
    .replace(/\b(const|let|var)\s+([A-Za-z_$][\w$]*)\s*:\s*[^;={}\n]+(?=\s*[=;])/g, '$1 $2')

  // Inline pass: parameter types, class fields, as-casts, non-null `!`.
  const n = code.length
  let out = ''
  let i = 0

  const prevSignificant = (): string => {
    for (let j = out.length - 1; j >= 0; j--) if (!isWs(out[j])) return out[j]
    return ''
  }
  // First significant char before a position; spaces/tabs are skipped but a
  // newline is a hard boundary (it separates a declaration from its context).
  const charBeforeIdent = (identStart: number): string => {
    for (let j = identStart - 1; j >= 0; j--) {
      const ch = out[j]
      if (ch === ' ' || ch === '\t') continue
      if (ch === '\n' || ch === '\r') return '\n'
      return ch
    }
    return ''
  }
  // For `{...}: Type` params: walk back to the matching `{` and check the
  // char before it (must be `(` or `,` — a param list, not an object literal).
  const beforeDestructure = (): string => {
    let depth = 0
    for (let j = out.length - 1; j >= 0; j--) {
      const ch = out[j]
      if (ch === '}') { depth++; continue }
      if (ch === '{') {
        depth--
        if (depth === 0) return charBeforeIdent(j)
      }
    }
    return ''
  }

  while (i < n) {
    const c = code[i]
    const next = code[i + 1]

    // Strings (incl. template literals).
    if (c === '"' || c === "'" || c === '`') {
      out += c
      i++
      while (i < n) {
        const d = code[i]
        out += d
        i++
        if (d === '\\' && i < n) { out += code[i]; i++; continue }
        if (d === c) break
      }
      continue
    }
    // Line and block comments.
    if (c === '/' && next === '/') {
      while (i < n && code[i] !== '\n') { out += code[i]; i++ }
      continue
    }
    if (c === '/' && next === '*') {
      out += '/*'
      i += 2
      while (i + 1 < n && !(code[i] === '*' && code[i + 1] === '/')) { out += code[i]; i++ }
      if (i < n) { out += '*/'; i += 2 }
      continue
    }

    // Identifiers: check for `as` casts in both directions - `x as Type`
    // (as follows the ident being read) and `expr as Type` where expr ends in
    // `]`, `)`, `}` (the `as` itself is read as an identifier here).
    if (isIdentChar(c)) {
      let j = i
      while (j < n && isIdentChar(code[j])) j++
      const ident = code.slice(i, j)
      if (ident === 'as') {
        const prev = prevSignificant()
        const isValue = prev !== '' && (isIdentChar(prev) || prev === ']' || prev === ')' || prev === '}')
        let m = j
        while (m < n && isWs(code[m])) m++
        if (isValue && m < n && isIdentChar(code[m])) {
          i = skipType(code, m)
          continue
        }
      }
      let k = j
      while (k < n && isWs(code[k])) k++
      if (code.startsWith('as', k) && !isIdentChar(code[k + 2])) {
        let m = k + 2
        while (m < n && isWs(code[m])) m++
        if (m < n && isIdentChar(code[m])) {
          out += code.slice(i, k) // keep ident + whitespace, drop `as Type`
          i = skipType(code, m)
          continue
        }
      }
      out += c
      i++
      continue
    }

    // Non-null assertions: drop `!` that follows a value (not `!==` / `!x`).
    if (c === '!') {
      const prev = prevSignificant()
      const isValue = prev !== '' && isIdentChar(prev) || prev === ']' || prev === ')'
      const nxt = (() => { for (let j = i + 1; j < n; j++) if (!isWs(code[j])) return code[j]; return '' })()
      if (isValue && nxt !== '=') { i++; continue }
      out += c
      i++
      continue
    }

    // `ident: Type` in param lists / class fields (with optional `ident?: Type`).
    if (c === ':') {
      let leadIdx = out.length - 1
      let optional = false
      if (out[leadIdx] === '?' && out[leadIdx - 1] !== '?') {
        optional = true
        leadIdx--
      }
      const prev = out[leadIdx] ?? ''
      if (isIdentChar(prev) || prev === '}') {
        let identStart = leadIdx
        while (identStart >= 0 && (isIdentChar(out[identStart]) || out[identStart] === '}')) identStart--
        const before = prev === '}' ? beforeDestructure() : charBeforeIdent(identStart + 1)
        const allowed =
          before === '(' || before === ',' || before === '=' || before === '.' ||
          before === ';' || before === ':' || before === '\n' || before === ''
        if (allowed) {
          const typeEnd = skipType(code, i + 1)
          if (typeEnd > i + 1) {
            out = out.slice(0, optional ? out.length - 1 : out.length)
            i = typeEnd
            continue
          }
        }
      }
      out += c
      i++
      continue
    }

    out += c
    i++
  }
  return out
}

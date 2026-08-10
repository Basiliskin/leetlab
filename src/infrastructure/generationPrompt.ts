// Generation prompt for the LLM problem generator (Phase 5).
//
// A single deterministic prompt asking the model to emit exactly one valid
// `Problem` JSON object. The prompt intentionally carries no bank data: dedupe
// is enforced at accept time by the store (`acceptGeneratedProblem`), so the
// prompt only has to produce a schema-valid, original problem. The output is
// then parsed and strict-validated by `outputValidation.ts`, which re-prompts
// with the collected errors on failure.

export function buildGenerationPrompt(): string {
  return [
    'You are generating a brand-new LeetCode-style practice problem for leetlab, an in-browser judge that runs user code against test cases. The problem must be original (not a verbatim copy of a well-known problem) and must not already exist in the app.',
    '',
    'Return ONLY a single JSON object. No prose, no markdown fences, no comments. Use exactly this shape:',
    '',
    '{',
    '  "slug": "kebab-case-unique-slug",',
    '  "num": 9000,',
    '  "title": "Problem Title",',
    '  "difficulty": "Easy",',
    '  "tags": ["Tag1", "Tag2"],',
    '  "fnName": "functionOrClassName",',
    '  "mode": "fn",',
    '  "starter": { "js": "...", "ts": "..." },',
    '  "tests": [ { "in": [], "out": null } ],',
    '  "hints": ["Hint 1", "Hint 2"],',
    '  "desc": "<p>...</p>"',
    '}',
    '',
    'Field rules:',
    '- slug: lowercase kebab-case (letters, digits, hyphens only), descriptive and unique.',
    '- num: any positive integer (the app renumbers it on accept).',
    '- difficulty: exactly one of "Easy", "Medium", "Hard".',
    '- fnName: a valid JS/TS identifier. For mode "fn" it is the exported function name; for mode "class" it is the class name.',
    '- mode: "fn" for a function-style problem, "class" for a LeetCode class-style problem.',
    '- starter.js and starter.ts: complete valid JavaScript and TypeScript source declaring fnName with the correct signature and empty or stub bodies. TypeScript must include parameter and return types.',
    '- tests: a non-empty array. For mode "fn" each test is { "in": [arg1, arg2, ...], "out": expected } and the arity of "in" must exactly match the starter parameter list. For mode "class" each test is { "calls": [["ClassName", []], ["method", [args]], ...], "out": [resultPerCall, ...] } where the first call constructs the class using fnName as the class name and results use null for void or undefined returns. Cover edge cases (empty input, single element, extremes, negatives, duplicates) and every value must survive JSON.stringify (no functions, undefined, NaN, Infinity, or BigInt).',
    '- hints: an array of 1 to 4 progressive strings, no empty strings.',
    '- desc: an HTML string with a short statement, examples, and constraints. Use ONLY the tags p, code, em, strong, h4, div, b, li, ul, sub, sup and only the classes "ex", "exp", "note". Format examples like LeetCode: <div class="ex"><div><b>Input:</b>...</div><div><b>Output:</b>...</div></div>. No scripts, tables, iframes, event-handler attributes, or javascript: URLs.',
    '',
    'The problem must be solvable with the given signature and suitable for a focused practice session.',
  ].join('\n')
}

# Analyze-repo guide

Operational checklist for **Phase 1** of the product-facts skill: gather evidence from the repository,
cite it, and route it into the five sections. Stay inside this stage — do not draft marketing copy
here.

## Rules

1. **Never invent features.** A claim enters **Verified facts** only if you can trace it to a
   repository file, the README, or user-provided information. Everything else goes to **Unknown**.
2. **Every Verified fact carries a source.** Record the concrete repo-relative file path that backs
   it (see the citation template below).
3. **The README is self-published.** Code is stronger evidence than the README. A README-only claim is
   allowed but is marked `source: README` and never described as code-verified.
4. **Graceful degradation.** If a source is absent (no README, no tests, no assets), say so and move
   the gap to **Unknown** — never fill it with a guess.
5. **Forbidden claims are never produced here.** Do not emit `fastest`, `most secure`,
   `better than competitors`, or `privacy-preserving` from anything in the repo. If the README claims
   one of these, park it under **Forbidden assumptions**, not Verified facts.

## What to scan

For each target below, record what you found and the file path, or record it as absent → **Unknown**.

| Target | Look for |
|---|---|
| `README.md` | what the app does, target users, problem solved, features, install/run, deployment URL |
| `package.json` | name, tech stack (dependencies), scripts, open-source status (license field) |
| `src/` (or `lib/`, `app/`) | actual features, architecture, local-first vs server, signup/auth, API/backend |
| tests | what behavior is asserted; signals feature maturity |
| `docs/`, assets, screenshots | existing promotional material, images |
| CI/config | build and deploy target, runtime hints |

## Citation template

Every finding recorded as a Verified fact uses this shape:

```
- <claim> — source: <repo-relative path>
```

Worked example for a typical SPA:

```
- Built with React — source: package.json
- Written in TypeScript — source: package.json
- Runs as a single-page application — source: index.html, src/main.tsx
- Stores data locally — source: src/storage/local.ts
- No account required — source: src/ (no auth module present)
```

## Routing table

Map each finding type to exactly one destination.

| Finding type | Route to | Example |
|---|---|---|
| Code-supported capability | **Verified facts** | "Runs as an SPA" — source: `src/main.tsx` |
| File paths backing facts | **Repository evidence** | `package.json`, `src/storage/local.ts` |
| Production URL, open-source status, goal, unseen features | **Ask the user (Phase 2)** — not derivable | production URL |
| Missing or unmeasurable data | **Unknown** | "Number of active users", "Performance benchmarks" |
| `fastest` / `most secure` / `better than competitors` / `privacy-preserving` | **Forbidden assumptions** | README claims "the fastest" |

# Product Facts — document template

Copy this template into `docs/marketing/00-product-facts.md` and fill it in. Placeholders are generic
(`<app name>`, `<fact>`); never substitute a hardcoded project. Keep all five sections even when one
is empty — an empty section records a gap, not a missing file.

---

# Product Facts

> Single source of truth for all downstream marketing skills. No promotional material may claim more
> than this document supports.

## Verified facts

Every fact traced to a repository file, the README, or the user. The `source:` field is restricted to
`<repo-relative path>` | `README` | `user`.

- <fact> — source: <repo-relative path>
- <fact> — source: README
- <fact> — source: user

## Repository evidence

Concrete file paths in this repository that back the Verified facts.

- `package.json`
- `src/...`

## User-provided facts

Only the four non-derivable categories: production URL, primary goal, open-source status, features
not visible in the repository.

- Production URL: <url>
- Primary goal: <goal>
- Open-source status: <status>
- Features not visible in the repository: <list>

## Unknown

Gaps recorded as open. Never invent an answer here.

- <gap> (for example: number of active users, performance benchmarks, browser support)

## Forbidden assumptions

Never claim the following without explicit evidence. Un-evidenced occurrences are parked here, not in
Verified facts.

- fastest
- most secure
- better than competitors
- privacy-preserving

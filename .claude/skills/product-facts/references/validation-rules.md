# Validation rules

Validation checklist for **Phase 4** of the product-facts skill. Run the **mechanical** checks first —
they are deterministic and gate everything after them. Then apply the **judgment** checks. Fix every
violation before delivering.

## Mechanical checks (deterministic — always run first)

1. **Forbidden-claim scan.** Grep the document for the four phrases verbatim:
   - `fastest`
   - `most secure`
   - `better than competitors`
   - `privacy-preserving`
   A match in **Verified facts**, **Repository evidence**, or **User-provided facts** is a violation:
   move it to **Forbidden assumptions**. A match inside Forbidden assumptions is correct.
2. **Five-section completeness.** All five headings exist, in order: `Verified facts`,
   `Repository evidence`, `User-provided facts`, `Unknown`, `Forbidden assumptions`. Empty sections
   stay present.
3. **Traceability.** Every bullet in **Verified facts** has a `source:` field, and its value is one of
   `<repo-relative path>` | `README` | `user`. A fact without a source is a violation.
4. **No invented features.** Every Verified fact traces back to a file read during analysis, the
   README, or a recorded user answer. Anything else is moved to **Unknown**.
5. **Write target.** The file is at `docs/marketing/00-product-facts.md` relative to the repository
   root — never the skill's install location.
6. **No hardcoded project names.** No application name from outside the analyzed repo appears anywhere
   in the document.

## Judgment checks (LLM — run after the mechanical pass)

7. **README skepticism.** A claim sourced only to the README is not described as code-verified.
8. **No overstatement.** Wording does not exceed the evidence (no "guaranteed", "the best", "the
   only").
9. **Graceful degradation.** Gaps recorded in **Unknown** stayed open rather than being filled by
   guess.
10. **User-facts scope.** User-provided facts cover only the four non-derivable categories.

## Result

All mechanical checks pass and no judgment check raises a violation → the document is ready to be the
source of truth. Any violation → fix the document and re-run the checks before delivering.

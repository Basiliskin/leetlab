# Ask-user guide

Operational checklist for **Phase 2** of the product-facts skill: ask the user only for information
the repository cannot provide, one question at a time, and record each answer as a User-provided
fact.

## When to ask

Ask only after Phase 1 (analyze-repo) is complete. Show the user what analysis found and what is
still missing, then ask only about gaps in the four allowed categories:

1. **Production URL** — where the app is deployed; not derivable from source.
2. **Primary goal** — users, feedback, portfolio visibility, job opportunities; not derivable.
3. **Open-source status** — public repo, license, or closed; not derivable from a missing `license`
   field.
4. **Features not visible in the repository** — anything shipped or planned that the code does not
   show.

Everything else is derivable or belongs in **Unknown**. Do not ask about it.

## Flow: one question per turn

1. Present the analysis summary and the list of non-derivable gaps that remain.
2. Ask **one** of the four categories per turn, in the order above (skip any category the user has
   already answered).
3. After each answer, record it immediately as a User-provided fact and move to the next open
   category.
4. **Stop condition:** stop asking when all four categories are answered, or when the user says they
   have nothing to add.
5. **Decline path:** the user may decline any question ("skip", "unknown", "I don't have that").
   Record the declined item in **Unknown** and stop asking about it.

## Recording answers

- Store each answer as a **User-provided fact** with `source: user`.
- Never merge a user answer into a Verified fact, and never invent details around it.
- If an answer would imply a forbidden claim (for example, the user volunteers "it's the fastest"),
  record it under **Forbidden assumptions** with `source: user`, not as a Verified fact.

## Never solicit forbidden claims

Do not phrase a question to elicit `fastest`, `most secure`, `better than competitors`, or
`privacy-preserving`. These are recorded only when the user volunteers explicit evidence, and even
then they stay in **Forbidden assumptions**.

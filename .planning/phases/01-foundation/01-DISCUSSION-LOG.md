# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-10-02
**Phase:** 1-Foundation
**Areas discussed:** Brand tokens & dark mode, Refactor fidelity, Upgrade & ship strategy, Capability fallback policy

---

## Brand tokens & dark mode

| Question | Options | Selected |
|----------|---------|----------|
| Palette at end of Phase 1 | New palette now / Fix existing greens only / You decide | New palette now |
| Auto dark mode | Drop it, single theme / Keep auto dark mode / You decide | Drop it |
| Typography | Wire Inter correctly / Pick display + body fonts now / You decide | You decide |
| Hex values | Claude proposes, AA-checked / I have specific colors | Claude proposes, AA-checked |
| Token naming | Semantic / Literal color names / Both layers | Semantic |

---

## Refactor fidelity

| Question | Options | Selected |
|----------|---------|----------|
| Fidelity of split | Same content, new tokens / Allow light restructuring | Same content, new tokens |
| Commented-out JSX | Delete all / Restore some | Delete all |
| About page | Split About too / Home only | Split About too |
| File layout | Per-page subfolders / Flat / You decide | You decide |

---

## Upgrade & ship strategy

| Question | Options | Selected |
|----------|---------|----------|
| Ship timing | Merge to main after Phase 1 / Feature branch until end / Preview deploy then main | Merge to main after Phase 1 |
| Upgrade order | Stepwise, verify each / All at once | Stepwise |
| Next 16 prefetch fallback | Drop to 15.5.x / Work around on 16 / You decide | You decide |
| Node version | Node 22 + .nvmrc / Node 20 minimum / You decide | You decide |

---

## Capability fallback policy

| Question | Options | Selected |
|----------|---------|----------|
| Low-power signals | Explicit + light heuristics / Explicit only / Add FPS probe | Explicit + light heuristics |
| User override | No global toggle / Persistent site toggle | No global toggle |
| API shape | Per-feature verdicts / Raw signals only / You decide | Per-feature verdicts |
| Live updates | Subscribe to changes / Detect once | Subscribe to changes |

---

## Claude's Discretion

- Typography scope in Phase 1
- Section folder layout
- Next 16 prefetch fallback choice
- Exact Node version (≥ 20, prefer an LTS that isn't EOL) and `.nvmrc`/`engines`

## Deferred Ideas

- Site-wide persistent reduce-motion toggle
- Runtime FPS probe
- Employers/Candidates/How-it-works restructuring (Phase 3)

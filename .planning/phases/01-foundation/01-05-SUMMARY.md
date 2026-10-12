---
phase: 01-foundation
plan: 05
subsystem: capabilities
tags: [react, useSyncExternalStore, context, webgl, prefers-reduced-motion, tdd]

# Dependency graph
requires: ["01-02"]
provides:
  - "Pure signal-to-verdict module: src/lib/capabilities.ts (SSR_DEFAULT_SIGNALS, STATIC_VERDICTS, readSignals, deriveVerdicts)"
  - "Shared types: src/types/capabilities.ts (CapabilitySignals, CapabilityVerdicts, Capabilities, CapabilityEnv, NetworkInformationLike)"
  - "Live-subscribing client hook: src/hooks/useCapabilitySignals.ts (useSyncExternalStore, matchMedia + connection change listeners, cached WebGL probe)"
  - "CapabilitiesProvider + useCapabilities() mounted once in src/app/layout.tsx around all pages"
  - "node:test unit coverage: scripts/capabilities.test.mjs (14 cases) + npm test script"
affects: ["Phase 2 (HERO-03)", "Phase 3 (VID-05)", "Phase 4 (MOT-01)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure rule module (no React, no DOM globals) imported via relative import type into a node:test file that Node's --experimental-strip-types loader can run directly against .ts source"
    - "useSyncExternalStore with a frozen SSR_DEFAULT_SIGNALS server snapshot (D-16) instead of useEffect+setState"
    - "Fail-static context consumer: useCapabilities() returns STATIC_VERDICTS outside a provider instead of throwing"
    - "Module-level WebGL probe cache + WEBGL_lose_context release, so repeated getSnapshot() calls never re-probe or leak contexts (T-05-02)"

key-files:
  created:
    - src/types/capabilities.ts
    - src/lib/capabilities.ts
    - scripts/capabilities.test.mjs
    - src/hooks/useCapabilitySignals.ts
    - src/providers/CapabilitiesProvider.tsx
  modified:
    - package.json
    - src/app/layout.tsx

key-decisions:
  - "Node --experimental-strip-types (no --experimental-detect-module needed) loaded src/lib/capabilities.ts directly from the .mjs test file on Node 22.23.2 — the plan's fallback script variant was not required"
  - "hardwareConcurrency: a value of 0 is treated as null/unknown per the plan's explicit rule, applied the same way deviceMemory null-coalescing is applied"
  - "getConnection() reads navigator.connection through a NavigatorWithHints cast rather than `any`, keeping the hook's lint/tsc gates clean"

requirements-completed: [CAP-01]

# Metrics
duration: 25min
completed: 2026-10-11
---

# Phase 1 Plan 5: Shared Capability Check (CAP-01) Summary

**A pure, unit-tested signal-to-verdict module (`deriveVerdicts`) is the single source of truth for `canAnimateHero`/`canPlayVideo`/`canAnimateScroll`, exposed through a live-subscribing `useSyncExternalStore` hook and a `CapabilitiesProvider` mounted once in `layout.tsx`, defaulting to the static fallback on SSR and upgrading only after client-side detection.**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-10-11
- **Tasks:** 2
- **Files modified:** 7 (5 created, 2 modified)

## Public API for Phase 2-4 Consumers

```ts
import { useCapabilities } from "@/providers/CapabilitiesProvider";

const { canAnimateHero, canPlayVideo, canAnimateScroll, signals } = useCapabilities();
```

Outside a `<CapabilitiesProvider>` (or before client hydration), `useCapabilities()` returns `{ canAnimateHero: false, canPlayVideo: false, canAnimateScroll: false, signals: SSR_DEFAULT_SIGNALS }` — it never throws (fail-static, matches the core value that the page works when enhancements fail).

## Rule Table (the only place this mapping lives — `src/lib/capabilities.ts`, D-14)

| Signal | Effect |
|---|---|
| `!signals.detected` (SSR / pre-hydration) | All three verdicts `false` (D-16) |
| `prefersReducedMotion === true` | All three verdicts `false` |
| `saveData === true` or `effectiveType` is `"2g"`/`"slow-2g"` | `canAnimateHero` and `canPlayVideo` `false`; `canAnimateScroll` unaffected (not network-gated) |
| `deviceMemory !== null && deviceMemory <= 2` | All three verdicts `false` |
| `hardwareConcurrency !== null && hardwareConcurrency <= 2` | All three verdicts `false` |
| `webgl !== true` | `canAnimateHero` `false` only (video/scroll don't need WebGL) |
| A signal's underlying API is missing | That signal is `null` ("unknown"), never treated as low-end (D-12) — e.g. Safari with no `deviceMemory` still gets `true` verdicts if everything else is capable |

Live updates: the hook subscribes to `matchMedia("(prefers-reduced-motion: reduce)")` `change` and, where available, `navigator.connection`'s `change` event (D-15), so verdicts update without a reload when the OS setting or network type changes mid-visit.

No override, toggle, or `localStorage` exists anywhere in this code (D-13) — grep-verified clean in both tasks' verification gates.

## Task Commits

Each task was committed atomically, following the plan's RED → GREEN TDD gate for Task 1:

1. **Task 1a (RED):** `test(01-05): add failing tests for capability verdict rules` - `f704d6c`
2. **Task 1b (GREEN):** `feat(01-05): implement pure capability signal and verdict rules` - `727b3a9`
3. **Task 2:** `feat(01-05): add CapabilitiesProvider with live reduced-motion/connection subscriptions, mounted in root layout` - `ba56d4f`

## TDD Gate Compliance

- RED gate: `f704d6c` — 14 `node:test` cases written against the not-yet-existing `src/lib/capabilities.ts`; `npm test` confirmed to fail with `ERR_MODULE_NOT_FOUND` before any implementation existed.
- GREEN gate: `727b3a9` — implementation added; all 14 tests pass; `npx tsc --noEmit` exits 0.
- No REFACTOR commit was needed — the GREEN implementation matched the interfaces-block contract on the first pass.

## Files Created/Modified

- `src/types/capabilities.ts` — `CapabilitySignals`, `CapabilityVerdicts`, `Capabilities`, `NetworkInformationLike`, `CapabilityEnv` (types only, erasable)
- `src/lib/capabilities.ts` — `SSR_DEFAULT_SIGNALS`, `STATIC_VERDICTS` (both `Object.freeze`d), `readSignals(env)`, `deriveVerdicts(signals)`; no `window`/`navigator`/`document`/`localStorage`/`any`
- `scripts/capabilities.test.mjs` — 14 `node:test` cases covering every D-12 signal, the D-16 default, and `readSignals` with both a minimal and a fully-populated `CapabilityEnv`
- `package.json` — added `"test": "node --experimental-strip-types --test scripts/capabilities.test.mjs"`
- `src/hooks/useCapabilitySignals.ts` — `'use client'`; `useCapabilitySignals()` via `useSyncExternalStore`; module-level cached WebGL probe (`WEBGL_lose_context` release); `subscribe`/`getSnapshot`/`getServerSnapshot`
- `src/providers/CapabilitiesProvider.tsx` — `'use client'`; `CapabilitiesProvider` + `useCapabilities()` named exports (deliberate deviation from the default-export convention, since two exports are required from one file)
- `src/app/layout.tsx` — added the `CapabilitiesProvider` import and wrapped `{children}` in `<CapabilitiesProvider>`; `RootLayout` remains a server component; `metadata`, Inter font wiring, and all existing classNames are unchanged

## Decisions Made

- **No fallback test-script variant needed:** the plan allowed falling back to `node --experimental-strip-types --experimental-detect-module ...` if Node 22 refused to load the `.ts` module from the `.mjs` test file. On this Linux/WSL2 environment (Node v22.23.2), the plain `--experimental-strip-types` flag loaded `src/lib/capabilities.ts` directly without issue — no fallback was exercised.
- **`hardwareConcurrency === 0` treated as `null`:** per the plan's explicit instruction ("treat a value of 0 as null"), applied as a ternary alongside the `deviceMemory` null-coalescing in `readSignals`.
- **`NavigatorWithHints` type cast instead of `any`:** `navigator.connection`/`navigator.deviceMemory` aren't in the standard TS DOM lib types, so a local intersection type (`Navigator & { connection?: ...; deviceMemory?: number }`) is used in the hook file to stay lint/tsc-clean without `any`. This is scoped to `useCapabilitySignals.ts`, which the plan already designates as the DOM-access boundary (the pure `src/lib/capabilities.ts` has no such cast and no DOM references at all).

## Deviations from Plan

None — plan executed exactly as written. Both tasks' automated verification blocks (grep gates, `npm test`, `npm run build`, `npm run lint`, `npx tsc --noEmit`) passed on the first attempt with no auto-fixes required.

## Verification Results

- `npm test`: 14/14 `node:test` cases pass
- `npx tsc --noEmit`: exits 0
- `npm run lint`: exits 0 (0 errors; 3 pre-existing `@next/next/no-img-element` warnings in the unrelated, out-of-scope `src/app/goals/page.tsx` — not touched by this plan)
- `npm run build`: static export succeeds; `out/about.html` contains "Professional Experience"; `out/index.html` contains "Our Services" (sections 01-03/01-04 have not merged into this worktree yet, so the pre-extraction monolithic `page.tsx` content is what's present — this matches the plan's either/or acceptance wording)
- All Task 1 and Task 2 grep-based acceptance gates from `01-05-PLAN.md` pass (verified individually above)

## Known Stubs

None. This plan has no consumer yet (by design — Phase 1 builds the capability check, Phases 2-4 read it), but there is no stubbed data, placeholder text, or hardcoded-empty rendering anywhere in the files this plan touches.

## Threat Flags

None. All four threat register entries (T-05-01 through T-05-04) from the plan's own `<threat_model>` are addressed directly by the implementation as designed (accept/mitigate dispositions matched):
- T-05-02 (WebGL probe DoS): module-level cache + `WEBGL_lose_context` release — implemented in `useCapabilitySignals.ts`
- T-05-03 (fingerprinting): no storage, no network transmission — grep-verified clean
- T-05-04 (hydration mismatch): `getServerSnapshot` returns `SSR_DEFAULT_SIGNALS` — implemented verbatim

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CAP-01 is satisfied: `useCapabilities()` is mounted site-wide via `layout.tsx`, defaults to the static fallback on SSR/first render, and is ready for Phase 2's hero (`canAnimateHero`), Phase 3's video (`canPlayVideo`), and Phase 4's scroll motion (`canAnimateScroll`) to consume without re-implementing any detection logic.
- No section component anywhere in this worktree has `'use client'` — the capability check remains fully isolated to `src/hooks/` and `src/providers/`, as required.
- No blockers identified for downstream phases.

---
*Phase: 01-foundation*
*Completed: 2026-10-11*

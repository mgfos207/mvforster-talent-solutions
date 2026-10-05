---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [nextjs, eslint, static-export, rsc-prefetch]

# Dependency graph
requires: ["01-01"]
provides:
  - "Next.js 16.3.8 static export (output: 'export'), React 18 kept"
  - "ESLint 9 native flat config for eslint-config-next 16 (no FlatCompat/@eslint/eslintrc)"
  - "Single canonical next.config.js, no basePath; next.config.ts and next.config.jsold deleted"
  - "D-11 prefetch smoke test passed — no RSC/__next*/.txt 404s on / <-> /about navigation"
affects: ["01-03", "01-04", "01-05", "01-06"]

# Tech tracking
tech-stack:
  added: ["next@16.3.8", "eslint@9.39.5", "eslint-config-next@16.3.8"]
  removed: ["@eslint/eslintrc", "next.config.ts", "next.config.jsold"]
  patterns:
    - "Native ESLint 9 flat config (defineConfig/globalIgnores from eslint/config) replacing FlatCompat shim"
    - "D-11 smoke-test gate: production static export verified via python3 http.server (no Next runtime) before any section-extraction work begins"

key-files:
  modified:
    - package.json
    - package-lock.json
    - eslint.config.mjs
    - tsconfig.json
    - next-env.d.ts
    - src/app/page.tsx
    - src/app/about/page.tsx
  deleted:
    - next.config.ts
    - next.config.jsold

key-decisions:
  - "Next.js 16.3.8 confirmed stable for this project — the only open research risk (vercel/next.js#85374, Windows-only RSC prefetch 404 bug) did not reproduce on this Linux/WSL2 dev environment; no fallback (prefetch={false} or Next 15.5.x pin) was needed"
  - "Skipped npx @next/codemod — project has no dynamic routes, params/searchParams, middleware, or API routes, so there was nothing for the codemod to migrate; avoided an unpinned package fetch"
  - "Accepted Next 16's automatic tsconfig.json edits (jsx: react-jsx, added .next/dev/types include) rather than fighting them, per plan instruction"

requirements-completed: [FOUND-02, FOUND-04]

# Metrics
duration: 12min
completed: 2026-10-05
---

# Phase 1 Plan 2: Next.js 16 Upgrade + D-11 Prefetch Smoke Test Summary

**Next.js upgraded 14.2.35 -> 16.3.8 on ESLint 9's native flat config, with the project's one open research risk (Windows-only RSC prefetch 404 bug, vercel/next.js#85374) smoke-tested and confirmed non-reproducing before any section extraction begins.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-10-05
- **Tasks:** 2
- **Files modified:** 7 (2 deleted, 5 modified)

## Accomplishments

- Upgraded `next` 14.2.35 -> 16.3.8 (exact pin), kept `react`/`react-dom` at `^18.2.0` per the Init decision to avoid forcing React 19
- Bumped ESLint toolchain to `eslint@9.39.5` + `eslint-config-next@16.3.8` (exact pins); rewrote `eslint.config.mjs` as a native flat config (`eslint-config-next/core-web-vitals` + `/typescript`), removing `FlatCompat` and the `@eslint/eslintrc` dependency entirely
- `lint` script changed from `"eslint"` to `"eslint ."`
- Deleted the dead `next.config.ts` (stale `basePath: '/mvforster-talent-solutions'`) and `next.config.jsold`; `next.config.js` is the sole effective config, unchanged, with no `basePath` (FOUND-04)
- Fixed 3 blocking `react/no-unescaped-entities` lint errors introduced by the ESLint 9 ruleset in `src/app/page.tsx` and `src/app/about/page.tsx` with minimal `&apos;` escapes
- `npm ci && npm run build`, `npm run lint`, and `npx tsc --noEmit` all exit 0
- Structural pre-check for Pitfall 1 (backslash-named RSC payload files) found none (`find out -name '*\\*'` empty)
- **D-11 smoke test (Task 2, checkpoint): approved.** User performed two `/` <-> `/about` round trips in Chrome DevTools (Preserve log) against the production static export served via `python3 -m http.server 4173 --directory out`. Zero 404s on any `__next*`/`__PAGE__`/`.txt` request; no RSC/prefetch console errors. Automated curl pre-checks (index.html 200, about.html 200, about.html contains "Professional Experience") also passed. No fallback was required.

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade step 3 — Next.js 16.3.8 + ESLint 9 flat config, delete dead Next configs** - `5d713ee` (feat)
2. **Task 2: D-11 prefetch smoke test — checkpoint approved, no code changes (no fallback needed)**

## RSC Payload Files (Pitfall 1 structural check)

From `/tmp/01-02-rsc.txt` (`find out \( -name '*.txt' -o -name '__next*' \)`), all well-formed with no backslashes:

```
out/__next.__PAGE__.txt
out/__next._full.txt
out/__next._tree.txt
out/_not-found.txt
out/_not-found/__next._full.txt
out/_not-found/__next._not-found.__PAGE__.txt
out/_not-found/__next._tree.txt
out/about.txt
out/about/__next._full.txt
out/about/__next._tree.txt
out/about/__next.about.__PAGE__.txt
out/goals.txt
out/goals/__next._full.txt
out/goals/__next._tree.txt
out/goals/__next.goals.__PAGE__.txt
out/index.txt
```

## tsconfig.json Auto-edits (accepted, not fought)

Next 16 rewrote `tsconfig.json` on first build: `jsx` changed to `react-jsx`, and an additional `include` path for `.next/dev/types` was added alongside the existing `next-env.d.ts`/`.next/types`/`**/*.ts`/`**/*.tsx` entries. `next-env.d.ts` was also regenerated by Next. Both accepted per plan instruction (Next 16 requires these).

## Codemod Skip Rationale

`npx @next/codemod` was deliberately not run. This project has no dynamic routes, no `params`/`searchParams` usage, no middleware, and no API routes — the codemod would have had nothing to migrate. Skipping it avoided fetching an additional unpinned package, consistent with threat mitigation T-02-SC.

## D-11 Smoke Test Outcome (Task 2 detail)

- **Server:** `python3 -m http.server 4173 --directory out` (no Next.js runtime involved — pure static file serving, matching GitHub Pages behavior for prefetch-payload requests)
- **Automated pre-checks:** `curl` to `/index.html` -> 200, `/about.html` -> 200, `/about.html` body contains "Professional Experience"
- **Manual verification (user, Chrome DevTools, Preserve log):** two full `/` <-> `/about` round trips via header `<Link>` hover-then-click (prefetch triggered) and logo click back to home; Network tab filtered on `__next` and `.txt` showed zero 404s; Console tab showed no RSC/prefetch errors
- **Result:** approved, no fallback needed, Next 16.3.8 retained (FOUND-02 satisfied as originally stated, not amended)
- **Cleanup:** background python server confirmed stopped (no `http.server 4173` process present)

## Files Created/Modified

- `package.json` - `next` 14.2.35 -> 16.3.8; `eslint` -> 9.39.5; `eslint-config-next` -> 16.3.8; removed `@eslint/eslintrc`; `lint` script `"eslint"` -> `"eslint ."`
- `package-lock.json` - Regenerated for the Next 16 / ESLint 9 dependency tree
- `eslint.config.mjs` - Native flat config: `defineConfig([...nextVitals, ...nextTs, globalIgnores([...])])`, no `FlatCompat`/`dirname`/`fileURLToPath`
- `tsconfig.json` - Next-16-driven auto-edits (`jsx: react-jsx`, added include path)
- `next-env.d.ts` - Regenerated by Next 16
- `src/app/page.tsx` - Minimal `&apos;` escape fix (lint)
- `src/app/about/page.tsx` - Minimal `&apos;` escape fix (lint)

**Deleted:** `next.config.ts`, `next.config.jsold`

## Decisions Made

- **Next 16.3.8 kept, no fallback:** The D-11 smoke test is the deciding gate for FOUND-02's Next.js version. It passed cleanly on the first attempt in this Linux/WSL2 environment, so the plan's fallback ladder (`prefetch={false}` on Header links, then pinning `next@15.5.x`) was not exercised. `Header.tsx` is unchanged by this plan.
- **No codemod run:** see Codemod Skip Rationale above.
- **tsconfig/next-env.d.ts auto-edits accepted as-is.**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 3 blocking `react/no-unescaped-entities` lint errors**
- **Found during:** Task 1 (`npm run lint` after the ESLint 9 / eslint-config-next 16 bump)
- **Issue:** The upgraded ruleset flagged unescaped apostrophes in JSX text in `src/app/page.tsx` and `src/app/about/page.tsx`, which block `npm run lint` from exiting 0 (a plan acceptance criterion).
- **Fix:** Replaced raw apostrophes with `&apos;` at the 3 flagged locations only.
- **Files modified:** `src/app/page.tsx`, `src/app/about/page.tsx`
- **Commit:** `5d713ee` (part of Task 1 commit)

No deviations in Task 2 — checkpoint approved on first pass, no fallback code changes needed.

---

**Total deviations:** 1 auto-fixed (Rule 1 - lint-blocking bug fix)
**Impact on plan:** Necessary to satisfy the plan's own `npm run lint` exit-0 acceptance criterion. No scope creep.

## Issues Encountered
None beyond the lint-fix deviation above. The project's one open research risk (vercel/next.js#85374) did not reproduce.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- FOUND-02 (Next.js 16 upgrade) and FOUND-04 (single Next config, no basePath) are both satisfied.
- Plan 01-03 (section extraction) can proceed on a verified Next 16.3.8 static export with no prefetch regressions.
- No blockers identified; the Phase 1 "Next.js 16 prefetch behavior unverified" concern from STATE.md is now resolved and should be cleared.

---
*Phase: 01-foundation*
*Completed: 2026-10-05*

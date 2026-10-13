---
phase: 02-webgl-hero
plan: 07
subsystem: ui
tags: [gap-closure, webgl, still, crossfade, determinism, regression-test]

# Dependency graph
requires:
  - phase: 02-webgl-hero (plan 06)
    provides: hero-harness.mjs chromeBaseFlags()/--break-shader infrastructure
provides:
  - "HERO_STILL_SIZES with mobile/tablet/desktop variants carrying cssWidth/cssHeight/dpr/minCssWidth/maxCssWidth, plus HERO_STILL_SRC and HERO_STILL_MEDIA"
  - "scripts/hero-stills.test.mjs: tier/served-range parity, dims, media, PATHS tests and a Hero.tsx drift guard"
  - "hero-harness.mjs: dpr-aware rendering, pre-render nodeCountForWidth tier gate, --verify-stills live-vs-committed diff with built-in negative control"
  - "public/hero/hero-still-tablet.webp (768-1023px) and regenerated tier-correct mobile still (CSS 390x844 @ dpr 2)"
  - "Config-driven Hero.tsx <picture> (two <source>s + desktop <img>)"
affects: [phase-03-video-sections, phase-04-cta-everywhere]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Served-range config as single source of truth: media query strings, srcs, and fallback dims are derived from the same numbers the tier tests check, and a source-text drift test forbids hardcoding them in Hero.tsx"
    - "Regression checks ship with a built-in negative control (old buggy config must FAIL), so the check proves its own sensitivity on every run"

key-files:
  created:
    - scripts/hero-stills.test.mjs
    - public/hero/hero-still-tablet.webp
  modified:
    - src/components/hero/heroConfig.ts
    - scripts/hero-harness.mjs
    - src/components/sections/Hero.tsx
    - public/hero/hero-still-mobile.webp

key-decisions:
  - "Desktop non-16:9: documented acceptance, not live cover-fit projection. Node tier, link distance, and point size match on every served viewport; pixel-exact only at each variant's reference CSS size; object-cover crop shifts node positions by a bounded amount during the 800ms crossfade at other aspects"
  - "--verify-stills bigDiffFraction threshold tightened from 0.005 to 5e-5 using measured values; at 0.005 the negative control passed, so the plan's starting threshold was not sensitive to tier mismatch"
  - "meanAbsDiff cannot discriminate tier mismatch (gradient is resolution-independent and dominates the frame; ~1.3 for both pass and control) — bigDiffFraction is the discriminating metric"

patterns-established:
  - "Tier gate before render: the harness refuses to render a still whose CSS width resolves to a different node tier than its served range"

requirements-completed: [HERO-02, HERO-03]

# Metrics
duration: 14min
completed: 2026-10-12
---

# Phase 2 Plan 07: Tier-Matched Hero Stills Summary

**Each pre-rendered hero still is now rendered at a CSS size inside its own served range (mobile 390x844@2, new tablet 820x1180@2, desktop 1920x1080@1). As a result, the still and the live t=0 frame share node tier, link scale, and point size on every viewport. npm tests, a harness tier gate, and a `--verify-stills` diff with a negative control enforce this, closing VERIFICATION.md gap 1 (REVIEW WR-04).**

## Performance

- **Duration:** ~14 min (resumed run; a prior executor was killed mid-Task 1 before any commit)
- **Started:** 2026-10-12T19:50:16-05:00
- **Completed:** 2026-10-12T20:04:00-05:00
- **Tasks:** 3
- **Files modified:** 6 (2 created, 4 modified) plus regenerated harness artifacts

## Accomplishments
- `heroConfig.ts`: `HERO_STILL_SIZES` now has `mobile`, `tablet`, and `desktop` entries. Each carries render CSS size, dpr, output pixel dims, and a served range that exactly tiles [0, inf) at the 768/1024 breakpoints. The plan also added `HERO_STILL_SRC`, a tablet path, and `HERO_STILL_MEDIA`, whose media strings are built from the range numbers. A comment block records the guarantee and the accepted limitation. The module is still import-free.
- `scripts/hero-stills.test.mjs`: 7 node:test cases. They check that render width and the whole served range resolve to the same tier (22/36/48), that the render width lies inside its range, output = CSS x dpr, range tiling equals the breakpoints, media strings rebuilt from numbers, PATHS = "public" + SRC, and a Hero.tsx drift guard.
- `scripts/hero-harness.mjs`: `dpr` is threaded through server, entry script, and Chrome via `--force-device-scale-factor`, defaulting to 1 so `--check` and `--break-shader` are unchanged. Every screenshot's dims are now checked, and a `nodeCountForWidth` tier gate runs before each still is rendered. `--still all` now covers mobile, tablet, and desktop, and variant lookup uses `Object.hasOwn`. The new `--verify-stills` mode includes a negative control. `decodeRgb` accepts known dims so it can decode WebP inputs.
- Stills regenerated. Mobile is 780x1688 (5,092 B), tablet is 1640x2360 (11,740 B, new), and desktop is 1920x1080 (7,560 B, byte-identical to before, which confirms determinism). All pass RIFF/WEBP and are far under the 61,440 B ceiling, with no 85%-scale fallback.
- `Hero.tsx`: the `<picture>` has mobile and tablet `<source>`s plus the desktop `<img>`, all from heroConfig. It is still a server component (no `use client`).

## --verify-stills results

| Check | meanAbsDiff | bigDiffFraction | Result |
|---|---|---|---|
| mobile (390x844 @2) | 1.312 | 1.52e-6 | pass |
| tablet (820x1180 @2) | 1.334 | 1.29e-6 | pass |
| desktop (1920x1080 @1) | 1.373 | 4.82e-7 | pass |
| negative control (old mobile: CSS 780x1688 @1, 36-node tier) | 1.341 | 5.07e-4 | **fails as expected** |

Thresholds: meanAbsDiff <= 4, bigDiffFraction <= 5e-5.

## Mutation proof (Task 1)

Temporarily setting `HERO_STILL_SIZES.mobile` to `cssWidth: 780, dpr: 1` made `still render CSS width resolves to the same node tier as its entire served range` fail with `mobile: cssWidth tier != min tier`. The file was then reverted from a backup before commit, and the Task 1 commit contains the correct 390@2 values.

## Task Commits

1. **Task 1: Extend still config contract and add tier-parity tests**: `dfc1912` (feat)
2. **Task 2: dpr-aware harness, tier gate, --verify-stills, regenerate stills**: `2fc284e` (feat)
3. **Task 3: Config-driven Hero.tsx picture, full suite and smoke**: `d17e059` (feat)

## Files Created/Modified
- `src/components/hero/heroConfig.ts`: extended still contract and the documented limitation
- `scripts/hero-stills.test.mjs`: tier/range/dims/media/PATHS tests and the drift guard
- `scripts/hero-harness.mjs`: dpr threading, tier gate, `--verify-stills`, `compareFrames`, `Object.hasOwn`
- `src/components/sections/Hero.tsx`: `<picture>` derived from heroConfig
- `public/hero/hero-still-mobile.webp` (regenerated), `public/hero/hero-still-tablet.webp` (new)
- `.planning/phases/02-webgl-hero/artifacts/`: hero-still-{mobile,tablet}.png sources plus verify-*.png evidence, including the negative-control render

## Verification
- `npm test`: 60/60 pass, up from 53 (+7 hero-stills)
- `npx tsc --noEmit`: clean. `npm run lint`: 0 errors (same 3 pre-existing `<img>` warnings)
- `npm run build`: static export OK. `out/index.html` contains all three still filenames and `(min-width: 768px) and (max-width: 1023px)`
- `node scripts/hero-smoke.mjs`: HERO_SMOKE_OK. `git status src/app/globals.css` is clean afterward
- Harness: `--still all`, `--verify-stills`, `--check`, and `--break-shader gradient` all exit 0

## Decisions Made
See key-decisions in the frontmatter. The aspect-ratio limitation is accepted and recorded in heroConfig.ts.

**Proposed VERIFICATION override (if the verifier needs a formal record):**
```yaml
overrides:
  - truth: "The node layout is deterministic from HERO_SEED, so the live first frame (t=0) matches the pre-rendered still"
    accepted: "Node tier, link distance, and point size match on every served viewport; pixel-exact match holds at each variant's reference CSS size (390x844, 820x1180, 1920x1080). At other aspect ratios within a tier, object-cover cropping shifts node positions by a bounded amount during the 800ms crossfade. Live cover-fit projection deliberately not adopted (02-07 objective)."
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The --verify-stills threshold could not detect the tier mismatch it exists to catch**
- **Found during:** Task 2
- **Issue:** The plan's starting threshold was bigDiffFraction <= 0.005. At that value the negative control passed (5.07e-4), so the run failed with "verify-stills is not sensitive to tier mismatch".
- **Fix:** Tightened it to 5e-5 based on measured values, which the plan explicitly allows ("may tighten, must not loosen"). meanAbsDiff stays at 4. The rationale is documented next to the constants.
- **Files modified:** scripts/hero-harness.mjs
- **Commit:** 2fc284e

**2. [Resume] Task 1 config came from the killed executor**
- The leftover uncommitted `heroConfig.ts` diff was reviewed against the Task 1 spec and kept unchanged. It already had correct values, the comment block, and literal breakpoints with references. Because the config existed before the tests, Task 1 has no separate RED commit. The mutation proof above stands in for the RED evidence.

## TDD Gate Compliance
Task 1 (`tdd="true"`) was committed as a single `feat` commit with no preceding `test` commit, because the implementation already existed in the working tree from the interrupted run. The failing-test evidence is the recorded mutation proof.

## Issues Encountered
None beyond the threshold deviation.

## User Setup Required
None.

## Next Phase Readiness
- VERIFICATION.md gap 1 is closed for tier, link scale, and point size on every served viewport, and pixel-exact at the reference sizes. Gap 2 was already closed by 02-06. Phase 2 is ready for re-verification.

---
*Phase: 02-webgl-hero*
*Completed: 2026-10-12*

## Self-Check: PASSED

All created files exist; commits dfc1912, 2fc284e, d17e059 present in git log.

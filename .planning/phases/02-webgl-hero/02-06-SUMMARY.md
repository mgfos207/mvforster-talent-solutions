---
phase: 02-webgl-hero
plan: 06
subsystem: ui
tags: [webgl, ogl, fail-invisible, shaders, regression-test, headless-chrome]

# Dependency graph
requires:
  - phase: 02-webgl-hero (plans 01-05)
    provides: createHeroScene()/useHeroRenderer() WebGL hero stack, hero-harness.mjs render/check/still infrastructure
provides:
  - "assertProgramLinked()/releaseContext() guards that make createHeroScene() throw (and release the GL context) on any WebGL program link failure, so useHeroRenderer's existing fail-invisible catch keeps the still visible"
  - "scripts/hero-harness.mjs --break-shader gradient|points|lines: real-headless-Chrome proof that a genuine shader link failure in each of the three programs throws the expected error and leaves the context lost"
  - "scripts/hero-gl-guards.test.mjs: fake-gl unit coverage of the guard/release helpers"
affects: [phase-03-video-sections, phase-04-cta-everywhere]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure-module (no runtime imports) helper pattern extended to glGuards.ts, matching heroConfig.ts/nodeNetwork.ts so Node's --experimental-strip-types test loader can import it directly"
    - "GPU-resource construction inside a scene factory wrapped in try/catch with a release-then-rethrow cleanup path, so a partial-construction failure never leaks a live WebGL context"

key-files:
  created:
    - src/components/hero/glGuards.ts
    - scripts/hero-gl-guards.test.mjs
  modified:
    - src/components/hero/heroScene.ts
    - scripts/hero-harness.mjs

key-decisions:
  - "Moved GPU resource construction (programs/meshes/node-layer) into an inner buildScene() function so createHeroScene() can wrap it in a single try/catch that calls releaseContext(gl) and rethrows unchanged on any failure"
  - "Typed buildScene()'s gl parameter as ogl's own exported OGLRenderingContext (not a hand-rolled WebGLRenderingContext | WebGL2RenderingContext union) to satisfy ogl's Program/Mesh/Geometry constructor signatures under strict mode"
  - "Negative control performed manually during Task 2 verification (assertProgramLinked calls temporarily commented out, confirmed --break-shader gradient then reports HERO_UNEXPECTED_SUCCESS and exits non-zero, then restored) to prove the --break-shader check is a real regression guard, not a tautology"

patterns-established:
  - "When a plan must prove a negative (a protection that doesn't yet exist would let this fail), perform a manual negative-control run during execution and record the result in the Summary rather than only trusting the positive-path test"

requirements-completed: [HERO-03, HERO-06]

# Metrics
duration: 22min
completed: 2026-10-12
---

# Phase 2 Plan 06: Shader Link-Failure Fail-Invisible Guard Summary

**createHeroScene() now throws `"hero {gradient|points|lines} program failed to link"` and releases the WebGL context on any shader compile/link failure, closing VERIFICATION.md gap 2 (ogl itself only `console.warn`s and never throws) with both fake-gl unit tests and a real headless-Chrome `--break-shader` regression check.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-10-12T19:25:25-05:00
- **Completed:** 2026-10-12T19:47:19-05:00
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `src/components/hero/glGuards.ts`: a pure, import-free module exporting `assertProgramLinked()` (throws a fixed `"hero {name} program failed to link"` message when `gl.getProgramParameter(program, gl.LINK_STATUS)` is falsy or the program handle itself is null) and `releaseContext()` (calls `WEBGL_lose_context.loseContext()`, swallowing its own errors so cleanup never masks the original failure).
- `src/components/hero/heroScene.ts`: GPU resource construction moved into an inner `buildScene()` called from `createHeroScene()` inside a try/catch. `assertProgramLinked(gl, ...)` now runs immediately after each of the three `new Program(...)` calls (gradient, points, lines); any throw triggers `releaseContext(gl)` before the original error is rethrown unchanged, so `useHeroRenderer`'s existing catch runs and the pre-rendered still stays visible instead of an opaque black canvas.
- `scripts/hero-gl-guards.test.mjs`: 6 `node:test` cases over fake gl objects covering link failure, null-program short-circuit (getProgramParameter never called), success, and all three `releaseContext` branches (available, unavailable, throwing).
- `scripts/hero-harness.mjs --break-shader gradient|points|lines`: serves a synthesized `/hero/shaders` module that re-exports the real `shaders.ts` (now also served unbroken at the hardcoded `/hero-real/shaders` path) while shadowing just the targeted shader export with invalid GLSL. A failure-mode entry script wraps `HTMLCanvasElement.prototype.getContext` before dynamically importing `heroScene`, then asserts `createHeroScene()` throws the expected message and the captured context reports `isContextLost() === true`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add glGuards helpers, wire link assertions and context release into createHeroScene, and unit-test them** - `2002eca` (fix)
2. **Task 2: Add a harness --break-shader mode proving real scene creation throws and releases the context in headless Chrome** - `1a46c7e` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `src/components/hero/glGuards.ts` - `assertProgramLinked()` and `releaseContext()`, pure/import-free helpers
- `src/components/hero/heroScene.ts` - GPU construction extracted into `buildScene()`, wrapped in try/catch with the three `assertProgramLinked(gl` calls and the `releaseContext(gl)` cleanup path
- `scripts/hero-gl-guards.test.mjs` - 6 node:test cases for the two glGuards helpers
- `scripts/hero-harness.mjs` - `--break-shader gradient|points|lines` mode: shader-shadowing server routes, failure-mode entry script, `runBreakShaderCheck()`, and a shared `chromeBaseFlags()` helper (minor refactor of `renderOnce`'s inline flags array, reused by the new check)

## Decisions Made
- Used ogl's own exported `OGLRenderingContext` type for `buildScene()`'s `gl` parameter instead of a hand-written `WebGLRenderingContext | WebGL2RenderingContext` union — the latter fails `tsc --noEmit` because ogl's `Program`/`Mesh`/`Geometry` constructors require the richer `OGLRenderingContext` shape (`renderer`/`canvas` properties attached). No scope change, just the correct existing type.
- Factored `renderOnce`'s inline Chrome flags array into a shared `chromeBaseFlags(w, h)` helper so `runBreakShaderCheck()` reuses the exact same flags rather than a second copy that could drift.

## Deviations from Plan

None beyond the type-fix above (which is not really a deviation — the plan's own interface notes specified "do NOT change" the `HeroScene`/`HeroSceneOptions` contract, and this was an internal-only parameter type correction needed to satisfy `tsc --noEmit`, one of the plan's own acceptance criteria).

## Issues Encountered
- Initial `buildScene()` draft typed `gl` as `WebGLRenderingContext | WebGL2RenderingContext`, which fails `tsc --noEmit` against ogl's stricter `OGLRenderingContext` type used throughout `Program`/`Mesh`/`Geometry`. Fixed by importing and using `OGLRenderingContext` from `"ogl"` (already resolvable since the file already imports `ogl` as a value); verified `npx tsc --noEmit` is clean afterward.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

- VERIFICATION.md gap 2 (shader-failure fail-invisible contract) and REVIEW.md WR-01/WR-02 are closed: `npm test` (53/53 passing, up from 47), `npx tsc --noEmit` (clean), `npm run lint` (0 errors, same 3 pre-existing unrelated `goals/page.tsx` warnings), and `npm run build` (static export succeeds) all pass.
- `node scripts/hero-harness.mjs --break-shader gradient|points|lines` all report `{"breakShader":"<name>","ok":true,...}` and exit 0 in real headless Chrome; `--break-shader bogus` exits non-zero; `--check` (the existing D-01 palette/contrast budget) still passes unaffected.
- Negative control executed and verified: with the three `assertProgramLinked(gl` lines temporarily commented out, `--break-shader gradient` correctly reports `HERO_UNEXPECTED_SUCCESS` and exits non-zero, proving the check is a real regression guard. `heroScene.ts` was restored immediately after (`git diff --stat` empty against the Task 1 commit before Task 2 was committed).
- VERIFICATION.md gap 1 (still/live first-frame mismatch, REVIEW WR-04) is explicitly out of scope for this plan and remains open — tracked separately as gap-closure plan 02-07 per `.planning/phases/02-webgl-hero/02-VERIFICATION.md`.

---
*Phase: 02-webgl-hero*
*Completed: 2026-10-12*

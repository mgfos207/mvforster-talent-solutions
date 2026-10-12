---
phase: 02-webgl-hero
plan: 02
subsystem: ui
tags: [webgl, ogl, particles, node-network, still-image, d-03, d-04, d-05]

# Dependency graph
requires:
  - phase: 02-webgl-hero
    plan: 01
    provides: "createHeroScene() stable public contract (resize/setPointer/render/destroy/canvas/gl), heroConfig.ts tuning constants, shaders.ts gradient shader, scripts/hero-harness.mjs reusable render harness"
provides:
  - "src/components/hero/nodeNetwork.ts: pure, unit-tested node simulation + GPU buffer builder (createRng, nodeCountForWidth, createNodes, stepNodes, allocateBuffers, buildNetworkBuffers)"
  - "Node network (lines + points ogl Meshes) rendered inside heroScene.ts, driven by the pure simulation each frame"
  - "createHeroScene()'s additive, optional `layers?: 'all' | 'gradient'` field — the only sanctioned contract change, dev-harness-only (T-02-07)"
  - "hero-harness.mjs: --layers, --diff-against (subtlety check), and --still <desktop|mobile|all> modes"
  - "public/hero/hero-still-desktop.webp + hero-still-mobile.webp: pre-rendered D-05 fallback assets from the real scene"
affects: [02-03-react-lifecycle-and-wiring, 02-04-hero-copy-and-layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure simulation module (nodeNetwork.ts) with zero runtime imports, matching heroConfig.ts/shaders.ts — callers build param objects from HERO_* constants and pass them in, so the module stays loadable by both Node's --experimental-strip-types and the browser harness"
    - "CPU-side per-vertex alpha computation (buildNetworkBuffers) uploaded as a dynamic ogl Geometry attribute each frame — no second render target or shader-side proximity math (RESEARCH.md Open Question 2, resolved)"
    - "ogl render-group draw ordering: opaque (gradient, default renderOrder 0) always renders before the transparent+depthTest:false 'ui' group (lines renderOrder 1, points renderOrder 2), independent of scene-graph insertion order"
    - "Headless-Chrome harness extended with --diff-against (pixel-count diff between two PNGs) and --still (render + ffmpeg libwebp encode with a quality/scale fallback ladder) — both reuse the existing type-stripped dev server from 02-01"

key-files:
  created:
    - src/components/hero/nodeNetwork.ts
    - scripts/hero-network.test.mjs
    - public/hero/hero-still-desktop.webp
    - public/hero/hero-still-mobile.webp
    - .planning/phases/02-webgl-hero/artifacts/hero-1920x1080-gradient.png
    - .planning/phases/02-webgl-hero/artifacts/hero-780x1688-gradient.png
    - .planning/phases/02-webgl-hero/artifacts/hero-still-desktop.png
    - .planning/phases/02-webgl-hero/artifacts/hero-still-mobile.png
  modified:
    - src/components/hero/heroScene.ts
    - src/components/hero/shaders.ts
    - scripts/hero-harness.mjs
    - .planning/phases/02-webgl-hero/artifacts/hero-1920x1080.png
    - .planning/phases/02-webgl-hero/artifacts/hero-780x1688.png

key-decisions:
  - "Scaled the drift vector by 1/sqrt(2) (DRIFT_NORMALIZER) rather than using the plan's literal cos/sin formula unscaled — the literal two-independent-frequency formula can reach magnitude sqrt(2)*driftAmplitude, which would violate the plan's own 'stays within driftAmplitude of home' idle-wander contract; the scaled version provably never exceeds driftAmplitude (triangle-inequality argument) while keeping the same organic two-frequency drift shape"
  - "Node-network attraction target is recomputed fresh from (home + drift) every frame, not accumulated from the node's previous position — this matches the plan's literal description and avoids a potential runaway positive-feedback loop where the pointer pull would compound frame over frame"
  - "No heroConfig.ts tuning changes were needed — the existing D-03/D-04 constants (node counts, alpha, link distance, attraction, ease rate) passed the harness's --diff-against subtlety check and the D-01 contrast checks on the first attempt at both desktop and mobile sizes"
  - "Regenerated and committed the 02-01 spike evidence PNGs (hero-1920x1080.png, hero-780x1688.png) in place, since they're overwritten by the Task 2 verify command's default-output full-scene render; the --out-redirected gradient-only baselines and the --still intermediate PNGs were additionally committed to artifacts/ for the same render-evidence convention 02-01 established"

requirements-completed: [HERO-02, HERO-03]

# Metrics
duration: ~2h18m
completed: 2026-10-12
---

# Phase 2 Plan 2: Node Network + Pre-Rendered Stills Summary

**Added a deterministic, pointer-reactive "connecting people" node network (48/36/22 nodes by breakpoint) as a second and third ogl mesh layered over the 02-01 gradient, then used the extended harness to bake two sub-8KB WebP stills of the real shader+network for the D-05 LCP-safe fallback.**

## Performance

- **Duration:** ~2h18m (86953bc -> cb31c9b)
- **Started:** 2026-10-12T12:25:32-05:00 (approx., base commit)
- **Completed:** 2026-10-12T14:43:24-05:00
- **Tasks:** 3/3 completed
- **Files modified:** 13 (8 created, 5 modified)

## Accomplishments

- `nodeNetwork.ts` implements the full Task 1 contract as a pure module (zero runtime imports, no browser globals): mulberry32 RNG, jittered-grid node placement (16:9-ish cols x rows, Fisher-Yates-shuffled cell selection, each home clamped to `[0.04, 0.96]`), drift + pointer-attraction physics in `stepNodes`, and `buildNetworkBuffers` for direct GPU upload (clip-space points/lines + per-vertex alpha, pointer-proximity line highlighting)
- `scripts/hero-network.test.mjs` adds 11 `node:test` cases covering every `<behavior>` bullet in the plan: RNG determinism, breakpoint node-count mapping, deterministic t=0 first frame, idle-drift bound, pointer attraction/falloff/unaffected-outside-radius, ease-back after pointer removal, link-distance cutoff, pointer line-highlighting, and finite/bounded buffer output — all 33 project tests (capabilities, hero-config, hero-network) pass
- `heroScene.ts` gained two new ogl `Mesh`es (`gl.LINES`, `gl.POINTS`) built from dynamic `Geometry` attributes backed by buffers preallocated once at `HERO_NODE_COUNT_DESKTOP` (no per-frame allocation, T-02-05 mitigation); `render()` now calls `stepNodes` + `buildNetworkBuffers` each frame and marks the attributes `needsUpdate`; the public contract gained exactly one additive optional field, `layers?: "all" | "gradient"`, confirmed unchanged otherwise by the acceptance-criteria grep checks
- `shaders.ts` gained four new GLSL ES 1.00 shader exports (`nodePointVertexShader`/`nodePointFragmentShader`/`nodeLineVertexShader`/`nodeLineFragmentShader`): soft round dots via `gl_PointCoord` + `smoothstep` discard, on-brand white color at CPU-computed per-vertex alpha
- `hero-harness.mjs` extended with `--layers`, `--diff-against` (pixel-count diff between two PNGs, >8-per-channel threshold), and `--still <desktop|mobile|all>` (render + D-01 contrast check + ffmpeg libwebp encode with a quality-then-scale fallback ladder + RIFF/WEBP magic-byte verification) — both desktop (1920x1080, diffPixels=595) and mobile (780x1688, diffPixels=929) passed `--check --diff-against` on the first attempt, confirming the network is visible-but-subtle (>200 px changed, <5% of the frame) per D-03
- `public/hero/hero-still-desktop.webp` (7,560 bytes) and `hero-still-mobile.webp` (4,624 bytes) generated at quality 72 on the first attempt — both roughly 8x under the 61,440-byte (D-05) budget, with no quality-stepping or dimension-scaling fallback needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure node-network simulation module with unit tests** - `2862257` (feat, tdd="true" — RED/GREEN authored together per plan's single-task action list, consistent with 02-01's precedent)
2. **Task 2: Render the node network in heroScene and verify with the harness** - `868370d` (feat)
3. **Task 3: Produce the pre-rendered WebP stills from the real scene (D-05)** - `cb31c9b` (feat)

## Files Created/Modified

- `src/components/hero/nodeNetwork.ts` - Pure module: RNG, node placement, drift/attraction physics, GPU buffer builder
- `scripts/hero-network.test.mjs` - 11 `node:test` cases covering the full `<behavior>` spec
- `src/components/hero/heroScene.ts` - Two new ogl Meshes (lines, points) wired into the existing render loop; additive `layers` option
- `src/components/hero/shaders.ts` - Four new GLSL shader exports for the node/line layers
- `scripts/hero-harness.mjs` - `--layers`, `--diff-against`, `--still` harness modes
- `public/hero/hero-still-desktop.webp`, `public/hero/hero-still-mobile.webp` - D-05 pre-rendered fallback stills
- `.planning/phases/02-webgl-hero/artifacts/hero-1920x1080.png`, `hero-780x1688.png` - 02-01 spike-evidence PNGs, regenerated to show the full gradient+network render
- `.planning/phases/02-webgl-hero/artifacts/hero-1920x1080-gradient.png`, `hero-780x1688-gradient.png` - gradient-only diff baselines used by the Task 2 `--diff-against` subtlety check
- `.planning/phases/02-webgl-hero/artifacts/hero-still-desktop.png`, `hero-still-mobile.png` - uncompressed intermediate renders captured before the WebP encode pass

## Decisions Made

- Scaled the idle-drift vector by `1/sqrt(2)` rather than implementing the plan's literal unscaled `(cos(a), sin(b))` formula verbatim — the unscaled version can reach a magnitude of `sqrt(2) * driftAmplitude` (when both terms approach 1 simultaneously), which would violate the plan's own behavior contract ("stays within driftAmplitude of home"). The scaled version provably stays within `driftAmplitude` by a triangle-inequality induction argument, while preserving the same two-different-frequency organic drift character the plan intended (Rule 1 — auto-fixed a latent bug in the plan's example formula before it shipped).
- Built the pointer-attraction target fresh from `(home + drift(t))` every call rather than from the node's previous eased position, matching the plan's literal wording and avoiding a potential compounding positive-feedback loop that an accumulate-from-previous-target design would risk.
- Left `heroConfig.ts` untouched — the existing D-03/D-04 tuning constants from 02-01 already satisfied the Task 2 `--diff-against` subtlety bounds and the D-01 contrast checks at both required sizes, so no "Claude's Discretion" tuning edits were needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scaled the drift-vector formula to guarantee its own stated distance bound**
- **Found during:** Task 1 (writing `scripts/hero-network.test.mjs` behavior tests before implementing)
- **Issue:** The plan's literal drift formula, `driftAmplitude * (cos(phase + t*speed), sin(phase*1.3 + t*speed*0.8))`, has independent cosine/sine terms whose combined magnitude can reach `sqrt(2) * driftAmplitude` — exceeding the plan's own required behavior ("stepNodes with pointer null ... keeps every node within driftAmplitude + 1e-6 of its home").
- **Fix:** Scaled both terms by `Math.SQRT1_2` (`1/sqrt(2)`) so the worst-case magnitude is exactly `driftAmplitude`, verified via a triangle-inequality argument (each step is a convex combination of two vectors already bounded by `driftAmplitude` relative to home, so the bound holds by induction for all t). The visual drift shape (two different frequencies on x/y) is unchanged — only the overall amplitude envelope was corrected.
- **Files modified:** `src/components/hero/nodeNetwork.ts`
- **Commit:** `2862257`

No other deviations — Tasks 2 and 3 executed as written, with both harness `--check` runs and the still-generation budget passing on the first attempt.

## Issues Encountered

- `node --experimental-strip-types` prints a `MODULE_TYPELESS_PACKAGE_JSON` warning when `hero-harness.mjs` imports `heroConfig.ts` directly (Task 3's `--still` mode) because `package.json` has no `"type": "module"` field. This is harmless and does not affect output — the plan's acceptance criteria explicitly requires `git diff --stat package.json` to be empty, so the warning was left as-is rather than "fixed" by touching `package.json`.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `createHeroScene()`'s public contract is unchanged except for the additive `layers` field; 02-03 (React lifecycle wiring) can consume `resize`/`setPointer`/`render`/`destroy`/`canvas`/`gl` exactly as before.
- `public/hero/hero-still-desktop.webp` and `hero-still-mobile.webp` are ready for 02-04 to reference as the server-rendered poster/fallback (D-05); regenerate either with `npm run hero:render -- --still all` if the shader or node tuning changes later.
- The node network's pointer-interaction entry point is `scene.setPointer(xCssPx, yCssPx)` (already part of the 02-01 contract) — 02-03 only needs to wire real DOM pointer/touch events to it; D-04's "no `preventDefault()` on touch" requirement is 02-03's responsibility, not re-litigated here.
- No blockers.

## Self-Check: PASSED

All 8 created files verified present on disk; all 3 task commits (`2862257`, `868370d`, `cb31c9b`) verified present in `git log --oneline --all`.

---
*Phase: 02-webgl-hero*
*Completed: 2026-10-12*

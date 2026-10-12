---
phase: 02-webgl-hero
reviewed: 2026-10-12T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - package.json
  - scripts/hero-config.test.mjs
  - scripts/hero-harness.mjs
  - scripts/hero-loop.test.mjs
  - scripts/hero-network.test.mjs
  - scripts/hero-smoke.mjs
  - src/app/globals.css
  - src/app/layout.tsx
  - src/components/hero/HeroCanvas.tsx
  - src/components/hero/HeroCanvasLoader.tsx
  - src/components/hero/PauseButton.tsx
  - src/components/hero/heroConfig.ts
  - src/components/hero/heroScene.ts
  - src/components/hero/nodeNetwork.ts
  - src/components/hero/renderLoop.ts
  - src/components/hero/shaders.ts
  - src/components/hero/useHeroRenderer.ts
  - src/components/sections/Expertise.tsx
  - src/components/sections/Hero.tsx
  - src/components/sections/Services.tsx
findings:
  critical: 0
  warning: 5
  info: 9
  total: 14
status: issues_found
---

# Phase 2: Code Review Report

**Reviewed:** 2026-10-12
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

I reviewed the WebGL hero stack: the ogl scene, the node network, the render-loop helpers, the React lifecycle hook, the loader and pause control, the hero section, and the Node test, harness, and smoke scripts. I also read the ogl 1.0.11 sources (`Program.js`, `Renderer.js`, `Geometry.js`) and `useCapabilitySignals.ts` to check how they behave at the boundaries.

The lifecycle work holds up. Every listener and observer is removed on unmount. The rAF loop is gated on in-view, tab-visible, paused, and context-lost. The canvas is client-only through `dynamic(..., { ssr: false })`. Reduced motion unmounts the subtree through `canAnimateHero`. A resize while paused redraws the frozen frame.

I found no security or data-loss issues. The defects are in the fail-invisible contract, the still-to-live crossfade, frame pacing, and a smoke script with side effects:

- If a shader fails to compile or link, the scene does not throw. An opaque black canvas then fades in over the still, along with a live pause button.
- The mobile still is rendered on a different node and link scale than the live mobile canvas. The "still == first live frame" guarantee therefore fails on phones and on any viewport that is not 16:9.
- The 30fps cap on narrow screens uses a strict `<` on vsync-aligned timestamps, so actual pacing wobbles between 30 and 20 fps.
- `hero-smoke.mjs` rewrites `src/app/globals.css` and runs `npm run build` as a side effect of a "test".

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Shader compile/link failure is not detected, so an opaque black canvas replaces the still

**File:** `src/components/hero/heroScene.ts:92-118`, `src/components/hero/heroScene.ts:155-175`, `src/components/hero/useHeroRenderer.ts:93-111`
**Issue:** The only fail-invisible path in `useHeroRenderer` is the `try/catch` around `createHeroScene`. ogl's `Program` constructor never throws when a shader fails: compile errors only `console.warn` (`ogl/src/core/Program.js:69,78`), and link failure does `return console.warn(...)` (`Program.js:84-85`). The scene is then created "successfully". `scene.render(0, 0)` clears to the default clear color, and because the canvas uses `alpha: false`, it is opaque black. `setReady(true)` follows, the container fades to `opacity-100` over the still in 800ms, and the pause button mounts. A driver-specific GLSL failure, for example in the 3D simplex noise on some mobile GPUs, therefore swaps the polished still for a flat black hero. That breaks the CLAUDE.md requirement that the page still look polished when WebGL fails.
**Fix:** Validate each program after construction and throw so the existing catch path runs:
```ts
function assertLinked(gl: WebGLRenderingContext | WebGL2RenderingContext, p: Program, name: string) {
  if (!p.program || !gl.getProgramParameter(p.program, gl.LINK_STATUS)) {
    throw new Error(`hero ${name} program failed to link`);
  }
}
// after each `new Program(...)`:
assertLinked(gl, program, "gradient");
assertLinked(gl, pointProgram, "points");
assertLinked(gl, lineProgram, "lines");
```
Combine this with WR-02 so that a throw also releases the context.

### WR-02: A throw partway through `createHeroScene` leaks the WebGL context

**File:** `src/components/hero/heroScene.ts:92-195`, `src/components/hero/useHeroRenderer.ts:93-111`
**Issue:** The `Renderer`, and with it a live GL context, is created first. If anything later throws, the context is never released and the hook's catch block only sets `contextLost`. Examples include the WR-01 assertion and the `TypeError` from `gl.shaderSource(null, ...)` when the context is lost during creation, which is common when the browser is near its context limit. Browsers cap live contexts at about 16, and Phase 1 already probes one, so a leaked context makes later context creation evict others.
**Fix:** Wrap the body of `createHeroScene` after `new Renderer(...)` in a try/catch that calls `renderer.gl?.getExtension("WEBGL_lose_context")?.loseContext()` before rethrowing.

### WR-03: The narrow-viewport 30fps cap drops to about 20fps intermittently because of a strict comparison on vsync timestamps

**File:** `src/components/hero/useHeroRenderer.ts:277-281`
**Issue:** `if (intervalMs > 0 && rawDeltaMs < intervalMs)` skips a frame unless at least 33.333ms have passed. On 60Hz, two vsync ticks are about 33.33ms apart, and rAF timestamp jitter puts that delta on either side of `1000/30` at random. When it lands at 33.30ms, the frame is skipped and the next render happens at 50ms. Pacing then alternates irregularly between 30 and 20 fps, which reads as stutter, and 90Hz and 120Hz panels hit the same edge. `lastTimestampRef = timestamp` also discards the remainder, so the error accumulates instead of self-correcting.
**Fix:** Allow a tolerance and carry the remainder forward:
```ts
const TOLERANCE_MS = 2;
if (intervalMs > 0 && rawDeltaMs < intervalMs - TOLERANCE_MS) { /* skip */ }
lastTimestampRef.current = intervalMs > 0
  ? timestamp - (rawDeltaMs % intervalMs)
  : timestamp;
```
Keep `rawDeltaMs` itself for `advanceClock`.

### WR-04: The pre-rendered stills do not match the live first frame, so the crossfade shows a visible pop (mobile always, desktop at any non-16:9 size)

**File:** `scripts/hero-harness.mjs:400-406` (with `buildEntryJs` at 102-110), `src/components/hero/heroConfig.ts:69-76`, `src/components/sections/Hero.tsx:16-34`
**Issue:** `heroConfig.ts:36-38` and the hook (`useHeroRenderer.ts:116-118`) promise that the still equals the first live frame (D-05/D-06). This only holds when the live canvas is exactly 1920x1080 CSS px:
1. **Mobile:** the still is rendered at `dpr: 1`, `resize(780, 1688)`. `nodeCountForWidth(780)` returns the tablet tier (36 nodes, since 780 ≥ 768), but the `<picture>` only serves it below 768px, where the live canvas uses 22 nodes. `HERO_LINK_DISTANCE_PX` (170) and `HERO_POINT_SIZE_PX` are also measured against a 780px space in the still but a roughly 390px space live. The node layout, the link set, and the dot size all differ.
2. **Desktop at a non-16:9 aspect ratio** (for example 1440x900): the still is `object-cover`, so it is scaled and cropped, while live node coordinates are normalized to the full container. Nodes shift by up to about 80px horizontally at 16:10. Link membership also changes, because the 170px threshold is applied to different pixel distances.

The result is a visible jump in nodes and lines during the 800ms crossfade on most real devices.
**Fix:** Render the mobile still at its CSS size and scale it up for density. Pass `dpr: 2` and `resize(390, 844)` so the node tier, link distance, and point size match the live mobile path. For desktop, either accept and document that the guarantee only holds at 16:9, or have the live canvas start at a cover-fit projection that matches the still. Then add a harness or smoke assertion that compares the still with a live t=0 frame at a common non-16:9 size.

### WR-05: `hero-smoke.mjs` rewrites a source file and rebuilds as a test side effect, and its multi-width check can be impossible to satisfy

**File:** `scripts/hero-smoke.mjs:384-396`, `scripts/hero-smoke.mjs:413-449`
**Issue:** When the measured header height differs from the CSS value, the smoke test writes `src/app/globals.css` and spawns `npm run build`, with no timeout, while the server is still serving `out/`. A verification script that silently changes tracked source is a hazard: running it in CI or a pre-push hook leaves a dirty tree, or commits drift. The logic has two more problems:
- The mismatch condition requires `Math.round(h) === cssValue` at **both** 1440px and 390px. If the header renders at different heights at those widths, which is likely once Phase 3 adds a CTA to the header, no single value satisfies both. The script then rewrites the CSS, rebuilds, and always fails, leaving the modified file behind.
- The comment-replacement regex only matches the original `73px is the fixed Header height` text. After the first rewrite the comment and the value can drift apart.
**Fix:** Make the smoke test read-only. Fail with the measured values and a suggested CSS value, and leave the edit to a human or a dedicated `--fix` flag. Compare against `max(measurements)` (scroll-margin only has to clear the tallest header), and allow a ±1px tolerance.

## Info

### IN-01: DPR is captured once at mount and never recomputed

**File:** `src/components/hero/useHeroRenderer.ts:94-103`, `src/components/hero/heroScene.ts:162`
**Issue:** `clampDpr` runs with the width at mount. If the visitor resizes across the 768px breakpoint, or moves the window to a monitor with a different `devicePixelRatio`, the canvas keeps the old DPR and stays at the old cap. Narrowing keeps DPR at 2 on mobile widths, which defeats the perf clamp; widening keeps 1.5, which is blurry. `uPointSize` is also fixed at the old DPR.
**Fix:** In the ResizeObserver callback, recompute `clampDpr`, set `renderer.dpr`, and update `uPointSize` before `resize()`. Optionally also listen to `matchMedia(\`(resolution: ${dpr}dppx)\`)` changes.

### IN-02: Context-loss state reaches the scene and the callbacks late

**File:** `src/components/hero/useHeroRenderer.ts:48-68`, `src/components/hero/useHeroRenderer.ts:124-133`, `src/components/hero/heroScene.ts:217-218,246-249`
**Issue:** `contextLostRef` is mirrored through a passive `useEffect`, so the ResizeObserver can still call `render()` on a lost context during that window. The scene's internal `contextLost` flag only means "destroyed" and is never set on a real loss. At unmount, `destroy()` therefore calls `loseContext()` on an already-lost context, which raises GL `INVALID_OPERATION` (harmless but noisy).
**Fix:** Set `contextLostRef.current = true` synchronously inside `onContextLost`, and give the scene a `markLost()` method (or have it listen to `webglcontextlost` itself) so its `render`/`destroy` guards cover real losses.

### IN-03: The pointer position goes stale on scroll and across a pause

**File:** `src/components/hero/useHeroRenderer.ts:176-188`, `src/components/hero/useHeroRenderer.ts:209-212`
**Issue:** The pointer is only updated on `pointermove`. A wheel scroll without moving the mouse leaves the attraction point at old container coordinates. `updatePointerFromPoint` also returns early while paused, so after resuming, nodes are pulled toward wherever the cursor was before the pause until the next move.
**Fix:** Clear the pointer (`setPointer(null, null)`) on `scroll` (passive) and when pausing.

### IN-04: `uTime` grows without bound, so the gradient steps on mediump-only GPUs

**File:** `src/components/hero/useHeroRenderer.ts:282-288`, `src/components/hero/shaders.ts:137`
**Issue:** The fragment shader falls back to `mediump` (fp16 on some mobile GPUs). After about 17 minutes, `uTime` exceeds 1024 and fp16 resolution becomes coarser than about 1s, so the gradient advances in visible steps. The gradient is exactly periodic in `uCycle`.
**Fix:** In `heroScene.render`, pass `timeSeconds % HERO_CYCLE_SECONDS` to `uTime`. Keep the unwrapped time for `stepNodes`.

### IN-05: The gradient shader divides by `uResolution.y` with no guard

**File:** `src/components/hero/shaders.ts:131`, `src/components/hero/heroScene.ts:202`
**Issue:** If the container measures 0px high at mount (the first `resize` uses `getBoundingClientRect`), `aspect` is `inf/NaN` and the t=0 frame is garbage until the ResizeObserver corrects it. The `hidden` class applied on context loss also produces a 0x0 resize.
**Fix:** In the shader, use `max(uResolution.y, 1.0)`. Or skip `resize`/`render` when width or height is 0.

### IN-06: Still paths and dimensions are duplicated between `heroConfig.ts` and `Hero.tsx`

**File:** `src/components/sections/Hero.tsx:19,27-30`, `src/components/hero/heroConfig.ts:69-76`
**Issue:** `Hero.tsx` hardcodes `/hero/hero-still-*.webp` and `1920x1080`. If the harness falls back to the 85%-scale tier (`hero-harness.mjs:362-365`) or the sizes change, these values drift silently.
**Fix:** Derive `src`, `width`, and `height` from `HERO_STILL_SIZES` and `HERO_STILL_PATHS`, or a public-path variant of them.

### IN-07: The harness does not validate its CLI input

**File:** `scripts/hero-harness.mjs:60-62`, `scripts/hero-harness.mjs:440-446`
**Issue:** `--width/--height/--time` are passed through `Number()` without checks. `NaN` flows into `--window-size` and `scene.render(NaN, 0)`, producing confusing failures. `HERO_STILL_SIZES[v]` accepts prototype keys such as `--still constructor`. The script is dev-only, so the impact is low.
**Fix:** Reject non-finite or non-positive numbers, and use `Object.hasOwn(HERO_STILL_SIZES, v)`.

### IN-08: `engines` allows Node versions that cannot run the new scripts

**File:** `package.json:5-7,13-14`
**Issue:** `npm test` needs `--experimental-strip-types` (Node ≥22.6), and `hero:render` imports `stripTypeScriptTypes` from `node:module` (Node ≥22.13). `"node": ">=22"` permits 22.0–22.12.
**Fix:** Set `"engines": { "node": ">=22.13" }`, and pin `.nvmrc` to match.

### IN-09: Only the two new anchors get `scroll-margin-top`, and the comment misdescribes the value

**File:** `src/app/globals.css:39-46`
**Issue:** The header links `/#services`, `/#expertise`, and `/#contact` still land under the fixed header. The comment says "73px is the fixed Header height ... plus the UI-SPEC 16px buffer", but the buffer is the separate `+ 1rem`.
**Fix:** Apply the rule to `section[id]` as well (or to `:target`), and reword the comment to "73px header height; +1rem buffer".

---

_Reviewed: 2026-10-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

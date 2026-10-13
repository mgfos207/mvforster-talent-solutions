---
phase: 02-webgl-hero
reviewed: 2026-10-12T00:00:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - scripts/hero-config.test.mjs
  - scripts/hero-gl-guards.test.mjs
  - scripts/hero-harness.mjs
  - scripts/hero-loop.test.mjs
  - scripts/hero-network.test.mjs
  - scripts/hero-smoke.mjs
  - scripts/hero-stills.test.mjs
  - src/app/globals.css
  - src/app/layout.tsx
  - src/components/hero/HeroCanvas.tsx
  - src/components/hero/HeroCanvasLoader.tsx
  - src/components/hero/PauseButton.tsx
  - src/components/hero/glGuards.ts
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
  warning: 4
  info: 12
  total: 16
status: issues_found
---

# Phase 2: Code Review Report (re-review after 02-06 / 02-07)

**Reviewed:** 2026-10-12
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

This is a re-review after gap-closure plans 02-06 (shader link-failure guard and context release) and 02-07 (tier-matched stills). I re-read every listed file, including the new `glGuards.ts`, `hero-gl-guards.test.mjs`, and `hero-stills.test.mjs`, and checked ogl's `Geometry.js` draw-range handling.

**02-06 is correct.** `buildScene()` runs inside a try/catch. Each of the three programs is checked with `assertProgramLinked`, and `releaseContext` frees the context before the error is rethrown. The guard also covers a context lost during construction: `getProgramParameter` returns `null`, so the assertion throws and the still stays visible. The `--break-shader` harness mode proves this in real Chrome, so WR-01 and WR-02 are closed.

**02-07 fixed the case it targeted.** The mobile still is now rendered at 390x844@2 on the 22-node tier, and `Hero.tsx` takes its media queries, sources, and dimensions from `heroConfig`. Two weak spots remain, though:

- **Scrollbars and fractional widths:** the `<picture>` media queries measure the viewport including the scrollbar, but the live tier comes from the container width, which excludes it. On desktop browsers with classic scrollbars, the still and the live canvas pick different tiers in a band of about 15px above each breakpoint. Non-integer widths between 767 and 768px match neither media query.
- **Wrong aspect for the tablet still:** the tablet still is portrait (820x1180), but it is served to every 768–1023px viewport, including landscape phones and narrow desktop windows. There `object-cover` crops away most of it. The "bounded shift" in the heroConfig comment is therefore not small in those cases.

WR-03 (30fps pacing) and WR-05 (the smoke script rewrites source) were not addressed. Most earlier Info items are also still open.

### Prior findings status

| ID | Title | Status |
|----|-------|--------|
| WR-01 | Shader compile/link failure not detected | **Resolved** (`heroScene.ts:124,163,174`, `glGuards.ts:28-36`, harness `--break-shader`) |
| WR-02 | Throw mid-construction leaks the WebGL context | **Resolved** (`heroScene.ts:219-225`, `glGuards.ts:43-50`) |
| WR-03 | 30fps cap wobbles to 20fps | **Open** (`useHeroRenderer.ts:277-281` unchanged), re-filed as WR-03 |
| WR-04 | Still does not match the live first frame | **Partially resolved**: integer-width tier parity is fixed; the remaining gaps are filed as new WR-01 and WR-02 |
| WR-05 | Smoke test rewrites `globals.css` and rebuilds | **Open** (`hero-smoke.mjs:384-450` unchanged), re-filed as WR-04 |
| IN-01 | DPR captured once at mount | **Open**, IN-01 |
| IN-02 | Context-loss state reaches callbacks late; `destroy()` on a lost context | **Open**, IN-02 |
| IN-03 | Pointer goes stale on scroll and across pause | **Open**, IN-03 |
| IN-04 | `uTime` grows without bound | **Open**, IN-04 |
| IN-05 | Unguarded divide by `uResolution.y` | **Open**, IN-05 |
| IN-06 | Still paths and dimensions duplicated in `Hero.tsx` | **Resolved** (`Hero.tsx:2-6,26-49`, drift guard in `hero-stills.test.mjs:95-104`); a related residual is filed as IN-09 |
| IN-07 | Harness CLI input not validated | **Partially resolved**: `--still` now uses `Object.hasOwn`, but `--width/--height/--time` are still unchecked; IN-06 |
| IN-08 | `engines` allows Node versions that cannot run the scripts | **Open** (`package.json` still `"node": ">=22"`; the file is outside this review's list, so this was checked rather than re-reviewed), IN-07 |
| IN-09 | `scroll-margin-top` only on two anchors; misleading comment | **Open**, IN-08 |

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The still and the live canvas pick different node tiers near each breakpoint (scrollbar width and fractional widths)

**File:** `src/components/hero/heroConfig.ts:134-137`, `src/components/sections/Hero.tsx:27-36`, `src/components/hero/useHeroRenderer.ts:88-91,156-159`, `src/components/hero/heroScene.ts:246`
**Issue:** The two layers measure width differently.
- The still is chosen by `<source media="(max-width: 767px)">` and `(min-width: 768px) and (max-width: 1023px)`. Media queries measure the viewport **including** the vertical scrollbar.
- The live tier comes from `nodeCountForWidth(width)`, where `width` is the container's `getBoundingClientRect().width` or `ResizeObserver` `contentRect.width`. The hero is full-bleed, so this is the viewport **minus** the scrollbar.

On Windows and Linux desktop browsers with classic scrollbars (about 15–17px), this causes two kinds of mismatch:
1. **Viewport about 1024–1040px:** the desktop still (48 nodes) is shown, but the canvas renders the tablet tier (36 nodes). The whole node layout pops during the 800ms crossfade, which is the exact WR-04 symptom 02-07 was meant to remove.
2. **Viewport about 768–784px:** the tablet still is shown, but the canvas runs the mobile tier (22 nodes). The narrow DPR clamp and the 30fps cap also apply.

Separately, with fractional CSS widths (Windows display scaling, browser zoom, `767 < width < 768`), neither `max-width: 767px` nor `min-width: 768px` matches. The browser then falls back to the **desktop** 1920x1080 still on a mobile-tier canvas.

`hero-stills.test.mjs:69-77` only checks that integer ranges tile, and the harness runs with `--hide-scrollbars`. Neither can catch this.
**Fix:** Pick the live tier with the same media queries the `<picture>` uses, so the two cannot disagree. Use range syntax so there is no fractional gap:
```ts
// heroConfig.ts
export const HERO_STILL_MEDIA = {
  mobile: `(width < ${HERO_NARROW_BREAKPOINT_PX}px)`,
  tablet: `(${HERO_NARROW_BREAKPOINT_PX}px <= width < ${HERO_TABLET_BREAKPOINT_PX}px)`,
} as const;

// useHeroRenderer.ts — derive the tier width from the viewport, not the container
const tierWidth = window.matchMedia(HERO_STILL_MEDIA.mobile).matches
  ? 0
  : window.matchMedia(HERO_STILL_MEDIA.tablet).matches
    ? HERO_NARROW_BREAKPOINT_PX
    : HERO_TABLET_BREAKPOINT_PX;
```
Then pass `tierWidth` to the scene as a separate `resize(w, h, tierWidthPx)` argument, used only for `nodeCountForWidth`, `clampDpr`, and `frameIntervalFor`. Update the stills test to assert the range-syntax strings.

### WR-02: The tablet still is portrait but is served to landscape viewports, so the "bounded shift" claim does not hold

**File:** `src/components/hero/heroConfig.ts:76-83,99-109`, `src/components/sections/Hero.tsx:32-47`
**Issue:** The tablet variant is rendered at 820x1180 (aspect about 0.69) and served to every viewport 768–1023px wide. That range also covers:
- landscape phones (iPhone Pro Max 932x430, Pixel 915x412)
- iPad mini or Air in landscape split view
- narrow desktop windows such as 1000x700

With `object-cover`, a 0.69-aspect image in a container of about 2.1 aspect keeps only about 33% of its height (the middle band), magnified about 1.2x. The live canvas spreads the same 36 nodes over the whole container. Almost every node and link moves during the crossfade, often by hundreds of pixels; the shift is not "bounded" in any useful sense. The mobile still (aspect 0.46) has the same problem on any wide-but-short sub-768px window.

The heroConfig comment calls this an accepted limitation with a "bounded amount" of shift. That is only true for aspect ratios near each reference size, and no test or harness check measures the bound.
**Fix:** Do one of the following:
- Add an orientation axis to the art direction. For example, add a `tablet-landscape` variant at 1000x600@1 with media `(768px <= width < 1024px) and (orientation: landscape)`, and do the same for mobile.
- Or render each tier's still at a square or landscape reference so that `object-cover` crops less on the off-axis.

Also add a `--verify-stills` case at a non-reference aspect inside each tier, with a looser threshold, so the bound is actually measured. At minimum, correct the comment so it does not claim a small bound.

### WR-03 (carried, still open): The narrow-viewport 30fps cap drops to about 20fps intermittently

**File:** `src/components/hero/useHeroRenderer.ts:277-281`
**Issue:** This code is unchanged from the prior review. `rawDeltaMs < intervalMs` with `intervalMs = 33.333` skips a frame whenever two 60Hz vsync ticks measure 33.30ms apart because of timestamp jitter. The next render then lands at 50ms, so mobile pacing alternates irregularly between 30 and 20fps. Setting `lastTimestampRef.current = timestamp` throws away the remainder, so the error never self-corrects.
**Fix:**
```ts
const FRAME_TOLERANCE_MS = 2;
if (intervalMs > 0 && rawDeltaMs < intervalMs - FRAME_TOLERANCE_MS) {
  rafIdRef.current = requestAnimationFrame(frame);
  return;
}
lastTimestampRef.current =
  intervalMs > 0 ? timestamp - (rawDeltaMs % intervalMs) : timestamp;
```
Keep passing `rawDeltaMs` to `advanceClock`.

### WR-04 (carried, still open): `hero-smoke.mjs` rewrites tracked source and rebuilds as a test side effect, and the multi-width check can be impossible to satisfy

**File:** `scripts/hero-smoke.mjs:384-396,413-450`
**Issue:** This code is unchanged. When the measured header height does not equal the CSS value, the smoke test does three things:
1. It runs `writeFileSync(src/app/globals.css)`.
2. It spawns `npm run build` with no timeout, while its own server is still serving the `out/` that the build is replacing.
3. It re-measures.

There are several problems with this:
- **Unsatisfiable check:** the mismatch test requires `Math.round(h) === cssValue` at **both** 1440px and 390px. If the header height differs between those widths, which becomes likely once Phase 3 adds a header CTA, no single value can pass. The script then always fails and leaves a modified `globals.css` behind.
- **Comment drift:** the comment-replacement regex (line 392) only matches the original "73px is the fixed Header height" text, so after one rewrite the comment and the value drift apart.
- **Dirty tree:** a verification script that edits tracked source is a CI and pre-push hazard.
**Fix:** Make the check read-only, with a ±1px tolerance:
```js
const required = Math.ceil(Math.max(...widths.map((w) => measurements[w])));
if (Math.abs(required - cssValue) > 1) {
  fail(`scroll-margin-top is ${cssValue}px but the tallest header measured ${required}px — update globals.css`);
}
```
If auto-fixing is still wanted, put it behind an explicit `--fix` flag.

## Info

### IN-01 (carried): DPR is captured once at mount and never recomputed

**File:** `src/components/hero/useHeroRenderer.ts:94-103`, `src/components/hero/heroScene.ts:159`
**Issue:** `clampDpr` uses the width at mount. If the window is resized across 768px, or moved to a monitor with a different `devicePixelRatio`, the canvas keeps the old DPR cap. `uPointSize` also stays tied to the old DPR. Note that `frameIntervalFor` already re-reads `widthRef` each frame, so the fps cap does follow a resize, but the DPR does not.
**Fix:** In the ResizeObserver callback, recompute `clampDpr`. If it changed, set `renderer.dpr`, update `uPointSize`, and then call `resize()`. Both setters would need to be exposed on `HeroScene`.

### IN-02 (carried): Context-loss state reaches the callbacks late, and `destroy()` calls `loseContext()` on an already-lost context

**File:** `src/components/hero/useHeroRenderer.ts:57-59,124-133`, `src/components/hero/heroScene.ts:258-291`
**Issue:**
- `contextLostRef` is updated in a passive effect, so the ResizeObserver can still call `render()` on a lost context in between.
- The scene's internal `contextLost` flag only means "destroyed" and is never set on a real loss.
- At unmount after a real loss, `destroy()` calls `loseContext()` again, which raises GL `INVALID_OPERATION`. This is harmless but noisy.
**Fix:** Set `contextLostRef.current = true` synchronously in `onContextLost`. Also check `gl.isContextLost()` in `render()` and `destroy()`, or add a `markLost()` method.

### IN-03 (carried): The pointer position goes stale on scroll and across a pause

**File:** `src/components/hero/useHeroRenderer.ts:176-188,209`
**Issue:** The pointer only updates on `pointermove`. A wheel scroll leaves the attraction point at old container coordinates. While paused, `updatePointerFromPoint` returns early, so on resume the nodes are pulled toward the pre-pause cursor position.
**Fix:** Call `setPointer(null, null)` on a passive `scroll` listener and when `paused` becomes true.

### IN-04 (carried): `uTime` grows without bound, so the gradient steps on mediump-only GPUs

**File:** `src/components/hero/heroScene.ts:260`, `src/components/hero/shaders.ts:137`
**Issue:** The fragment shader falls back to `mediump` (fp16 on some mobile GPUs). After about 17 minutes, `uTime / uCycle` loses enough precision that the gradient advances in visible steps.
**Fix:** `program.uniforms.uTime.value = timeSeconds % HERO_CYCLE_SECONDS;` The gradient is exactly periodic in `uCycle`. Keep the unwrapped time for `stepNodes`.

### IN-05 (carried): The gradient shader divides by `uResolution.y` with no guard

**File:** `src/components/hero/shaders.ts:131`, `src/components/hero/heroScene.ts:238-243`
**Issue:** A container that is 0px high at mount, or the 0x0 ResizeObserver callback after `hidden` is applied on context loss, gives `aspect = inf/NaN`.
**Fix:** In the shader, use `uResolution.x / max(uResolution.y, 1.0)`. Or return early from `resize()` and `render()` when `width` or `height` is 0.

### IN-06 (carried, partial): Harness `--width/--height/--time` are not validated

**File:** `scripts/hero-harness.mjs:77-79,141-142`
**Issue:** `Number("abc")` gives `NaN`. That value goes into `--window-size=NaN,NaN` and is interpolated into the generated `scene.render(NaN, 0)`, which causes confusing downstream failures. 02-07 fixed only the `--still` lookup.
**Fix:** `if (![width, height].every((n) => Number.isFinite(n) && n > 0) || !Number.isFinite(time)) { console.error(...); process.exit(1); }`

### IN-07 (carried): `engines` allows Node versions that cannot run the test and harness scripts

**File:** `package.json:5-7,13-14` (outside this review's file list; checked only)
**Issue:** `--experimental-strip-types` requires Node ≥22.6, and `stripTypeScriptTypes` (`hero-harness.mjs:32`) requires Node ≥22.13. `"node": ">=22"` still permits 22.0–22.12.
**Fix:** Set `"engines": { "node": ">=22.13" }`, and pin `.nvmrc` to match.

### IN-08 (carried): Only `#employers`/`#candidates` get `scroll-margin-top`, and the comment misdescribes the value

**File:** `src/app/globals.css:39-46`
**Issue:** `/#services`, `/#expertise`, and `/#contact` still land under the fixed header. The comment says 73px includes the 16px buffer, but the buffer is the separate `+ 1rem`.
**Fix:** Apply the rule to `section[id], #employers, #candidates`, and change the comment to "73px header height; +1rem buffer".

### IN-09: The 85%-scale WebP fallback silently produces a still whose dimensions disagree with `HERO_STILL_SIZES`

**File:** `scripts/hero-harness.mjs:531-571,628-639,656-659`
**Issue:** If a still exceeds the size budget at quality 40, `encodeStillWebp` re-encodes it at 85% scale and `renderStill` only logs the smaller dimensions. Two things then break:
- `--verify-stills` decodes the committed WebP with the config dimensions (`size.width`/`size.height`) and throws a confusing byte-length mismatch instead of reporting the real cause.
- `Hero.tsx` keeps advertising `width`/`height` from config. Only the aspect ratio matters there, but the test's dimension contract (`hero-stills.test.mjs:60-67`) is no longer true for the shipped asset.
**Fix:** In `renderStill`, fail (or warn loudly and exit non-zero) when `result.width !== size.width`. Alternatively, have `--verify-stills` read the real WebP dimensions with `ffprobe` and upscale before comparing.

### IN-10: `--verify-stills` compares against a live frame at a DPR that production never uses on that tier

**File:** `scripts/hero-harness.mjs:599-608,650-654`, `src/components/hero/heroConfig.ts:93,116`, `src/components/hero/renderLoop.ts:49-58`
**Issue:** The mobile still and its "live" verification frame are both rendered at dpr 2. Production clamps narrow viewports to `HERO_DPR_MAX_NARROW = 1.5`. The desktop still is dpr 1, but retina desktops render live at dpr 2. Point sizes are in CSS px, so they match. `gl.LINES` are always 1 device pixel wide, however, so link thickness differs between the still and the live canvas by 1.33–2x. The verify step passes even though it never exercises the real production configuration.
**Fix:** In `verifyStills`, render the live frame at `clampDpr(size.dpr, size.cssWidth, ...)` and downscale both frames to a common size before comparing. Otherwise, document that the parity guarantee excludes line weight.

### IN-11: Services cards scale on hover regardless of `prefers-reduced-motion`

**File:** `src/components/sections/Services.tsx:9,16`
**Issue:** `transition-all duration-300 hover:scale-105` animates a transform with no reduced-motion guard. CLAUDE.md requires respecting `prefers-reduced-motion`. The `className="text-brand"` on the `<Image>` elements (lines 11, 18) has no effect on an `<img>` SVG.
**Fix:** Use `motion-safe:hover:scale-105 motion-safe:transition-transform`, and drop the no-op `text-brand`.

### IN-12: Site metadata and section copy contradict the healthcare positioning in the new hero

**File:** `src/app/layout.tsx:12-13`, `src/components/sections/Expertise.tsx:8-30,60-75`, `src/components/sections/Services.tsx:13-14`
**Issue:**
- The `<title>` and description ("Technical Recruitment Specialist", "leading technology companies") are what search results and link previews show. They contradict the hero ("healthcare, behavioral health, and healthcare admin teams").
- The "I'm looking for work" chooser (`#candidates`) lands on an "Our Expertise" block that leads with software, cloud, and AI roles.
**Fix:** Update the `metadata` title and description to the healthcare and behavioral-health positioning now. If the section copy is deferred to Phase 3, track it explicitly there.

---

_Reviewed: 2026-10-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

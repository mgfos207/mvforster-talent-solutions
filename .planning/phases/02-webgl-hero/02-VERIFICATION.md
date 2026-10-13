---
phase: 02-webgl-hero
verified: 2026-10-12T00:00:00Z
status: human_needed
score: 43/45 must-haves verified (2 uncertain, developer decision requested)
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 32/34
  gaps_closed:
    - "Hero degrades gracefully on any device incl. shader-level failures: createHeroScene() now throws on gradient/points/lines link failure and releases the context, so the still stays visible (02-06)"
    - "Live t=0 frame vs pre-rendered still on real phones: the mobile still is now rendered at CSS 390x844 @ dpr 2 (22-node mobile tier), plus a new tablet still for 768-1023px, so the node tier matches at every integer viewport width on overlay-scrollbar platforms (02-07)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Decide on REVIEW WR-01 (scrollbar and fractional-width tier mismatch). On a Windows/Linux desktop browser with classic scrollbars, open the home page at a viewport width of about 1024-1040px (for example, a 1280x800 laptop at 125% scaling gives 1024px) and at about 768-784px. Watch the 800ms crossfade from still to canvas."
    expected: "Either the faint node rearrangement (48 nodes in the still vs 36 live, or 36 vs 22) during the crossfade is acceptable, in which case add the WR-01 override below, or it is not, in which case schedule the WR-01 fix (pick the live node tier with the same matchMedia queries the <picture> uses)."
    why_human: "The mismatch is confirmed in code and in headless Chrome. Whether it is perceptible enough to matter is a visual judgment, and accepting a must-have deviation requires developer sign-off."
  - test: "Decide on REVIEW WR-02 (portrait tablet and mobile stills served to landscape viewports). Open the home page on a landscape phone (for example 932x430 or 915x412 in device emulation with touch) and in a narrow desktop window (about 1000x700). Watch the crossfade."
    expected: "Either the shift in gradient composition and node positions during the 800ms crossfade still reads as calm and acceptable, in which case add the WR-02 override below and correct the 'slightly / bounded' wording in heroConfig.ts, or it reads as a visible jump, in which case add a landscape still variant (WR-02 fix)."
    why_human: "object-cover crops a 0.69-aspect still to the middle third in a ~2.1-aspect container, so the shift is large in geometric terms. Whether it is perceptually acceptable under a soft 800ms dissolve of a subtle layer is a visual call. The 02-07 planner pre-accepted off-aspect shifts, but only the developer can accept them."
  - test: "Sanity-check the two new or regenerated stills on real portrait sizes (390x844 phone, 820x1180 tablet). Load the page, then reload with reduced motion on."
    expected: "Same calm navy/teal look as the desktop UAT, a near-imperceptible crossfade on the capable path, and the still alone with no pause button under reduced motion."
    why_human: "The 02-05 UAT covered desktop only. The tablet still is new and the mobile still was regenerated after that UAT. --verify-stills proves pixel parity with the live frame, but not that the result looks right to a person."
---

# Phase 2: WebGL Hero Verification Report

**Phase Goal:** Visitors see a distinctive, calm, cursor-reactive WebGL hero that never blocks first paint, degrades gracefully on any device, and meets accessibility requirements.
**Verified:** 2026-10-12
**Status:** human_needed
**Re-verification:** Yes, after gap closure by plans 02-06 and 02-07

## Summary of Re-verification

Both previous gaps are closed in the code. I checked the source and ran the checks myself instead of relying on the SUMMARYs.

- **Gap 2 (shader failure gives a black canvas): CLOSED.**
  - `heroScene.ts` calls `assertProgramLinked(gl, …)` right after each of the three `new Program(...)` calls (lines 124, 163, 174) and before each program is passed to a `Mesh`.
  - `buildScene()` runs inside a try/catch (lines 219-225) that calls `releaseContext(gl)` and then rethrows.
  - The throw happens before `container.appendChild(scene.canvas)` in `useHeroRenderer.ts`. The hook's catch sets `contextLost`, so `HeroCanvas` has `visible = false` and the `PauseButton` never renders.
  - I ran `--break-shader gradient|points|lines` in real headless Chrome. All three give `HERO_EXPECTED_FAILURE:hero <name> program failed to link:lost=true` with exit 0. `--break-shader bogus` exits 1.
- **Gap 1 (still and live t=0 frame use different node tiers on phones): CLOSED for the reported failure.**
  - The mobile still is now CSS 390x844 @ dpr 2, so `ffprobe` reports 780x1688. That is the 22-node mobile tier.
  - A new tablet still (1640x2360, 36 nodes) covers 768-1023px. Desktop stays at 48 nodes.
  - `Hero.tsx` takes its `<picture>` media queries and image paths from `heroConfig`. A source-text test guards against them drifting.
  - I ran `--verify-stills`. All three variants pass (bigDiffFraction ≤ 1.5e-6). The built-in negative control, the old 780px @ dpr 1 config, fails as expected (5.07e-4 > 5e-5).
- **New review findings (REVIEW WR-01, WR-02): both are real; I confirmed each one myself.** I judge them residual polish limitations, not failures of the phase goal. However, they contradict the literal wording of two 02-07 must-haves, so the developer has to decide (see below). That is why the status is `human_needed`, not `passed`.

## Goal Achievement

### Observable Truths

Rows 1-34 carry over from the initial verification. Rows that passed before got a regression check. The two previously failed rows got the full 3-level check. Rows 35-45 are the must-haves from the 02-06 and 02-07 plans.

| # | Truth (source) | Status | Evidence |
|---|---|---|---|
| 1 | ogl 1.0.11 exact-pinned, only new dependency (02-01) | ✓ VERIFIED | Not touched by 02-06/07: `git diff 1dc6fb0 HEAD -- package.json` is empty |
| 2 | Mesh gradient renders via ogl in headless Chrome, no shader errors (02-01) | ✓ VERIFIED | `--check` exits 0 today |
| 3 | Gradient is navy-dominant and stays within the D-01 contrast/palette budget (02-01) | ✓ VERIFIED | Today's `--check`: meanL 0.0186, textBoxP99L 0.0530, warmFraction 0. Unchanged from the initial run, so the guards caused no regression |
| 4 | 24s periodic cycle (02-01) | ✓ VERIFIED | Unchanged; covered by the 60/60 `npm test` run |
| 5 | Shader colors come from HERO_COLORS, token-parity test (02-01) | ✓ VERIFIED | Unchanged; part of 60/60 |
| 6 | Stable createHeroScene contract (02-01) | ✓ VERIFIED | `HeroSceneOptions`/`HeroScene` types and the returned object shape are unchanged (`heroScene.ts:45-78, 293-300`). Only the internals moved into `buildScene()` |
| 7 | 48/36/22 nodes at the breakpoints (02-02) | ✓ VERIFIED | `nodeCountForWidth` is unchanged (`nodeNetwork.ts:68-72`) |
| 8 | Pointer attraction and line highlight (02-02) | ✓ VERIFIED | Unchanged; network tests pass |
| 9 | Node layout is deterministic from HERO_SEED, so the live t=0 frame matches the still (02-02, previous gap 1) | ✓ VERIFIED (previous gap closed) | The mobile still is now rendered at a mobile-tier width. `--verify-stills` passes for all three variants against a fresh live t=0 frame, and the negative control fails as expected. The desktop still is byte-identical to before (7560 B), which confirms determinism. Remaining edge cases are tracked separately in #39 and #44 |
| 10 | Stills are WebP, ≤ 61440 B, at the correct dimensions (02-02) | ✓ VERIFIED | mobile 5092 B 780x1688, tablet 11740 B 1640x2360, desktop 7560 B 1920x1080. All start with RIFF/WEBP |
| 11 | Nodes stay subtle (02-02) | ✓ VERIFIED | Unchanged node layer; the stills look subtle when viewed (I viewed the tablet and mobile stills directly) |
| 12 | Canvas gated on canAnimateHero, no second WebGL probe (02-03) | ✓ VERIFIED | `HeroCanvasLoader.tsx` not modified since the gap plans |
| 13 | ogl loaded via next/dynamic(ssr:false) (02-03) | ✓ VERIFIED | Smoke test: ogl chunk 19008 B gzipped, not in the initial HTML, not preloaded |
| 14 | Render loop gating (02-03) | ✓ VERIFIED | `renderLoop.ts` and `useHeroRenderer.ts` are unchanged by 02-06/07 |
| 15 | webglcontextlost handling (02-03) | ✓ VERIFIED | Unchanged |
| 16 | 800ms crossfade (02-03) | ✓ VERIFIED | Unchanged |
| 17 | Passive pointer and touch listeners (02-03) | ✓ VERIFIED | Unchanged |
| 18 | Accessible pause button (02-03) | ✓ VERIFIED | Unchanged; the smoke capable run passes |
| 19 | Pause freezes the frame, resume does not jump (02-03) | ✓ VERIFIED | Unchanged |
| 20 | Pause state is not persisted (02-03) | ✓ VERIFIED | Unchanged |
| 21 | First paint shows the still over bg-brand-strong, never blank (02-04) | ✓ VERIFIED | `Hero.tsx:25-50`: `<picture>` with two `<source>`s and the desktop `<img>`, rendered on the server. `out/index.html` contains all three still filenames and both media strings |
| 22 | office-bg.jpg no longer used by the hero (02-04) | ✓ VERIFIED | Not reintroduced |
| 23 | Hero.tsx stays a server component (02-04) | ✓ VERIFIED | No `'use client'`. The only new import is the pure, import-free `heroConfig` |
| 24 | Healthcare copy (02-04) | ✓ VERIFIED | `Hero.tsx:59-66` unchanged |
| 25 | Equal-weight glass chooser pills, no coral (02-04) | ✓ VERIFIED | Unchanged |
| 26 | #employers/#candidates anchors plus existing ids (02-04) | ✓ VERIFIED | Unchanged |
| 27 | Plain anchors, motion-gated smooth scroll, scroll-margin (02-04) | ✓ VERIFIED | Unchanged. Smoke header check 73/73 |
| 28 | Empty CTA slot (02-04) | ✓ VERIFIED | `Hero.tsx:85` |
| 29 | Capable browser mounts canvas and pause button (02-05) | ✓ VERIFIED | `node scripts/hero-smoke.mjs` against a fresh `npm run build`: HERO_SMOKE_OK |
| 30 | Reduced motion shows the still with no canvas (02-05) | ✓ VERIFIED | Same smoke run |
| 31 | Header height matches scroll-margin (02-05) | ✓ VERIFIED | 1440 → 73/73, 390 → 73/73. `git status` clean afterwards (the WR-04 rewrite did not trigger) |
| 32 | ogl lazy chunk ≤ 40KB gzipped (02-05) | ✓ VERIFIED | 19008 B |
| 33 | Human UAT of look and feel (02-05) | ✓ VERIFIED (human, approved earlier) | Approved earlier for desktop. The new tablet still and regenerated mobile still have not had a human look yet (human item 3) |
| 34 | Hero degrades gracefully on any device, including shader failures (phase goal, previous gap 2) | ✓ VERIFIED (previous gap closed) | See #35-36. The throw happens before the canvas is appended, the catch sets `contextLost`, so no canvas and no pause button appear and the still remains |
| 35 | A link failure in any program makes createHeroScene throw; still stays; no canvas or pause button (02-06) | ✓ VERIFIED | 3 `assertProgramLinked(gl` call sites. `--break-shader` passes for gradient, points, and lines. `useHeroRenderer.ts:93-111` catch → `setContextLost(true)` → `HeroCanvas` `visible=false` |
| 36 | Context is released before the rethrow (02-06) | ✓ VERIFIED | `heroScene.ts:222-224`. Harness reports `lost=true` for all three programs. `releaseContext` swallows its own errors so it cannot hide the original one |
| 37 | Capable-GPU rendering unchanged; `--check` passes (02-06) | ✓ VERIFIED | `--check` exit 0, same metrics as before |
| 38 | Regression coverage at unit and browser level (02-06) | ✓ VERIFIED | `hero-gl-guards.test.mjs` has 6 tests inside the 60/60 run, plus the harness `--break-shader` mode, which rejects bad input. The SUMMARY records a negative control; I did not repeat it because it requires editing source |
| 39 | Every still's tier matches the live tier "across that still's whole served media range" (02-07) | ? UNCERTAIN (WARNING) | Holds for every integer viewport width on overlay-scrollbar platforms, which covers all phones, tablets, and default macOS. **Does not hold** in a band about 15px wide above each breakpoint on classic-scrollbar desktop browsers, nor for fractional widths between 767 and 768px (REVIEW WR-01). I confirmed this in headless Chrome: at a 1030px viewport, `innerWidth` is 1030 but the full-bleed container is 1015, so the desktop still is served (48 nodes) while the canvas tier is tablet (36). At 775px, the tablet still is served while the container is 760 (mobile tier, 22). The site sets no `scrollbar-gutter` or overflow rule that would change this. Developer decision needed: see human item 1 |
| 40 | Mobile still is CSS 390x844 @ dpr 2 (02-07) | ✓ VERIFIED | `heroConfig.ts:90-98`; `ffprobe` gives 780,1688 |
| 41 | npm test fails loudly on a tier or dimension mismatch (02-07) | ✓ VERIFIED | `hero-stills.test.mjs:39-104`: tier vs min/max of the range, CSS×dpr dimensions, range tiling against the breakpoint constants, media strings, drift guard. 7/7 pass |
| 42 | `--verify-stills` passes and its negative control fails (02-07) | ✓ VERIFIED | Ran it: mobile 1.52e-6, tablet 1.29e-6, desktop 4.82e-7 all pass. Control 5.07e-4 failed as expected. Exit 0 |
| 43 | Hero.tsx `<picture>` is derived from heroConfig (02-07) | ✓ VERIFIED | `Hero.tsx:2-6, 27-48`; no literal paths or media queries |
| 44 | Off-reference aspect ratios are a documented accepted limitation with only a "slight"/"bounded" shift (02-07) | ? UNCERTAIN (WARNING) | It is documented (`heroConfig.ts:68-87`). But the "slightly / bounded" wording does not hold for landscape viewports, which REVIEW WR-02 confirms from the aspect math. The 820x1180 portrait tablet still is served to 932x430 landscape phones and 1000x700 desktop windows, where `object-cover` keeps only about the middle third. The acceptance was made by the planner, not the developer. Developer decision needed: see human item 2 |
| 45 | Stills ≤ 61440 B, RIFF/WEBP (02-07) | ✓ VERIFIED | See #10 |

**Score:** 43/45 verified, 2 uncertain (WARNING, developer decision requested), 0 failed.

### Materiality Judgment on REVIEW WR-01 / WR-02

I checked whether these residuals undermine the phase goal or the D-05/D-06 must-haves. My conclusion is **no** for the phase goal and **partially** for the D-06 polish wording. Reasons:

1. **No ROADMAP success criterion is affected.** SC 1-5 (gradient plus responsive nodes, a static fallback with no layout shift or blank area, the pause control, the chooser, offscreen and context-loss handling) all hold in every affected case. The still is always a correct, on-palette, contrast-safe image, and the canvas is always a correct live render. Only the 800ms handoff between them is imperfect.
2. **The visual effect is small.** In the built-in negative control, a full tier mismatch (36 vs 22 nodes) changes about 0.05% of pixels (bigDiffFraction 5.07e-4), and the mean per-channel difference does not move (1.34 vs 1.31). Nodes are 3px at alpha 0.35 and lines are at alpha 0.1. The change is a cross-dissolve over 800ms, not an instant swap. That fits "calm".
3. **WR-01 affects a narrow band.** It needs a classic-scrollbar desktop browser with a viewport inside about 15px above 768 or 1024, or a fractional width between 767 and 768. That is uncommon, but a 1280px laptop at 125% scaling lands exactly at 1024, so it is not imaginary.
4. **WR-02 affects a more common case** (landscape phones), and there the gradient composition shifts too, not just the nodes. It is still a soft change from one low-frequency gradient to another, and it falls under a limitation the 02-07 plan deliberately scoped as accepted. The doc comment understates it, though.

These do not justify FAILED / `gaps_found` against the phase goal. They also cannot be marked VERIFIED, because must-haves #39 and #44 are literally untrue in these cases and no override exists. Accepting a deviation needs developer sign-off, so this is escalated as `human_needed` with ready-made overrides. **If the developer declines either override, treat that item as a gap.** The WR-01 fix is small and well defined: derive the tier from the same `matchMedia` queries the `<picture>` uses, and switch to range syntax to remove the fractional gap.

**Suggested overrides (add to frontmatter only if accepted):**

```yaml
overrides:
  - must_have: "Every pre-rendered still is rendered at a CSS width whose node tier matches the tier the live canvas uses across that still's whole served media range"
    reason: "Holds at every integer width on overlay-scrollbar platforms (all phones/tablets). On classic-scrollbar desktops a ~15px band above 768/1024 (and fractional 767-768) serves a still one tier off; the effect is a faint node rearrangement under an 800ms dissolve (~0.05% of pixels). Accepted as residual polish; REVIEW WR-01 fix can be scheduled later."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
  - must_have: "Non-reference aspect ratios within a tier are a documented, accepted limitation"
    reason: "Portrait tablet/mobile stills on landscape viewports shift gradient composition and node positions during the 800ms crossfade by more than 'slightly'. Judged acceptable on device; heroConfig.ts comment to be corrected. REVIEW WR-02 landscape variant deferred."
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/components/hero/glGuards.ts` | Import-free assertProgramLinked/releaseContext | ✓ VERIFIED | 50 lines, no imports, fixed error message, swallowing release |
| `src/components/hero/heroScene.ts` | Link assertions plus release on construction failure | ✓ VERIFIED | 3 assertions; try/catch around `buildScene` |
| `scripts/hero-gl-guards.test.mjs` | 6 fake-gl unit tests | ✓ VERIFIED | 6 `test(` blocks, all pass |
| `scripts/hero-harness.mjs` | `--break-shader`, dpr-aware stills, tier gate, `--verify-stills` | ✓ VERIFIED | Tier gate `:594`, `Object.hasOwn` `:751`, `--force-device-scale-factor` `:320`, control check `:686`. All modes run |
| `src/components/hero/heroConfig.ts` | Extended still contract, SRC, MEDIA | ✓ VERIFIED (with #44 wording caveat) | `:88-137` |
| `scripts/hero-stills.test.mjs` | Tier, range, and drift tests | ✓ VERIFIED | 7/7 pass |
| `public/hero/hero-still-{mobile,tablet,desktop}.webp` | Tier-matched stills within budget | ✓ VERIFIED | Dimensions and sizes above; viewed directly, on palette |
| `src/components/sections/Hero.tsx` | Config-driven `<picture>` | ✓ VERIFIED | Wired; emitted into `out/index.html` |

### Key Link Verification

| From | To | Via | Status |
|---|---|---|---|
| heroScene.ts | glGuards.ts | `assertProgramLinked(gl, …)` ×3, `releaseContext(gl)` | ✓ WIRED |
| heroScene.ts throw | useHeroRenderer.ts catch | try/catch → `setContextLost(true)` → `HeroCanvas` `visible=false` | ✓ WIRED (proven by the throw in the real browser; the hook is unchanged) |
| hero-harness.mjs | nodeNetwork.ts | `nodeCountForWidth` tier gate before render | ✓ WIRED |
| Hero.tsx | heroConfig.ts | `HERO_STILL_SRC/MEDIA/SIZES` import | ✓ WIRED |
| hero-stills.test.mjs | heroConfig + nodeNetwork | tier parity asserts | ✓ WIRED |
| `<picture>` media (viewport) | live tier (container width) | none; they are measured differently | ⚠️ PARTIAL: they diverge by the scrollbar width (#39, WR-01) |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real | Status |
|---|---|---|---|---|
| Hero `<picture>` | still srcs/media | `heroConfig` constants → static HTML | Yes (`out/index.html` contains all three srcs and both media strings) | ✓ FLOWING |
| Hero canvas | node tier | `container.getBoundingClientRect().width` / ResizeObserver → `nodeCountForWidth` | Yes | ✓ FLOWING (see WR-01 for the width-basis divergence) |

### Behavioral Spot-Checks (all run by me in this pass)

| Behavior | Command | Result | Status |
|---|---|---|---|
| Unit tests | `npm test` | 60/60 pass | ✓ PASS |
| Types | `npx tsc --noEmit` | exit 0, no output | ✓ PASS |
| Lint | `npm run lint` | 0 errors, 3 earlier unrelated `<img>` warnings | ✓ PASS |
| Shader-failure guard (real Chrome) | `hero-harness.mjs --break-shader gradient/points/lines` | all `ok:true`, `lost=true`; `bogus` exits 1 | ✓ PASS |
| Still/live parity | `hero-harness.mjs --verify-stills` | 3/3 pass, negative control failed as expected, exit 0 | ✓ PASS |
| D-01 budget | `hero-harness.mjs --check` | exit 0, metrics unchanged | ✓ PASS |
| Static build | `npm run build` | 4 static routes; all three stills and both media queries in `out/index.html` | ✓ PASS |
| Built-site smoke | `node scripts/hero-smoke.mjs` | HERO_SMOKE_OK; `git status` clean afterwards | ✓ PASS |
| WR-01 mechanism | headless Chrome, scrollable page at 1030/775 wide | container 1015/760 vs `innerWidth` 1030/775; media query picks desktop/tablet still | Confirms WR-01 (#39) |

### Probe Execution

Not applicable. There are no `probe-*.sh` scripts. `hero-harness.mjs` and `hero-smoke.mjs` fill that role and were run directly, as listed above.

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
|---|---|---|---|
| HERO-01 | 02-01, 02-04, 02-05 | ✓ SATISFIED | Gradient renders; D-01 check passes; wired into Hero |
| HERO-02 | 02-02, 02-03, 02-05, 02-07 | ✓ SATISFIED | Node network, pointer tests, tier-matched stills |
| HERO-03 | 02-02, 02-04, 02-05, 02-06, 02-07 | ✓ SATISFIED | Reduced-motion smoke; shader-failure path now falls back to the still; three stills, always a non-blank first paint |
| HERO-04 | 02-03, 02-05 | ✓ SATISFIED | Pause button; smoke test |
| HERO-05 | 02-04, 02-05 | ✓ SATISFIED | Chooser anchors |
| HERO-06 | 02-03, 02-05, 02-06 | ✓ SATISFIED | Loop gating, context-loss handling, context release on construction failure |

No orphaned requirements. REQUIREMENTS.md maps exactly HERO-01..06 to Phase 2, and every one is claimed by at least one plan's `requirements:` field.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `useHeroRenderer.ts` / `Hero.tsx` | 88-91, 156-159 / 27-36 | Live tier is chosen from container width; the still is chosen by a viewport media query | ⚠️ WARNING (REVIEW WR-01, #39) | Still/live tier mismatch in a ~15px band on classic-scrollbar desktops and for fractional 767-768px widths |
| `heroConfig.ts` | 68-87 | Comment calls the off-aspect shift "bounded"/"slight" | ⚠️ WARNING (REVIEW WR-02, #44) | Understates the landscape-viewport shift; no test measures it |
| `useHeroRenderer.ts` | 277-281 | 30fps cap wobbles to 20fps | ⚠️ WARNING (REVIEW WR-03, carried) | Pacing polish only; not a goal blocker |
| `scripts/hero-smoke.mjs` | 384-450 | Test can rewrite `globals.css` and rebuild | ⚠️ WARNING (REVIEW WR-04, carried) | Did not trigger today. A latent hazard once Phase 3 changes the header |
| `Services.tsx` | 9, 16 | `hover:scale-105` with no reduced-motion guard | ℹ️ INFO (REVIEW IN-11) | Outside the hero; belongs with Phase 3/4 section work |
| `layout.tsx` | 12-13 | Tech-recruiting metadata | ℹ️ INFO (REVIEW IN-12) | Deferred to Phase 4 in 02-CONTEXT |

No TBD/FIXME/XXX debt markers in any file changed by 02-06/02-07.

### Human Verification Required

1. **WR-01 decision (scrollbar and fractional-width tier band).** On a Windows/Linux classic-scrollbar browser at a viewport about 1024-1040px wide (and about 768-784px), watch the crossfade. Either accept it (add the WR-01 override above) or schedule the small matchMedia-based tier fix.
2. **WR-02 decision (landscape viewports).** On a landscape phone (932x430 or 915x412, touch emulation) and in a 1000x700 desktop window, watch the crossfade. Either accept it (add the WR-02 override above and correct the heroConfig.ts wording) or add a landscape still variant.
3. **First human look at the new stills.** At 390x844 and 820x1180, confirm the calm look and a near-imperceptible crossfade, and confirm that with reduced motion the still shows alone with no pause button. The 02-05 UAT was desktop-only.

### Gaps Summary

There are no blocking gaps. Both earlier blockers are closed in code and proven by checks I ran myself: the shader link guard with context release, and the tier-matched stills with a sensitivity-proven `--verify-stills`. Every earlier truth passed its regression check.

Two 02-07 must-haves (#39, #44) are not literally true for some viewports, as the new code review found and I confirmed independently. I judge them D-06 crossfade-polish limitations of small visual size that do not touch any ROADMAP success criterion. They are escalated for a developer decision rather than marked failed. If either override is declined, the item becomes a gap for `/gsd:plan-phase 2 --gaps`.

---

_Verified: 2026-10-12_
_Verifier: Claude (gsd-verifier)_

---
phase: 02-webgl-hero
verified: 2026-10-12T00:00:00Z
status: gaps_found
score: 32/34 must-haves verified
overrides_applied: 0
gaps:
  - truth: "The node layout is deterministic from HERO_SEED, so the live first frame (t=0) matches the pre-rendered still (D-05/D-06 near-imperceptible crossfade)"
    status: failed
    reason: "The mobile still is rendered by scripts/hero-harness.mjs at dpr:1, resize(780, 1688). nodeCountForWidth(780) resolves to the TABLET tier (36 nodes) because 780 >= HERO_NARROW_BREAKPOINT_PX (768) — independently confirmed by reading nodeNetwork.ts:68-72. But the <picture> only serves hero-still-mobile.webp below 768px CSS width, where the live canvas resolves to the MOBILE tier (22 nodes). Node count, link distances, and point sizes therefore differ between the still and the live first frame on every real phone. Desktop at any non-16:9 size also mismatches because the still is object-cover cropped while live node coordinates are normalized to the full container. This causes a visible node/line pop during the 800ms crossfade, contradicting the 02-02 must-have verbatim. Documented independently in .planning/phases/02-webgl-hero/02-REVIEW.md WR-04; confirmed here by reading nodeNetwork.ts and hero-harness.mjs directly, not by trusting the review."
    artifacts:
      - path: "scripts/hero-harness.mjs"
        issue: "Mobile still rendered at resize(780, 1688) (line ~103, per HERO_STILL_SIZES.mobile) — a CSS width that lands in the tablet node-count tier, not the mobile tier actually served to <768px viewports"
      - path: "src/components/hero/nodeNetwork.ts"
        issue: "nodeCountForWidth() breakpoint math (narrowBreakpointPx=768) places width=780 in the tablet tier while live devices under 768px CSS width get the mobile tier"
    missing:
      - "Render the mobile still at its actual served CSS size (e.g. dpr:2, resize(390, 844)) so node tier/link distance/point size match the live mobile path (REVIEW.md WR-04 fix)"
      - "For desktop, either accept and document that the still/live match only holds at 16:9, or render the still with the same cover-fit projection used live"
      - "Add a harness or smoke assertion that diffs the still against a live t=0 frame at a representative mobile/non-16:9 size so this regresses loudly, not silently"
  - truth: "Hero degrades gracefully on any device (phase goal) and never swaps the polished still for a broken visual when WebGL itself fails (CLAUDE.md: 'If the WebGL or video fails, the page still loads fast, looks polished')"
    status: failed
    reason: "createHeroScene() never checks WebGL program link status after construction. Independently confirmed by reading node_modules/ogl/src/core/Program.js:69-85: ogl's setShaders() only console.warns on a vertex/fragment compile error or a link failure — it never throws. heroScene.ts (lines 104-117, 155-175) constructs three Program instances and never calls gl.getProgramParameter(..., LINK_STATUS) on any of them. useHeroRenderer's only fail-invisible path is the try/catch around createHeroScene() (lines 93-111), which cannot catch a failure ogl itself only logs. If any of the three shaders (gradient, points, lines) fails to compile or link on a given GPU/driver — plausible for the 3D simplex noise construct in shaders.ts on some mobile GPUs — the scene is still returned as 'successful'. render() then clears to an opaque black canvas (the Renderer is created with alpha:false), setReady(true) still fires on schedule, and the canvas crossfades in over the still with a live pause button attached, i.e. the hero silently becomes a flat black box instead of staying on the still. No unit test, harness check, or smoke-test run exercises this path. Documented independently in 02-REVIEW.md WR-01 (0 criticals / 5 warnings); the project's own CLAUDE.md treats this exact failure mode as a hard constraint, which is why it is reported here as failed rather than advisory."
    artifacts:
      - path: "src/components/hero/heroScene.ts"
        issue: "No post-construction link-status check on the gradient/point/line Program instances; a link failure is silently swallowed by ogl and the scene is returned as if it succeeded"
      - path: "src/components/hero/useHeroRenderer.ts"
        issue: "The try/catch around createHeroScene() (lines 93-111) is the only fail-invisible guard and cannot observe an ogl-internal console.warn-only failure"
    missing:
      - "Add an assertLinked() check after each `new Program(...)` in heroScene.ts that throws when gl.getProgramParameter(program, gl.LINK_STATUS) is falsy, so the existing catch path in useHeroRenderer runs and the still stays visible (REVIEW.md WR-01 fix)"
      - "A regression test that forces a shader compile/link error and asserts scene creation throws rather than returning a renderable scene"
human_verification: []
---

# Phase 2: WebGL Hero Verification Report

**Phase Goal:** Visitors see a distinctive, calm, cursor-reactive WebGL hero that never blocks first paint, degrades gracefully on any device, and meets accessibility requirements.
**Verified:** 2026-10-12
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

Human UAT for plan 02-05 (look/feel, crossfade, pointer/touch, pause, chooser, reduced motion, offscreen, context loss) was **already approved by the user in this session** (recorded in `02-05-SUMMARY.md`, commits `f02abf5`/`845d4a9` for the two UAT-driven bottom-fade fixes, `feba91c` for the smoke test). That sign-off is treated as satisfying all human-judgment truths below; it is not re-requested. The two failures below were found independently in code during this verification pass — they were not part of, and would not have been caught by, the UAT checklist as scoped (desktop Chrome, standard window size).

### Observable Truths

| # | Truth (source plan) | Status | Evidence |
|---|---|---|---|
| 1 | ogl 1.0.11 exact-pinned, only new npm dependency (02-01) | ✓ VERIFIED | `package.json:18` and `package-lock.json:12` both show `"ogl": "1.0.11"` with no caret |
| 2 | Mesh-gradient renders via ogl in headless Chrome, no shader errors (02-01) | ✓ VERIFIED | Ran `node scripts/hero-harness.mjs --check` myself: exit 0, produced a real PNG, no shader error output |
| 3 | Gradient navy-dominant, D-01 contrast/palette budget held (02-01) | ✓ VERIFIED | Harness run today: `meanL 0.0186 <= 0.08`, `textBoxP99L 0.053 <= 0.183`, `warmFraction 0 <= 0.05`; visually confirmed navy/teal/scarce-coral in the rendered PNG |
| 4 | One cycle = HERO_CYCLE_SECONDS (24s, in 20-30s band), periodic (02-01) | ✓ VERIFIED | `heroConfig.ts:34` sets `HERO_CYCLE_SECONDS = 24`; `scripts/hero-config.test.mjs` D-02 range assertion is part of the 47/47 passing `npm test` suite I ran |
| 5 | Shader colors come from HERO_COLORS, unit test proves token parity (02-01) | ✓ VERIFIED | `heroConfig.ts` HERO_COLORS hex values match `globals.css` `@theme` tokens exactly (brand `#0B2545`, brandStrong `#071A33`, accent `#0F766E`, cta `#E76F51`); parity test is part of the passing suite |
| 6 | createHeroScene() exposes stable contract (resize/setPointer/render/destroy/canvas/gl) (02-01) | ✓ VERIFIED | Read `heroScene.ts` — exact shape matches the 02-01 interface contract reused unchanged by 02-02/02-03 |
| 7 | Node network: 48/36/22 nodes at the three breakpoints, low-opacity white points, faint lines (02-02) | ✓ VERIFIED | `heroConfig.ts` constants match exactly; `nodeNetwork.ts:68-72` implements the breakpoint logic; visually confirmed in rendered still/PNG |
| 8 | Nodes drift toward pointer within radius, lines brighten, ease back on removal (02-02) | ✓ VERIFIED | `scripts/hero-network.test.mjs` D-04 tests pass (tests 44 "ease back toward home", 46 "line midpoint near pointer gets higher alpha") as part of 47/47 passing; human UAT step 3 approved live pointer behavior |
| 9 | Node layout deterministic from seed so live t=0 matches pre-rendered still (02-02) | ✗ FAILED | See gaps — confirmed via code that mobile still (rendered at width 780) uses the tablet node tier (36) while the live mobile canvas (<768px) uses the mobile tier (22) |
| 10 | Pre-rendered stills exist as WebP, <=61440 bytes, correct dimensions (02-02) | ✓ VERIFIED | `public/hero/hero-still-desktop.webp` = 7560 bytes, `hero-still-mobile.webp` = 4624 bytes, both well under budget; viewed both images directly — navy/teal/subtle-node look confirmed |
| 11 | Nodes stay subtle: >200px but <5% frame diff vs gradient-only, still passes D-01 (02-02) | ✓ VERIFIED | Ran the harness `--diff-against` check myself: `diffPixels: 595` (>200, and 595 << 5% of 2,073,600 = 103,680); gradient-only harness run reused the same D-01 metrics within budget |
| 12 | Canvas mounts only when canAnimateHero is true, unmounts on flip, no second WebGL probe (02-03) | ✓ VERIFIED | `HeroCanvasLoader.tsx` gates on `useCapabilities().canAnimateHero`; `grep` across `src/components/hero/`, `src/providers/`, `src/lib/` finds only one `getContext`-adjacent reference (the type annotation in heroScene.ts) |
| 13 | ogl loaded via next/dynamic(ssr:false) inside a 'use client' file (02-03) | ✓ VERIFIED | `HeroCanvasLoader.tsx:12` is the only `next/dynamic(..., { ssr: false })` call in `src/` (grep confirmed) |
| 14 | Render loop runs only when in-view AND tab-visible AND not paused AND not context-lost (02-03) | ✓ VERIFIED | `renderLoop.ts:17-19` `shouldRun()` implements exactly this AND-combination; wired into the rAF effect in `useHeroRenderer.ts:253` |
| 15 | webglcontextlost: preventDefault, stop loop, hide canvas, remove pause control (02-03) | ✓ VERIFIED | `useHeroRenderer.ts:124-133` `onContextLost` calls `event.preventDefault()`, cancels rAF, sets `contextLost`; `HeroCanvas.tsx` ties both canvas visibility and pause-button rendering to `visible = ready && !contextLost` |
| 16 | Canvas crossfades over HERO_CROSSFADE_MS (800ms), no flash/pop (02-03) | ✓ VERIFIED | `heroConfig.ts` `HERO_CROSSFADE_MS = 800`; `HeroCanvas.tsx` applies it as `transitionDuration`; human UAT step 2 approved live |
| 17 | Mouse/touch attraction via passive listeners, never preventDefault (02-03) | ✓ VERIFIED | `useHeroRenderer.ts:209-220` — all pointer/touch listeners pass `{ passive: true }`; no `preventDefault()` call anywhere in the touch handlers |
| 18 | Pause/play: native button, keyboard-focusable, visible focus ring, >=24x24px, correct aria-labels, only while live (02-03) | ✓ VERIFIED | `PauseButton.tsx` is a `<button>`, `h-10 w-10` (40x40px), `focus-visible:outline-2`, `aria-label` toggles between the two exact required strings; `HeroCanvas.tsx` only renders it when `visible` |
| 19 | Pausing cancels rAF and freezes frame (no crossfade back); resuming has no jump (02-03) | ✓ VERIFIED | `shouldRun()` excludes `paused`; opacity in `HeroCanvas.tsx` is independent of `paused`; `lastTimestampRef` reset on resume (`useHeroRenderer.ts:265`) prevents a delta jump; human UAT step 5 approved live |
| 20 | Pause state lives only in React state, no persistence (02-03) | ✓ VERIFIED | `grep -rn "localStorage\|sessionStorage\|document.cookie"` across hero files returns nothing |
| 21 | Hero's server HTML shows pre-rendered still as first-paint background over bg-brand-strong, never blank (02-04) | ✓ VERIFIED | `Hero.tsx` renders the `<picture>` still unconditionally inside a `bg-brand-strong` section, before the client island |
| 22 | public/office-bg.jpg no longer referenced by hero, file remains in public/ (02-04) | ✓ VERIFIED | `grep -rn "office-bg" src/ public/` finds zero references in `src/`; file still exists at `public/office-bg.jpg` (450KB) |
| 23 | Hero.tsx stays a server component, mounts HeroCanvasLoader (02-04) | ✓ VERIFIED | `Hero.tsx` has no `'use client'` directive and imports/renders `<HeroCanvasLoader />` |
| 24 | Healthcare-focused headline/subline; "technology"/"innovative companies" removed (02-04) | ✓ VERIFIED | `Hero.tsx` copy reads "Great care starts with the right people" / healthcare-admin-focused subline; neither banned phrase appears |
| 25 | Two equal-weight glass pill chooser links, no coral, stack on mobile, visible focus ring (02-04) | ✓ VERIFIED | Shared `chooserLinkClass` uses `border-on-brand/40 bg-on-brand/10` (no coral/teal classes), `flex-col` → `md:flex-row`, `focus-visible:outline-2` |
| 26 | #employers/#candidates resolve inside Services/Expertise; #services/#expertise keep working (02-04) | ✓ VERIFIED | `Services.tsx` has `id="employers"` and `id="services"` sections; `Expertise.tsx` has `id="candidates"` and `id="expertise"`; `Header.tsx` still links `/#services`, `/#expertise`, `/#contact` |
| 27 | Chooser links are plain anchors, work without JS; smooth scroll only under reduced-motion:no-preference; lands below header; no choice stored (02-04) | ✓ VERIFIED | Plain `<a href="#employers">`/`<a href="#candidates">`; `globals.css` gates `scroll-behavior: smooth` inside `@media (prefers-reduced-motion: no-preference)`; `scroll-margin-top: calc(73px + 1rem)` on both ids; no storage calls found |
| 28 | Empty CTA slot (mt-12, min-h-14) reserved, no visible stub (02-04) | ✓ VERIFIED | `<div data-hero-cta-slot className="mt-12 min-h-14" />` — empty, present |
| 29 | Capable browser mounts canvas + pause control after hydration (02-05) | ✓ VERIFIED | Ran `node scripts/hero-smoke.mjs` myself against a fresh `npm run build`: `HERO_SMOKE_OK`, capable run assertions passed |
| 30 | Reduced-motion forced: still+copy but no canvas/pause (02-05) | ✓ VERIFIED | Same smoke run — reduced-motion assertions passed |
| 31 | Header height measured at 1440/390 matches scroll-margin-top CSS value (02-05) | ✓ VERIFIED | Smoke output: `{"width":1440,"headerHeight":73,"cssValue":73}` and `{"width":390,"headerHeight":73,"cssValue":73}` |
| 32 | ogl ships in a lazy chunk, not a `<script>` in initial HTML, <=40KB gzipped (02-05) | ✓ VERIFIED | Smoke output: `{"chunk":"_next/static/chunks/2k64t956-ir_h.js","gzipBytes":18854,"inInitialHtml":false}` — 18.4KB, well under 40KB |
| 33 | Human confirms look/feel, interactions, pause, chooser, reduced motion, context loss (02-05) | ✓ VERIFIED (human, already approved) | `02-05-SUMMARY.md` records the user's "approved" response to all 9 UAT steps; this verification does not re-request it per task instructions |
| 34 | Hero degrades gracefully on any device incl. shader-level failures (phase goal + CLAUDE.md fail-invisible constraint) | ✗ FAILED | See gaps — `createHeroScene()` has no link-status check; a shader compile/link failure produces an opaque black canvas instead of the still, with zero test coverage |

**Score:** 32/34 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/components/hero/heroConfig.ts` | Tuning constants + hexToRgb01 | ✓ VERIFIED | All required exports present, matches globals.css tokens |
| `src/components/hero/shaders.ts` | GLSL source strings | ✓ VERIFIED | Exports present, used by heroScene.ts |
| `src/components/hero/heroScene.ts` | ogl scene factory | ✓ VERIFIED | Contract matches 02-01 interface exactly; wired into useHeroRenderer |
| `src/components/hero/nodeNetwork.ts` | Node simulation + buffers | ✓ VERIFIED | All required exports present, 47/47 unit tests cover it |
| `src/components/hero/renderLoop.ts` | Pure loop gating math | ✓ VERIFIED | shouldRun/advanceClock/frameIntervalFor/clampDpr all present and wired |
| `src/components/hero/useHeroRenderer.ts` | Scene lifecycle hook | ✓ VERIFIED | All observers/listeners wired and cleaned up on unmount |
| `src/components/hero/HeroCanvas.tsx` | Client canvas container | ✓ VERIFIED | Crossfade + pause placement confirmed |
| `src/components/hero/PauseButton.tsx` | Accessible toggle | ✓ VERIFIED | Native button, correct aria-labels, sized correctly |
| `src/components/hero/HeroCanvasLoader.tsx` | Only ssr:false call + gate | ✓ VERIFIED | Confirmed sole next/dynamic(ssr:false) usage in src/ |
| `src/components/sections/Hero.tsx` | Server hero w/ still, copy, chooser, CTA slot | ✓ VERIFIED | Bottom fade correctly absent post-UAT fix |
| `public/hero/hero-still-desktop.webp`, `hero-still-mobile.webp` | LCP-safe fallback stills | ✓ VERIFIED | Both exist, under byte budget, visually correct |
| `scripts/hero-harness.mjs` | Headless-Chrome render harness | ✓ VERIFIED | Ran it directly: palette/contrast and subtlety-diff checks both pass |
| `scripts/hero-smoke.mjs` | Built-site smoke test | ✓ VERIFIED | Ran it directly against a fresh build: HERO_SMOKE_OK |
| `scripts/hero-config.test.mjs`, `hero-network.test.mjs`, `hero-loop.test.mjs` | node:test coverage | ✓ VERIFIED | Part of 47/47 passing `npm test` |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| heroScene.ts | ogl | named imports | ✓ WIRED | `import { Renderer, Program, Mesh, Triangle, Transform, Geometry } from "ogl"` |
| heroScene.ts | heroConfig.ts | HERO_COLORS → hexToRgb01 → uniforms | ✓ WIRED | Confirmed in Program uniform construction |
| HeroCanvasLoader.tsx | CapabilitiesProvider | useCapabilities().canAnimateHero | ✓ WIRED | Gate confirmed, `return null` when false |
| HeroCanvasLoader.tsx | HeroCanvas.tsx | dynamic(ssr:false) | ✓ WIRED | Confirmed |
| useHeroRenderer.ts | heroScene.ts | createHeroScene/destroy lifecycle | ✓ WIRED | Confirmed create on mount, destroy in cleanup |
| useHeroRenderer.ts | webglcontextlost | canvas listener + preventDefault | ✓ WIRED | Confirmed |
| Hero.tsx | HeroCanvasLoader.tsx | import + render | ✓ WIRED | Confirmed |
| Hero.tsx | public/hero/*.webp | `<picture>` source + img | ✓ WIRED | Confirmed |
| Hero chooser links | Services/Expertise ids | href="#employers"/"#candidates" | ✓ WIRED | Confirmed ids present in both target sections |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Unit test suite | `npm test` | 47/47 pass | ✓ PASS |
| Type checking | `npx tsc --noEmit` | no output / exit clean | ✓ PASS |
| Lint | `npm run lint` | 0 errors, 3 pre-existing unrelated warnings (`goals/page.tsx`) | ✓ PASS |
| Static build | `npm run build` | succeeds, 4 static routes generated | ✓ PASS |
| Built-site smoke test | `node scripts/hero-smoke.mjs` | `HERO_SMOKE_OK` | ✓ PASS |
| Render harness D-01 contrast/palette check | `node scripts/hero-harness.mjs --check` | exit 0, meanL/p99/warmFraction all within budget | ✓ PASS |
| Node-network subtlety diff check | `node scripts/hero-harness.mjs --diff-against` | diffPixels 595 (>200, <5% of frame) | ✓ PASS |
| Working tree cleanliness after smoke run | `git status --short` | only pre-existing untracked `.claude/`, `.planning/HANDOFF.json` — no source files dirtied | ✓ PASS |

### Probe Execution

Not applicable — this is a Next.js feature phase, not a migration/tooling phase with declared `probe-*.sh` scripts. `scripts/hero-smoke.mjs` and `scripts/hero-harness.mjs` serve the equivalent role and were executed directly above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| HERO-01 | 02-01, 02-04 | WebGL mesh-gradient background in navy/teal/coral | ✓ SATISFIED | Harness-rendered frame confirmed navy-dominant with teal currents and scarce coral; wired into Hero.tsx |
| HERO-02 | 02-02, 02-03 | Connected-nodes network responds to cursor/touch | ✓ SATISFIED | Node network code + tests + human UAT step 3/4 approval |
| HERO-03 | 02-02, 02-04, 02-05 | Static fallback for non-WebGL/reduced-motion devices, no layout shift/blank | ✓ SATISFIED (capability-gated path); ⚠️ partial — see gap 2 for the shader-failure edge case not covered by this requirement's literal scope but adjacent to it | Smoke test reduced-motion run confirmed still+no-canvas; capability gating confirmed in code |
| HERO-04 | 02-03, 02-05 | Keyboard-accessible pause/resume control | ✓ SATISFIED | PauseButton code + smoke test (capable run asserts aria-label) + human UAT step 5 |
| HERO-05 | 02-04 | Audience chooser jumps to matching section | ✓ SATISFIED | Chooser links + anchor ids confirmed; human UAT step 6 |
| HERO-06 | 02-03, 02-05 | Stops rendering offscreen/hidden tab; recovers from context loss via fallback | ✓ SATISFIED | shouldRun() gating confirmed; webglcontextlost handler confirmed; human UAT steps 8/9 |

No orphaned requirements — all 6 HERO-* IDs declared in REQUIREMENTS.md are claimed by at least one of the 5 plans, and all are marked Complete there (cross-referenced against plan frontmatter `requirements:` fields).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `src/components/hero/heroScene.ts` | 104-117, 155-175 | No post-construction WebGL program link-status check | 🛑 BLOCKER (see gap 2) | Shader link failure silently produces an opaque black hero instead of the still |
| `src/components/hero/nodeNetwork.ts` + `scripts/hero-harness.mjs` | nodeCountForWidth breakpoint math vs. still render width | Still/live first-frame mismatch | 🛑 BLOCKER (see gap 1) | Visible node/line pop during crossfade on real mobile devices |
| `src/components/hero/heroScene.ts` | 92-195 | A throw partway through createHeroScene (e.g. from gap 2's future fix) leaks the live GL context — no cleanup path releases it | ⚠️ WARNING (REVIEW.md WR-02) | Could exhaust the ~16-context browser limit on repeated failures; does not block the current goal but will matter once WR-01 is fixed |
| `src/components/hero/useHeroRenderer.ts` | 277-281 | Strict `<` comparison on vsync-aligned frame timestamps for the 30fps narrow-viewport cap | ⚠️ WARNING (REVIEW.md WR-03) | Pacing wobbles between ~20-30fps on narrow viewports; a polish issue, not a goal blocker |
| `scripts/hero-smoke.mjs` | 384-449 | Script can rewrite `src/app/globals.css` and spawn `npm run build` as a side effect of a "test" if the header-height measurement mismatches | ⚠️ WARNING (REVIEW.md WR-05) | Did not trigger in this run (measured 73/73 matched), but is a latent CI/pre-push hazard if a later phase changes header height |
| `src/components/hero/useHeroRenderer.ts` | 94-103 | DPR captured once at mount, never recomputed on cross-breakpoint resize | ℹ️ INFO (REVIEW.md IN-01) | Minor perf/sharpness edge case, not a goal blocker |

No `TBD`/`FIXME`/`XXX` debt markers found in any Phase 2 file (one false-positive grep hit on a GLSL `.xxx` swizzle in `shaders.ts`, not a debt marker).

### Human Verification Required

None. All human-judgment items (look/feel, crossfade, pointer/touch, pause semantics, chooser scroll, reduced motion, offscreen/hidden-tab, context loss) were already covered by the Task 2 UAT in `02-05-SUMMARY.md` and approved by the user in this session (commits `f02abf5`, `845d4a9` for the two UAT-driven fixes). Per the task brief, this sign-off is accepted as-is and not re-requested.

### Gaps Summary

Two code-level defects were found independently during this verification (both corroborated by, but verified beyond, `02-REVIEW.md`'s WR-01 and WR-04 — I re-derived each from the actual source rather than trusting the review's prose):

1. **Still/live first-frame mismatch (02-02 must-have, guaranteed on every real mobile device).** The pre-rendered mobile still is generated at a CSS width (780px) that lands in the *tablet* node-density tier, while the live mobile canvas — served to the same still via the `max-width: 767px` media query — uses the *mobile* tier. This is not a rare edge case; it reproduces on every phone, every time, and is independently confirmed by reading the exact breakpoint math in `nodeNetwork.ts`. It directly falsifies the literal 02-02 must-have truth that the live first frame matches the still.

2. **Shader-failure fallback has no safety net (phase goal "degrades gracefully on any device" + CLAUDE.md's explicit fail-invisible constraint).** `ogl`'s `Program` class never throws on a compile or link failure — confirmed by reading `node_modules/ogl/src/core/Program.js` directly — it only `console.warn`s. `heroScene.ts` never checks link status itself. The only fail-invisible path in the hook is a try/catch that an ogl-internal warn can never trigger. If this phase's specific shaders (notably the 3D simplex noise gradient) fail to link on some mobile GPU/driver, the result is an opaque black hero with a live (but useless) pause button, not the polished still. This path has zero automated test coverage anywhere in the phase.

Both are real, reproducible, and verified in source — not speculative. Neither is mitigated, deferred to a later phase in ROADMAP.md (checked Phase 3 and Phase 4 success criteria — neither mentions this), nor covered by the human UAT as scoped (standard-size desktop Chrome window, not mobile width, and no deliberate shader-failure injection).

Both failures are scoped and have concrete, already-documented fixes in `02-REVIEW.md` (WR-04 and WR-01 respectively) that do not require re-opening any of the five plans' broader designs — they are targeted bug fixes to `heroScene.ts` / `scripts/hero-harness.mjs`. Recommend a focused gap-closure plan before Phase 3 builds further UI on top of `Hero.tsx`.

If the team judges either defect an acceptable risk to carry forward (e.g., the still/live mismatch is visually minor in practice, or shader-link failures are considered sufficiently rare on target devices), add an `overrides:` entry to this file's frontmatter per `/gsd:plan-phase 2 --gaps` conventions, and re-run verification.

---

_Verified: 2026-10-12_
_Verifier: Claude (gsd-verifier)_

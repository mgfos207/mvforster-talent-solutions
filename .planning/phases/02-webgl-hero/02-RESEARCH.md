# Phase 2: WebGL Hero - Research

**Researched:** 2026-10-11
**Domain:** Client-side WebGL (ogl) mesh-gradient + particle-network background, graceful degradation, Next.js 16 App Router client-boundary patterns
**Confidence:** MEDIUM (stack choice and context-loss/lifecycle mechanics are HIGH confidence; exact `ogl` shader/API field names are MEDIUM — community-sourced, not Context7-verified, which is exactly why CONTEXT.md's research flag calls for a spike before the full render loop)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase Boundary:** Replace the static office-photo hero (`src/components/sections/Hero.tsx`) with a client-side `ogl` WebGL background. The background is a slow mesh-gradient shader in the navy/teal/coral palette with a subtle connected-nodes network that reacts to the cursor or touch. This phase also delivers: a static fallback with no layout shift; a keyboard-accessible pause/play control (WCAG 2.2.2); an "I'm hiring" / "I'm looking for work" audience chooser; offscreen and hidden-tab render pausing; recovery from WebGL context loss. Covers HERO-01..06. The Calendly CTA, the real Employers/Candidates sections, ambient video, and the full visual system belong to Phases 3-4.

**Motion & network feel:**
- **D-01:** Gradient is navy-dominant with teal currents and small warm coral glints. Coral stays scarce (reserved for Phase 3 CTA). White hero text must keep WCAG AA contrast over every part of the gradient.
- **D-02:** Gradient motion is very slow and barely noticeable, ~20-30s per full color cycle. Should read as "alive", never attention-grabbing.
- **D-03:** Connected-nodes network is subtle: ~30-60 small, low-opacity nodes with faint connecting lines on desktop, fewer on mobile/small viewports.
- **D-04:** Pointer interaction uses gentle attraction plus line highlighting. Nearby nodes drift slightly toward cursor, connecting lines brighten. Touch: tap/drag does the same, nodes ease back. Must never block page scroll on mobile (passive listeners, no `preventDefault` on touch).

**Fallback look:**
- **D-05:** Static fallback is a pre-rendered still of the actual shader/network. Compressed WebP/AVIF, ~30-60KB, captured from the real gradient. Is the server-rendered/first-paint/LCP-safe background, and what `canAnimateHero === false` devices keep.
- **D-06:** When WebGL is ready, canvas crossfades in over the still across ~600-1000ms, no flash/pop. On context loss (HERO-06), canvas is removed/hidden and the still shows again.
- **D-07:** Stop using `public/office-bg.jpg` on the hero and remove its import. Leave the file in `public/`. Phase 4 cleanup deletes it if unused.

**Audience chooser (HERO-05):**
- **D-08:** Buttons link to final anchors `#employers`/`#candidates` now. Add `id="employers"` to Services (closest existing section) and `id="candidates"` to Expertise until Phase 3 builds real sections. Phase 3 moves the ids; hero buttons never change. Existing `#services`/`#expertise` ids (used by Header nav) must keep working — use a wrapper or inner element.
- **D-09:** Two equal-weight, side-by-side glass/frosted pill buttons: translucent fill over gradient, high-contrast text, visible focus ring. Stack vertically on mobile. No coral (reserved for Calendly CTA).
- **D-10:** Plain anchor links with smooth scroll only. Work without JS. Scrolling is instant when `prefers-reduced-motion` is on. Account for fixed header height with `scroll-margin-top`. Don't persist audience choice.
- **D-11:** Reserve layout room for the Phase 3 coral "Book an intro chat" CTA next to/under the chooser. Don't build the CTA this phase.

**Hero copy & pause control:**
- **D-12:** Rewrite hero headline/subline for healthcare focus now (healthcare, behavioral health BCBA/RBT, healthcare admin). Calm, warm, human tone. Remove "technology" and "innovative companies". Claude drafts 2-3 headline+subline options for user review in the plan.
- **D-13:** Pause/play control is a small round glass button, bottom-right corner. Pause/play icon, dynamic `aria-label` ("Pause background animation" / "Play background animation"), `aria-pressed` or equivalent, keyboard-focusable with visible focus ring, ≥24x24px target size. Only renders/enabled when animation is actually running.
- **D-14:** Paused means freeze the current frame. Stop the render loop (no rAF, zero GPU work), canvas holds its last frame. Don't crossfade back to the still.
- **D-15:** Pause state doesn't persist — resets on every page load (consistent with Phase 1 D-13, no localStorage motion persistence).

**Carried forward (locked in Phase 1 / project init):**
- `ogl` is the WebGL library. Don't use three.js or R3F (R3F forces React 19; project is on React 18).
- The only gate is `useCapabilities().canAnimateHero` (`src/providers/CapabilitiesProvider.tsx`). Server render/first paint are always static; hero reacts live to verdict changes.
- Use semantic tokens from `src/app/globals.css` `@theme` (`brand` #0B2545, `brand-strong` #071A33, `accent` #0F766E, `cta` #E76F51, `on-brand`). Shader colors must source from/match these values.
- WebGL/ogl JS must not block first paint. Use a lazy client-only boundary (dynamic import). Mobile Lighthouse ≥90, LCP ≤2.5s.

### Claude's Discretion
- Exact shader approach (Whatamesh/Stripe-style mesh gradient adaptation vs custom noise), node count per breakpoint, line distance thresholds, attraction strength and easing.
- Whether nodes are drawn in the same ogl program/pass or a second pass.
- Mobile frame-rate cap / DPR clamp (e.g. clamp devicePixelRatio to ≤1.5-2) for perf.
- How the still image is produced (script that renders the shader headlessly vs a manual capture), plus file format and whether to ship separate mobile and desktop stills.
- Hero height (keep `h-screen` vs `min-h-[90svh]` etc.), as long as there's no CLS.
- Component and file structure (e.g. `HeroBackground` client component + `useHeroRenderer` hook, files under `src/components/hero/`).
- Whether to add a runtime FPS probe that downgrades janky devices to the still. Deferred from Phase 1; revisit only if heuristics let janky devices through during testing.
- Pause icon implementation (inline SVG preferred, no icon library).

### Deferred Ideas (OUT OF SCOPE)
- Site metadata still says "Technical Recruitment Specialist / technology companies" (`src/app/layout.tsx`) — SEO/copy fix for Phase 4, not hero scope.
- Remembering the audience choice to tailor later copy — new capability, not v1.
- Deleting `public/office-bg.jpg` — Phase 4 cleanup, once confirmed unused.
- Runtime FPS probe — deferred (Claude's discretion to add only if testing shows a need).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|---------------------|
| HERO-01 | Visitor sees a slow, flowing WebGL mesh-gradient background in navy/teal/coral | Architecture Pattern 2 (full-screen-triangle fragment shader, not vertex-displaced mesh); Standard Stack (`ogl` 1.0.11); Code Examples (DPR clamp, color uniforms sourced from `@theme` tokens) |
| HERO-02 | Visitor sees a subtle connected-nodes network responding to cursor/touch | Don't Hand-Roll (O(n²) distance loop is sufficient at 30-60 nodes); Open Question 2 (CPU-side per-vertex brightness vs shader-side); Common Pitfall 4 (passive touch listeners, never `preventDefault`) |
| HERO-03 | Device that can't/shouldn't run WebGL sees a static poster/gradient, no layout shift, no blank area | Architecture Pattern 3 (capability gating stays a one-line read of Phase 1's `canAnimateHero`); Common Pitfall 5 (CLS from canvas/poster box mismatch); Common Pitfall 2 (Safari WebP capture gotcha affecting poster quality/size) |
| HERO-04 | Visitor can pause/resume hero motion with a visible, keyboard-accessible control (WCAG 2.2.2) | Code Examples (native `<button aria-pressed>` toggle pattern); Don't Hand-Roll (native button vs custom div); clarified 2.5.8 (24x24 AA) vs 2.5.5 (44x44 AAA) distinction |
| HERO-05 | Visitor can pick "I'm hiring" / "I'm looking for work" and jump to the matching section | Architectural Responsibility Map (anchors are server-rendered, JS-free by design); Code Examples (`prefers-reduced-motion`-gated `scroll-behavior`); Open Question 1 (measuring real header height for `scroll-margin-top`) |
| HERO-06 | Hero stops rendering when scrolled off-screen/tab hidden, recovers from WebGL context loss via fallback | Architecture Pattern 4 (IntersectionObserver + visibilitychange gating); Architecture Pattern 5 (context-loss handling, `preventDefault()` nuance, fail-invisible per D-06); Common Pitfall 3 (restoration path footgun) |
</phase_requirements>

## Summary

This phase replaces a static `<Image>` hero with a client-only `ogl` WebGL canvas: a slow full-screen fragment-shader mesh gradient (navy/teal/coral) plus a sparse point-and-line "node network" that reacts to pointer/touch. Everything must degrade invisibly — a pre-rendered still image is the real first paint, the canvas only crossfades in after `useCapabilities().canAnimateHero` is true, and any runtime failure (context loss) silently reverts to that same still. `ogl` is already locked (Phase 1/init decision); it is a real, long-maintained, zero-dependency WebGL micro-library (created 2018, oframe org on GitHub, 1.0.11 published Jan 2025, ~686K weekly npm downloads, bundled raw as ES modules with no runtime deps) — `npm view`/registry checks and cross-referenced tutorials (Codrops, the open-source `react-bits` component catalog, and `ogl`'s own GitHub examples) agree on its shape, so the *library choice* is HIGH confidence. What is NOT independently verified is the exact mesh-gradient/particle-network *shader code* — no official `ogl` example ships a Stripe-style mesh gradient or a connected-nodes network, so any snippet in this document (or written during planning) is an adaptation, not a copy of a blessed reference. That is precisely why the ROADMAP flags a spike.

The biggest non-shader risk is Next.js App Router plumbing, not WebGL: `next/dynamic(..., { ssr: false })` is **only legal inside a Client Component** (a Server Component that calls it throws a build error) — `Hero.tsx` must stay a server component for its copy/SEO content, and the canvas must be mounted through a separate `'use client'` wrapper file. The second-biggest risk is scope creep in the render loop: the project already has a single source of truth for *whether* to animate (`useCapabilities().canAnimateHero`, Phase 1) — Phase 2 must not reimplement that logic, only add *when-to-pause-even-though-capable* logic (tab hidden, scrolled off-screen, user clicked pause, WebGL context lost).

**Primary recommendation:** Build the gradient as a single full-screen-triangle fragment shader (Plasma/Aurora-style: `uv + uTime + simplex noise → color mix`), not a vertex-displaced mesh (Whatamesh-style) — it's simpler in `ogl`, needs no camera/perspective math, and is cheaper per-pixel. Draw the node network as a second `ogl` `Program` (POINTS + dynamically-rebuilt LINES buffer) in the same render loop, not a separate render pass/render-target. Gate the whole canvas behind a `'use client'` wrapper using `next/dynamic(..., { ssr: false })`, keep `Hero.tsx` itself a server component, and drive visibility with `IntersectionObserver` + `document.visibilitychange` + the existing `canAnimateHero` verdict.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Static export HTML (headline, subline, chooser links, pause button shell) | Frontend Server (SSR, build-time only — static export) | — | `Hero.tsx` stays a server component; all text/links must exist in the static HTML for SEO/LCP and to work with JS disabled (D-10) |
| Poster/fallback image | CDN / Static | Frontend Server (SSR references it) | Pre-rendered WebP/AVIF shipped as a static asset in `public/`, referenced from the server-rendered markup — this is the actual LCP element |
| WebGL mesh gradient + node network rendering | Browser / Client | — | Requires `canvas`, `WebGLRenderingContext`, `requestAnimationFrame` — none of which exist at build/server time under static export |
| Capability gating (`canAnimateHero`) | Browser / Client | — | Already built in Phase 1 (`CapabilitiesProvider`); Phase 2 only *consumes* it, never re-derives it |
| Pause/resume control + state | Browser / Client | — | Must be keyboard-operable and reflect live render-loop state; no server-side concept of "paused" |
| Offscreen/hidden-tab/context-loss pausing | Browser / Client | — | `IntersectionObserver`, `visibilitychange`, and `webglcontextlost` are all browser-only APIs |
| Audience chooser anchors (`#employers`/`#candidates`) | Browser / Client (scroll) | Frontend Server (SSR renders the `<a href>`) | D-10 requires plain anchors that work without JS; smooth-scroll is a client-side CSS/behavior enhancement only |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| `ogl` | `1.0.11` (exact, no caret — pin per Phase 1 supply-chain practice) | Minimal WebGL wrapper (Renderer/Camera/Program/Mesh/Geometry/Transform) for the gradient + node-network canvas | Already locked by CONTEXT.md/STATE.md init decision specifically because it doesn't force React 19 (unlike `@react-three/fiber`); zero runtime dependencies, ~29KB min+gzip across its three chunks (Core/Math/Extras) and tree-shakeable since it ships pure ES modules [CITED: github.com/oframe/ogl README via WebFetch] |

**No other npm packages are needed for this phase.** No noise/simplex library, no particle-system package, no icon package (CONTEXT.md D-13/UI-SPEC: hand-authored inline SVG), no image-compression package (see Environment Availability — no compressor is installed; recommend a zero-install browser-based path instead of adding one).

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | Deliberately none — adding GSAP/motion/Three.js-adjacent helpers here would fight the Phase 2 scope boundary and the perf budget (QUAL-01) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ogl` | `three.js` + `@react-three/fiber` | Explicitly out of scope (REQUIREMENTS.md "Out of Scope": heavy 3D; R3F v9 needs React 19, project is pinned to React 18.2) |
| Hand-authored fragment shader | Adapting `whatamesh` (jordienr) directly | `whatamesh` is a Vue + raw-WebGL vertex-displacement mesh, not `ogl` — porting its approach means re-deriving camera/geometry math for no benefit when a fragment-shader-only approach is simpler in `ogl` and achieves the same "flowing mesh gradient" look (confirmed by `ogl`-based prior art: React Bits' "Aurora"/"Plasma"/"GradientBlinds" backgrounds use exactly this fragment-shader full-screen-triangle technique) |
| Custom node/line WebGL draw | `react-bits` "Particles" background (`ogl`-based, MIT+Commons-Clause, copy-paste via `npx shadcn@latest add ...`) | React Bits' Particles component renders points only, no proximity-based connecting lines — doesn't cover D-04's "line highlighting" requirement, so it's reference material, not a drop-in. Also: do NOT run the `shadcn` CLI to pull it — UI-SPEC already resolved the shadcn gate to "skip" for this phase; treat React Bits only as read-only reference code to adapt by hand, keeping `ogl` as the only new dependency |
| Browser-native still capture | Playwright/Puppeteer automated screenshot script | Neither is installed in this environment (`npx playwright` prompts to download ~hundreds of MB); adding either as a devDependency purely to generate one static image contradicts "smallest bundle" project ethos — manual browser capture is zero-install and this is a one-time asset |

**Installation:**
```bash
npm install ogl@1.0.11
```

**Version verification:** `npm view ogl version` → `1.0.11` [VERIFIED: npm registry], published `2025-01-27` [VERIFIED: npm registry], package created `2018-06-03` [VERIFIED: npm registry], repository `git+https://github.com/oframe/ogl.git` [VERIFIED: npm registry], weekly downloads `685,941` as of 2026-10-11 [VERIFIED: npmjs.org downloads API], `dist.unpackedSize` `423,239` bytes (unminified source tree, not the gzip bundle number) [VERIFIED: npm registry]. No `engines` field (no Node/browser floor declared by the package) [VERIFIED: npm registry]. Zero runtime `dependencies` [VERIFIED: npm registry].

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|--------------|-----------|-------------|
| `ogl` | npm | 8 yrs (created 2018-06-03, latest 1.0.11 on 2025-01-27) | 685,941/wk | github.com/oframe/ogl | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

`slopcheck install ogl` ran clean (`[OK] ogl (npm)`) [VERIFIED: slopcheck tool output]. `npm view ogl scripts.postinstall` returned empty — no postinstall script [VERIFIED: npm registry]. `npm audit` after a real trial install showed 8 high-severity advisories, but every one traces to pre-existing Phase 1 devDependencies (`eslint-config-next` → `fast-glob`/`@next/eslint-plugin-next`, and `brace-expansion` transitive chains) — **none involve `ogl`** [VERIFIED: `npm audit --json` cross-checked for `ogl` key, zero matches]. The trial install was reverted (`git checkout -- package.json package-lock.json && npm ci`) before this research concluded, so the working tree is unaffected.

Note on provenance per this agent's tagging rule: `ogl` was not *discovered* during this research session — it was already a locked project decision (STATE.md "Init: `ogl` for the WebGL hero... smallest bundles that meet the perf budget without forcing React 19"). This research independently re-verified it against the npm registry, the official `oframe/ogl` GitHub repo, and slopcheck, so the package itself carries `[VERIFIED: npm registry + github.com/oframe/ogl]` confidence. The *exact shader/Renderer API shape* used in Code Examples below is lower confidence — see Assumptions Log.

## Architecture Patterns

### System Architecture Diagram

```
Request for "/"
      │
      ▼
┌─────────────────────────────────────────────┐
│ Server render (static export, build time)    │
│  Hero.tsx (server component)                 │
│   ├─ renders: poster <img>/bg (LCP element)  │
│   ├─ renders: headline/subline (text)        │
│   ├─ renders: chooser <a href="#employers">  │
│   │            <a href="#candidates">        │
│   ├─ renders: pause <button> shell (hidden   │
│   │            until JS says canAnimateHero) │
│   └─ mounts:  <HeroCanvasLoader /> (client)  │
└─────────────────────────────────────────────┘
      │  (HTML ships; page is already usable here)
      ▼
┌─────────────────────────────────────────────┐
│ Browser hydration                            │
│  CapabilitiesProvider (Phase 1, already      │
│   mounted in layout.tsx)                     │
│         │  canAnimateHero (bool, live)       │
│         ▼                                    │
│  HeroCanvasLoader ('use client')             │
│   next/dynamic(() => HeroCanvas, {ssr:false})│
│         │  canAnimateHero === false ─────────┼──► nothing renders;
│         │                                    │    poster stays visible forever
│         │  canAnimateHero === true           │
│         ▼                                    │
│  HeroCanvas ('use client')                   │
│   ├─ IntersectionObserver (hero in view?)    │
│   ├─ document.visibilitychange (tab hidden?) │
│   ├─ paused state (user toggle, D-14/15)     │
│   │        │                                 │
│   │        └─ any of the above false/true ──►│ rAF loop runs only when
│   │                                           │ (inView && !tabHidden &&   │
│   │                                           │  !paused && !contextLost) │
│   ▼                                           │
│  ogl Renderer (single WebGL context)         │
│   ├─ Program A: full-screen triangle,        │
│   │   fragment shader (gradient, uTime,      │
│   │   uMouse, brand/accent/cta colors)       │
│   └─ Program B: POINTS + dynamic LINES       │
│       buffer (node network, uMouse proximity)│
│         │                                     │
│         ├─ webglcontextlost  ──► hide canvas, │
│         │                        show poster  │
│         │                        (D-06)       │
│         └─ crossfade in (600-1000ms opacity)  │
│             over the poster on first ready    │
│             frame, poster stays in DOM under  │
│             the canvas the whole time (no CLS)│
└─────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── components/
│   ├── sections/
│   │   └── Hero.tsx              # server component: copy, chooser, poster, pause-button shell
│   └── hero/
│       ├── HeroCanvasLoader.tsx  # 'use client' — the ONLY file allowed to call next/dynamic(ssr:false)
│       ├── HeroCanvas.tsx        # 'use client' — owns the <canvas>, ogl Renderer, rAF loop
│       ├── useHeroRenderer.ts    # hook: IntersectionObserver + visibilitychange + pause state + context-loss handling
│       ├── shaders.ts            # exported template-literal GLSL strings (vertex/fragment) — see pitfall below on why not .glsl files
│       └── PauseButton.tsx       # 'use client' — icon-only toggle, aria-pressed/aria-label
```
This mirrors CONTEXT.md's "Claude's Discretion" note on file structure and keeps the server/client boundary at exactly one file (`HeroCanvasLoader.tsx`), which is also the pattern Next.js's own docs use for isolating `ssr:false` dynamic imports away from Server Components [CITED: community writeups cross-referencing Next.js App Router docs, verified via WebSearch].

### Pattern 1: Client-only dynamic import from a Server Component
**What:** `Hero.tsx` (server component) cannot call `dynamic(..., { ssr: false })` directly — Next.js throws a build error ("ssr: false is not allowed with next/dynamic in Server Components") starting with the App Router's RSC model, still true on Next.js 16. The fix is to push the `dynamic()` call one file down into a `'use client'` wrapper, which the server component then imports and renders normally (a Client Component *reference* is a legal child of a Server Component).
**When to use:** Any time a server component needs a client-only, SSR-skipped child (true here: WebGL has no server-side meaning and must never attempt to construct a canvas during the static export build).
**Example:**
```typescript
// src/components/hero/HeroCanvasLoader.tsx
'use client';
import dynamic from "next/dynamic";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default function HeroCanvasLoader() {
  return <HeroCanvas />;
}
```
```typescript
// src/components/sections/Hero.tsx (still a server component — no 'use client')
import HeroCanvasLoader from "@/components/hero/HeroCanvasLoader";
// ...renders poster, copy, chooser, <HeroCanvasLoader /> absolutely positioned over the poster
```
[CITED: cross-referenced Next.js App Router community guides via WebSearch, consistent across multiple independent sources]

### Pattern 2: Full-screen-triangle fragment-shader gradient (not vertex-displaced mesh)
**What:** Use `ogl`'s `Triangle` geometry (a single triangle that covers the viewport via UV math, no vertex displacement) with a fragment shader that computes color purely from `uv`, `uTime`, and a simplex-noise function. This is the technique used by `ogl`-based community backgrounds (React Bits' "Aurora", "Plasma", "GradientBlinds") rather than Whatamesh's displaced-plane-plus-camera approach.
**When to use:** Any full-bleed animated background where there's no need for 3D perspective — simpler math, fewer GL state objects, cheaper per-frame cost.
**Example:**
```typescript
// src/components/hero/HeroCanvas.tsx (sketch — exact uniform names are a planning-time decision)
import { Renderer, Camera, Transform, Triangle, Program, Mesh } from "ogl";

const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: false, powerPreference: "low-power" });
const gl = renderer.gl;
containerEl.appendChild(gl.canvas);

const geometry = new Triangle(gl);
const program = new Program(gl, {
  vertex: gradientVertexShader,   // passes uv through, no displacement
  fragment: gradientFragmentShader, // noise + color mix using uTime, uMouse, brand colors
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: [0, 0] },
    uBrand: { value: [0x0B / 255, 0x25 / 255, 0x45 / 255] },
    uAccent: { value: [0x0F / 255, 0x76 / 255, 0x6E / 255] },
    uCta: { value: [0xE7 / 255, 0x6F / 255, 0x51 / 255] },
  },
});
const mesh = new Mesh(gl, { geometry, program });

function resize() {
  renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
}
```
[CITED: oframe/ogl GitHub examples (`triangle-screen-shader.html`, `wireframe-shader.html`) via WebFetch — `Renderer`/`Program`/`Mesh`/`Triangle` constructor shapes confirmed; the gradient-specific uniform set is this research's extrapolation, not a verified `ogl` example — spike before committing]

### Pattern 3: Capability gating stays a one-line read, never a re-derivation
**What:** `HeroCanvasLoader`/`HeroCanvas` must call `useCapabilities().canAnimateHero` and nothing else to decide *whether* WebGL is allowed to run at all. All Phase-2-specific pausing (offscreen, hidden tab, user toggle, context loss) is a *second*, independent gate layered on top — never folded back into `src/lib/capabilities.ts` (that file is explicitly "the ONLY place that maps raw signals to feature verdicts" per its own Phase 1 comment).
**When to use:** Always, for this phase — this is a hard architectural boundary from Phase 1, not a style preference.
**Example:**
```typescript
import { useCapabilities } from "@/providers/CapabilitiesProvider";

export default function HeroCanvasLoaderInner() {
  const { canAnimateHero } = useCapabilities();
  if (!canAnimateHero) return null; // poster underneath remains the only visible layer
  return <HeroCanvas />;
}
```

### Pattern 4: IntersectionObserver + visibilitychange gating the render loop
**What:** A render loop that only calls `requestAnimationFrame` when the hero is in the viewport, the tab is visible, and the user hasn't paused it.
**When to use:** Required by HERO-06 ("stops rendering when scrolled off-screen or the tab is hidden").
**Example:**
```typescript
const [inView, setInView] = useState(true);
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
  observer.observe(canvasContainerRef.current!);
  return () => observer.disconnect();
}, []);

const [tabVisible, setTabVisible] = useState(true);
useEffect(() => {
  const onVisibility = () => setTabVisible(document.visibilityState === "visible");
  document.addEventListener("visibilitychange", onVisibility);
  return () => document.removeEventListener("visibilitychange", onVisibility);
}, []);

const shouldRun = inView && tabVisible && !userPaused && !contextLost;
```
[CITED: MDN `IntersectionObserver` and `Document: visibilitychange event` — standard, well-established browser APIs, HIGH confidence]

### Pattern 5: WebGL context loss — fail invisible, don't attempt restoration
**What:** Per D-06, on `webglcontextlost` the canvas is hidden/removed and the poster reappears — there is **no requirement to rebuild GL resources and resume**. Still call `event.preventDefault()` in the lost handler (it's free and keeps the door open for the browser to fire `webglcontextrestored` later), but the simplest, spec-compliant implementation is to treat "lost" as terminal for that page load: flip a `contextLost` boolean to `true`, stop the rAF loop, and let the poster (which was never removed from the DOM — see Pitfall below) show through.
**When to use:** Required by HERO-06.
**Example:**
```typescript
gl.canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault(); // keep restoration possible; we don't act on it this phase
  setContextLost(true); // triggers shouldRun = false and canvas opacity -> 0
});
```
[CITED: MDN `WEBGL_lose_context`, Khronos `WEBGL_lose_context` spec, and multiple cross-referenced "renderer never recovers" GitHub issues confirming `preventDefault()` is the one non-optional step — WebSearch, MEDIUM-HIGH confidence]

### Anti-Patterns to Avoid
- **Building the poster as a layout-affecting element that gets swapped for the canvas:** causes CLS. Always stack the poster and the canvas with `position: absolute; inset: 0` inside a `position: relative` container with a fixed/explicit aspect/height, and crossfade via `opacity`, never via mount/unmount of the poster.
- **Calling `preventDefault()` on touch handlers used for the node-network pointer interaction:** D-04 explicitly forbids this — use `{ passive: true }` listeners for `touchstart`/`touchmove` and only read `touches[0].clientX/Y`, never block scroll.
- **Re-probing WebGL support inside the hero:** Phase 1's `useCapabilitySignals.ts` already probes WebGL once (module-level cache + `WEBGL_lose_context().loseContext()` release) specifically so Phase 2 doesn't exhaust the browser's WebGL context limit (documented threat T-05-02 in 01-05-SUMMARY.md). The hero's own `Renderer` call is the *first real, lasting* context — don't add a second capability-style probe before it.
- **Importing `.glsl`/`.vert`/`.frag` files directly:** Next.js 16 (Turbopack/webpack) has no raw-text loader configured for shader file extensions, and adding one is out of scope for this phase. Export shader source as plain exported `string` template literals from a `.ts` file instead (the pattern every cited `ogl` tutorial actually uses).
- **Treating `ssr: false` as something a Server Component can opt into with a prop or config:** it cannot, in any Next.js 13+ App Router version including 16 — the client-only boundary must be a physically separate `'use client'` file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Device-pixel-ratio-aware canvas sizing | Manual `canvas.width = cssWidth * devicePixelRatio` + context `scale()` bookkeeping | `ogl`'s built-in `Renderer({ dpr })` option, e.g. `dpr: Math.min(window.devicePixelRatio, 2)` | `ogl` already does the canvas-buffer-vs-CSS-size math internally; reimplementing it is the classic retina-canvas blurriness/doubling bug source [CITED: community `ogl` usage examples, MEDIUM confidence] |
| Noise function for the gradient | A hand-derived Perlin/Simplex implementation | The standard public-domain Ashima/Stefan Gustavson `snoise`/`cnoise` GLSL snippet (the same one `whatamesh`, countless Shadertoy gradients, and most "mesh gradient" tutorials reuse) | It's a well-tested, widely-reused ~30-line GLSL function; hand-deriving noise math from scratch is wasted effort and a correctness risk for zero benefit |
| WebGL capability/feature detection | Any new `canvas.getContext('webgl')` probe inside the hero | `useCapabilities().canAnimateHero` (Phase 1) | Single source of truth already exists and is unit-tested (14 cases); duplicating the rule risks the two falling out of sync |
| Pause/play accessible toggle semantics | A custom `<div role="button">` with manual keydown handling | A native `<button>` with `aria-pressed` + dynamic `aria-label`, per the WAI-ARIA toggle-button pattern | Native `<button>` gives free keyboard operability (Enter/Space), focus management, and correct AT semantics; `role="button"` divs require re-implementing all of that by hand |
| Connecting-line distance computation at 30-60 nodes | A spatial-partitioning/quadtree structure | A plain O(n²) nested loop over the node array, recomputed every frame | At n=60, that's 3,540 pairwise checks/frame — trivially cheap on any device that passed the `canAnimateHero` gate; a quadtree is premature optimization for this node count |

**Key insight:** Every "don't hand-roll" item above already has a working implementation sitting one phase (or one well-known public-domain snippet) away. The actual net-new work this phase is narrow: writing the specific gradient+node shader code and the Next.js client-boundary/lifecycle glue around it.

## Common Pitfalls

### Pitfall 1: `ssr: false` thrown from a Server Component
**What goes wrong:** Build fails with "ssr: false is not allowed with next/dynamic in Server Components."
**Why it happens:** `Hero.tsx` is (and must remain) a server component for SEO/first-paint text; it's tempting to call `dynamic(() => import('./HeroCanvas'), { ssr: false })` directly inside it.
**How to avoid:** Isolate the `dynamic()` call inside a dedicated `'use client'` file (`HeroCanvasLoader.tsx`) and import *that* from `Hero.tsx` — see Pattern 1.
**Warning signs:** Build-time error mentioning `ssr: false`/Server Components; or (if a lint rule is added later) `next/no-ssr-false-in-server-component`-style warnings.

### Pitfall 2: Silent Safari WebP fallback when generating the poster still
**What goes wrong:** If the still image is captured via `canvas.toBlob('image/webp', quality)` in Safari, Safari silently returns a PNG instead (no error thrown) — the "WebP" file is actually a much larger PNG, blowing the ~30-60KB budget.
**Why it happens:** Safari has never implemented WebP encoding in `canvas.toBlob`/`OffscreenCanvas.convertToBlob` (through at least Safari 26.5), though it can decode WebP.
**How to avoid:** Capture the still in Chrome or Firefox (both support `image/webp` natively in `toBlob` since Chrome 50/Firefox 96), or — more robustly, independent of which browser is used to produce the source PNG — run the raw capture through [Squoosh](https://squoosh.app) (browser-based WASM encoder, works in any browser, supports both WebP and AVIF) for the final compression pass. Verify by checking the returned `Blob.type` matches what was requested before trusting the output.
**Warning signs:** The "WebP" still is suspiciously large (hundreds of KB instead of 30-60KB), or `file <still>.webp` reports PNG signature bytes.

### Pitfall 3: Context-loss handler without `preventDefault()` burns the restoration path forever
**What goes wrong:** If `event.preventDefault()` is never called inside the `webglcontextlost` listener, the spec treats the context as permanently lost for that canvas — even a later `webglcontextrestored` event cannot fire, so if the device genuinely recovers (common cause: GPU driver reset, dual-GPU laptop switch, OS memory pressure spike), the page is stuck showing the fallback until a full reload.
**Why it happens:** It's easy to write a "just hide the canvas" handler and skip the one-line `preventDefault()` call since D-06 doesn't require restoration.
**How to avoid:** Call `preventDefault()` unconditionally in the lost handler even though this phase doesn't act on `webglcontextrestored` — it costs nothing and keeps the option open for a future phase to add real recovery.
**Warning signs:** None visible in normal testing — this only matters if a device actually recovers from a transient context loss, which is hard to reproduce without `WEBGL_lose_context.restoreContext()` in a manual test.

### Pitfall 4: `preventDefault()` on touch handlers blocks page scroll
**What goes wrong:** If the pointer-interaction code attaches `touchmove`/`touchstart` listeners that call `preventDefault()` (a common copy-paste habit from mouse-based demos), mobile users can no longer scroll past the hero.
**Why it happens:** Many WebGL pointer-interaction tutorials are written mouse-first and port touch handling by literally reusing the mouse code path, including any `preventDefault()` calls meant to stop text selection.
**How to avoid:** Register touch listeners with `{ passive: true }` and never call `preventDefault()` on `touchstart`/`touchmove` for this interaction — D-04 states this explicitly as a hard requirement, not just a nice-to-have.
**Warning signs:** Manual mobile QA: try to scroll from inside the hero; if the page doesn't move, the listener is non-passive or calling `preventDefault()`.

### Pitfall 5: CLS from a canvas that occupies different box dimensions than the poster
**What goes wrong:** If the canvas element isn't absolutely positioned to exactly match the poster's box (e.g., it mounts with a default `300x150` canvas size before the resize/dpr logic runs), the layout shifts the instant the canvas appears, even though visually it should be an invisible crossfade.
**Why it happens:** `<canvas>` elements default to `300×150` CSS pixels until sized by JS; if that sizing happens after mount/paint rather than synchronously with layout, there's a one-frame flash/shift.
**How to avoid:** Give the canvas `position: absolute; inset: 0; width: 100%; height: 100%` in CSS (so its *box* never depends on JS) and let `ogl`'s `dpr`/`renderer.setSize()` calls only affect the internal drawing-buffer resolution, not the CSS box.
**Warning signs:** Lighthouse CLS score regression specifically on hero load, or visible "jump" when toggling canvas visibility in DevTools' Rendering → Layout Shift Regions overlay.

## Code Examples

### Clamping DPR for mobile performance (Claude's Discretion area, but the mechanism is standard)
```typescript
// Source: community ogl usage (cross-referenced across multiple tutorials/gists), MEDIUM confidence
const renderer = new Renderer({
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  alpha: false,
  powerPreference: "low-power",
});
```

### Native accessible pause/play toggle (WCAG 2.2.2 + 2.5.8)
```tsx
// Source: WAI-ARIA Authoring Practices toggle-button pattern, cross-verified via WebSearch, HIGH confidence
<button
  type="button"
  aria-pressed={isPlaying}
  aria-label={isPlaying ? "Pause background animation" : "Play background animation"}
  onClick={() => setIsPlaying((p) => !p)}
  className="h-10 w-10 min-h-6 min-w-6 rounded-full backdrop-blur-sm bg-on-brand/15 border border-on-brand/30 text-on-brand focus-visible:ring-2 focus-visible:ring-on-brand"
>
  {/* inline SVG, swapped by isPlaying — no icon library per UI-SPEC */}
</button>
```
Note: WCAG **2.5.8 Target Size (Minimum)** requires ≥24×24 CSS px (Level AA) — this is the bar D-13 cites. 44×44 is the *AAA* "Enhanced" criterion (2.5.5), not required here; don't over-build the hit target beyond what's needed, though nothing forbids exceeding the minimum for comfort (the ~40px visual size CONTEXT.md/UI-SPEC specify is a comfort choice, not a compliance requirement).

### `prefers-reduced-motion`-gated smooth scroll for the chooser anchors (D-10)
```css
/* Source: standard CSS media-query pattern, HIGH confidence */
html {
  scroll-behavior: smooth;
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
#employers, #candidates {
  scroll-margin-top: <fixed-header-height>; /* measure Header.tsx's actual rendered height */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| `next/dynamic({ ssr: false })` usable anywhere, including pages | Must live inside a `'use client'` boundary | Next.js 13 App Router / RSC introduction, still enforced in Next.js 16.3.8 (this project's pinned version) | Directly dictates this phase's file structure (Pattern 1) |
| Three.js as the default "WebGL in React" choice | `ogl` (and `ogl`-based libraries like `react-bits` backgrounds) as a lighter-weight alternative for simple full-screen-shader effects, specifically because `@react-three/fiber` v9+ requires React 19 | Ongoing ecosystem shift as projects stay on React 18 | Reinforces why the project locked `ogl` over three.js/R3F |

**Deprecated/outdated:** None specific to this phase beyond the above — `ogl` itself has no deprecated API surface flagged in its CHANGELOG as of 1.0.11 [CITED: npm registry version history].

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Exact `ogl` `Renderer`/`Program`/`Mesh` constructor option names (`dpr`, `alpha`, `powerPreference`, `uniforms` shape) match what's shown in Code Examples/Patterns | Standard Stack, Architecture Patterns, Code Examples | Low-medium — these came from `WebFetch` of the official GitHub repo's own examples plus cross-referenced community tutorials (Codrops, gists), not from Context7 or a hands-on spike. If a field name differs slightly, the fix is localized to the shader-setup file; this is exactly the risk the ROADMAP's spike flag exists to retire before the full render loop is built |
| A2 | A fragment-shader-only full-screen-triangle approach (Plasma/Aurora-style) is sufficient to achieve the "flowing mesh gradient" look the user wants, without needing Whatamesh's vertex-displaced-plane technique | Architecture Patterns (Pattern 2) | Medium — if the fragment-only approach looks visually flatter than true mesh warping, the plan may need to budget extra iteration time on the noise function/color-stop count; not a blocker, a visual-quality judgment call |
| A3 | React Bits' MIT+Commons-Clause license permits using its `ogl`-based backgrounds (Aurora/Plasma/Particles) as hand-adapted reference code in this commercial marketing site, without triggering the Commons Clause "Sell" restriction | Alternatives Considered | Low — Commons Clause restricts *selling the software itself* (offering it as a competing product/service); using patterns from it inside your own unrelated business's website is the explicit intended use case (the project ships a CLI specifically so people copy code into their own apps). Still flagged because it's a legal nuance, not independently confirmed with a lawyer |
| A4 | The ~30-60KB WebP/AVIF still-image budget (from CONTEXT.md D-05, not this research) is achievable at a resolution large enough to cover a full-bleed desktop hero without visible upscaling blur | Common Pitfalls (Pitfall 2) | Medium — gradients compress very well (low high-frequency detail), but this wasn't independently measured in this session; the plan should budget a "verify actual file size after capture" checkpoint rather than assuming the number holds at full resolution |
| A5 | No image-compression CLI (`cwebp`, `avifenc`, ImageMagick, `sharp`) is needed as a new devDependency — Squoosh's browser-based encoder is a sufficient zero-install substitute | Common Pitfalls, Environment Availability | Low — Squoosh is a well-known, Google-maintained web tool; worst case, the plan adds `sharp` as a one-time devDependency later if manual capture proves too fiddly |

## Open Questions

1. **Exact fixed-header height for `scroll-margin-top` (D-10)**
   - What we know: `Header.tsx` is `fixed`, uses `py-4` padding around a logo (`h-10`) — visually around 72-80px tall, but not measured precisely.
   - What's unclear: The planner should have the executor measure the rendered height directly (DevTools or a quick `getBoundingClientRect()` check) rather than guessing from Tailwind classes, since `py-4` + `h-10` + border isn't a round number.
   - Recommendation: Add a task step to measure `Header`'s rendered height in the browser and hardcode that value (or a CSS custom property) as `scroll-margin-top`, rather than estimating from utility classes.

2. **Whether the gradient needs a second ogl `RenderTarget` pass for the node network's "brighten connecting lines near cursor" effect, or whether per-vertex color attributes suffice**
   - What we know: D-04 wants lines to visually brighten near the cursor; a dynamically rebuilt `LINES` vertex buffer with per-vertex alpha/color computed in JS (CPU-side, before upload) is the simplest approach and avoids a second render target entirely.
   - What's unclear: Whether a shader-side approach (passing `uMouse` into the line's own fragment shader) would look better/cheaper than CPU-side vertex color computation — this is a visual/perf tradeoff best resolved during the spike, not during research.
   - Recommendation: Default to CPU-side per-vertex brightness computation (simpler, no second Program needed for proximity math) and revisit only if the spike shows a visible perf or visual problem.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Build/dev | ✓ | v22.23.2 (per `.nvmrc`=22, confirmed Phase 1) | — |
| npm | Install `ogl`, build | ✓ | bundled with Node 22 | — |
| `ogl` (to be installed this phase) | WebGL rendering | ✗ (not yet in `package.json`) | 1.0.11 target | N/A — this phase's own install step |
| Browser WebGL support | Runtime rendering | N/A (runtime/browser-side, not a dev-machine dependency) | — | `canAnimateHero === false` path (poster) already built in Phase 1 |
| Image compression CLI (`cwebp`/`avifenc`/ImageMagick/`sharp`) | Producing the compressed still (D-05) | ✗ (none installed) | — | Browser-native `canvas.toBlob()` for capture (Chrome/Firefox only — see Pitfall 2) + [Squoosh](https://squoosh.app) web app for the final WebP/AVIF compression pass; no new devDependency needed |
| Playwright/Puppeteer | Automated headless still-capture (optional) | ✗ (not installed; `npx playwright` would prompt a multi-hundred-MB download) | — | Manual browser capture (open the dev page, screenshot/export canvas) — zero-install, appropriate for a one-time asset |

**Missing dependencies with no fallback:** none — every gap above has a documented, zero-new-dependency fallback.

**Missing dependencies with fallback:** image compression CLI (use Squoosh web app), Playwright/Puppeteer (use manual browser capture).

## Security Domain

`security_enforcement` is not set in `.planning/config.json`, so it's treated as enabled, but this phase has an unusually small attack surface: no user input is ever read into the shader, no network requests are made by the hero, and no data is persisted (D-15: pause state is not stored). Most ASVS categories are not applicable to a decorative, static-content canvas.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|--------------------|
| V2 Authentication | No | No auth anywhere on this static site |
| V3 Session Management | No | No sessions |
| V4 Access Control | No | No protected resources |
| V5 Input Validation | No (no user input) | The only "input" is `clientX/clientY` from pointer/touch events, consumed purely as numeric canvas coordinates — never rendered as HTML/text, never used in a URL, never persisted, so there is no injection surface |
| V6 Cryptography | No | No secrets, no crypto operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| WebGL context/GPU resource exhaustion (opening multiple contexts) | Denial of Service (self-inflicted, not attacker-driven) | Phase 1 already caps/releases the capability-probe context (T-05-02); Phase 2 must create exactly one lasting `Renderer`/context for the hero's lifetime, never re-create it on re-render |
| Shader source injection | Tampering | Not applicable — all shader source is static, authored at build time, never constructed from runtime/user data |
| Clickjacking of the audience-chooser links | Tampering/Spoofing | Not a new risk introduced by this phase; standard same-origin anchor links, no change to the site's existing (lack of) framing protections |

## Sources

### Primary (HIGH confidence)
- `npm view ogl` (version, time, repository, dependencies, scripts, dist size) — registry ground truth
- `npm audit --json` (post-trial-install, reverted) — confirmed zero `ogl`-attributable advisories
- `slopcheck install ogl` — clean `[OK]` verdict
- MDN: `IntersectionObserver`, `Document: visibilitychange event`, `WEBGL_lose_context`, `HTMLCanvasElement.toBlob()` (via WebSearch, cross-referenced across multiple independent pages)
- Khronos `WEBGL_lose_context` Ratified Extension Specification (via WebSearch)
- github.com/oframe/ogl (official repo, via WebFetch) — Renderer/Camera/Program/Mesh/Geometry/Transform shapes, bundle size figures, license
- github.com/oframe/ogl/blob/master/examples/wireframe-shader.html (via WebFetch) — concrete `Renderer`/`Program`/render-loop code

### Secondary (MEDIUM confidence)
- tympanus.net/codrops (Progressive Blur with OGL/GLSL, Rotating Image Gallery with OGL) — `ogl` setup patterns, cross-referenced with the official repo
- github.com/Philotheephilix/reactbits.dev-skill catalog.md (via WebFetch) — list of `ogl`-based React Bits backgrounds (Aurora, Plasma, Particles, GradientBlinds) used as prior-art evidence that fragment-shader-only mesh gradients and point/line networks are both achievable in `ogl`
- reactbits.dev/backgrounds/aurora, /particles — component descriptions, install-command shape (not full source — site blocked deep extraction)
- Community gist (marioecg) + npm package docs (`@emotionagency/glhtml`) referencing `ogl` `Renderer` options (`alpha`, `dpr`, `powerPreference`) — cross-referenced across two independent sources

### Tertiary (LOW confidence, flagged for the spike)
- Exact field names/shapes of a mesh-gradient-specific `ogl` `Program`'s `uniforms` object — this research's own extrapolation from the general `ogl` API shape, not sourced from a verified mesh-gradient `ogl` example. **This is the item the ROADMAP's research flag calls out — do not treat Code Example snippets in this document as copy-paste-ready; spike them first.**

## Metadata

**Confidence breakdown:**
- Standard stack (`ogl` itself): HIGH — registry, GitHub repo, slopcheck, and audit all independently confirmed
- Architecture (Next.js client-boundary rules, capability gating, lifecycle/visibility patterns): HIGH — these are either already-built Phase 1 code or well-documented, stable Next.js/browser platform behaviors
- Shader/mesh-gradient implementation specifics: LOW-MEDIUM — no official `ogl` example matches this exact effect; genuinely requires the spike the ROADMAP flags
- Pitfalls: MEDIUM-HIGH — each pitfall traces to either a platform spec requirement (context loss, passive touch) or a cross-referenced, reproducible browser-support gap (Safari WebP)

**Research date:** 2026-10-11
**Valid until:** ~30 days for the Next.js/platform-API findings (stable); the `ogl`-specific shader findings should be considered valid only until the spike runs — treat them as a starting hypothesis, not a locked fact, regardless of elapsed time

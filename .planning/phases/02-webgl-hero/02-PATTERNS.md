# Phase 2: WebGL Hero - Pattern Map

**Mapped:** 2026-10-11
**Files analyzed:** 11 (6 new, 5 modified)
**Analogs found:** 7 / 11 (role-match or better); 4 have no direct codebase analog (first-of-kind WebGL/client-boundary files — RESEARCH.md Code Examples are the fallback reference)

**Version note:** `package.json` currently pins `next@16.3.8`. CLAUDE.md's "Technology Stack" section (generated earlier) says 14.2 — that is stale. Treat `16.3.8` (confirmed by reading `package.json` directly) as ground truth for any version-sensitive pattern (e.g., `next/dynamic` client-boundary rules below apply identically across 14.x/16.x App Router, so this does not change any extracted pattern).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/sections/Hero.tsx` | component (section) | request-response (static render + mounts client island) | itself (current version) + `src/components/sections/Services.tsx` | exact (self) |
| `src/components/hero/HeroCanvasLoader.tsx` | provider/wrapper | event-driven (client-boundary gate) | `src/providers/CapabilitiesProvider.tsx` | role-match (client directive + fail-safe wrapper convention) |
| `src/components/hero/HeroCanvas.tsx` | component (client canvas owner) | streaming (rAF render loop) | `src/hooks/useCapabilitySignals.ts` | partial (browser-API lifecycle/cleanup convention only — no rendering analog exists) |
| `src/components/hero/useHeroRenderer.ts` | hook | event-driven (observers + state machine) | `src/hooks/useCapabilitySignals.ts` | role-match (hook, SSR-safe default, cleanup pattern) |
| `src/components/hero/shaders.ts` | utility/config | transform (GLSL string export) | none | no analog |
| `src/components/hero/PauseButton.tsx` | component | request-response (toggle control) | `src/components/sections/Contact.tsx` (inline SVG icon links) | partial (icon-authoring convention only) |
| `src/components/sections/Services.tsx` | component (section) | request-response | itself (current version) | exact (self) |
| `src/components/sections/Expertise.tsx` | component (section) | request-response | itself (current version) | exact (self) |
| `src/components/Header.tsx` | component (nav) | request-response | itself — read-only reference, not modified | n/a (contract-only) |
| `src/app/globals.css` | config (styles) | transform | itself (current `@theme` block) | exact (self) |
| `package.json` | config | — | itself (current `dependencies`/`devDependencies` pinning style) | exact (self) |

## Pattern Assignments

### `src/components/sections/Hero.tsx` (component, request-response)

**Analog:** itself (`src/components/sections/Hero.tsx`, current 32-line version) + `src/components/sections/Services.tsx` for the `id="..."` section-anchor convention.

**Current full content (lines 1-32)** — this is what gets rewritten, not appended to:
```tsx
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/office-bg.jpg"
          alt="Modern Office Background"
          fill
          style={{ objectFit: 'cover' }}
          className="transform scale-110"
          priority
        />
        <div className="absolute inset-0 bg-brand-strong/65" />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl px-6 text-center text-on-brand">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
          Your Success Starts With<br />The Right Talent
        </h1>
        <p className="text-xl md:text-2xl mb-12 leading-relaxed max-w-3xl mx-auto">
          MVForster Talent Solutions connects exceptional talent with innovative companies.
          We specialize in placing top-tier professionals in technology, behavioral health,
          and therapeutic services.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-surface to-transparent z-10" />
    </section>
  );
}
```

**What to keep from this pattern:**
- The `relative ... overflow-hidden` section shell with an `absolute inset-0 z-0` background layer and `relative z-10` content layer — this stacking order is exactly what the poster + canvas crossfade needs (poster and canvas both go inside the existing `absolute inset-0 z-0` slot, content block stays `relative z-10`).
- `container mx-auto max-w-6xl px-6` content wrapper — reuse verbatim for the headline/subline/chooser block (matches `Services.tsx`/`Expertise.tsx` `px-6` convention per UI-SPEC spacing table).
- The bottom fade (`bg-linear-to-t from-surface to-transparent`) — keep as-is, it sits above both poster and canvas at `z-10`.
- **Must change:** `<Image src="/office-bg.jpg" .../>` import and usage is removed per D-07 (stop using it, leave the file in `public/`). Replace the background layer with the poster `<img>`/CSS-background + `<HeroCanvasLoader />`.
- **Must stay a server component** — no `'use client'` directive here (RESEARCH.md Pitfall 1). It renders text, chooser anchors, and the pause-button shell as static HTML; only `HeroCanvasLoader` crosses the client boundary.

**Section-anchor convention to carry into the chooser links** (`src/components/sections/Services.tsx` line 5):
```tsx
<section id="services" className="py-20 bg-surface-muted">
```
Mirror this exact `id="..."` attribute placement directly on the `<section>` tag when wiring `#employers`/`#candidates` onto `Services.tsx`/`Expertise.tsx` (see those files' own entries below) — the chooser's `<a href="#employers">` in `Hero.tsx` depends on that id existing somewhere in the DOM, server-rendered, no JS required (D-10).

---

### `src/components/hero/HeroCanvasLoader.tsx` (client wrapper, event-driven)

**Analog:** `src/providers/CapabilitiesProvider.tsx` (closest existing `'use client'` boundary file in the codebase).

**Imports + directive pattern** (`src/providers/CapabilitiesProvider.tsx` lines 1-6):
```tsx
'use client';

import { createContext, useContext, useMemo } from "react";
import { deriveVerdicts, SSR_DEFAULT_SIGNALS, STATIC_VERDICTS } from "@/lib/capabilities";
import { useCapabilitySignals } from "@/hooks/useCapabilitySignals";
import type { Capabilities } from "@/types/capabilities";
```
Copy the `'use client'` directive as the literal first line, then the `@/` alias import style (`@/lib/...`, `@/hooks/...`, `@/types/...`) — this is the one file in the codebase that already establishes the alias convention consistently (contrast with `src/app/about/page.tsx`'s relative-path import noted in CLAUDE.md as inconsistent; prefer the alias here).

**Fail-safe / never-throw pattern** (`src/providers/CapabilitiesProvider.tsx` lines 22-27):
```tsx
// Fail-static outside a provider, consistent with the core value that the
// page works when enhancements fail — never throws.
export function useCapabilities(): Capabilities {
  const context = useContext(CapabilitiesContext);
  return context ?? { ...STATIC_VERDICTS, signals: SSR_DEFAULT_SIGNALS };
}
```
Apply the same "fail toward the static/visible state, never throw" philosophy in `HeroCanvasLoader`: if `canAnimateHero` is false, render nothing (poster stays the only visible layer) rather than rendering an error or a loading spinner.

**RESEARCH.md's concrete shape for this exact file** (Pattern 1, Code Example — this is the primary template since no file in the codebase does `next/dynamic(..., { ssr: false })` yet):
```tsx
// src/components/hero/HeroCanvasLoader.tsx
'use client';
import dynamic from "next/dynamic";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default function HeroCanvasLoader() {
  return <HeroCanvas />;
}
```
Gate the render with `useCapabilities().canAnimateHero` inside this file (or inside `HeroCanvas`) per RESEARCH.md Pattern 3 — consume the verdict, never re-derive it:
```tsx
import { useCapabilities } from "@/providers/CapabilitiesProvider";

export default function HeroCanvasLoaderInner() {
  const { canAnimateHero } = useCapabilities();
  if (!canAnimateHero) return null; // poster underneath remains the only visible layer
  return <HeroCanvas />;
}
```

---

### `src/components/hero/HeroCanvas.tsx` (client canvas owner, streaming/rAF)

**Analog:** no rendering analog exists in the codebase (first `<canvas>`/WebGL file). Closest *structural* analog for browser-API lifecycle + cleanup is `src/hooks/useCapabilitySignals.ts`.

**Lifecycle/cleanup convention to copy** (`src/hooks/useCapabilitySignals.ts` lines 70-85):
```tsx
function subscribe(onChange: () => void): () => void {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotionQuery.addEventListener("change", onChange);

  const connection = getConnection();
  connection?.addEventListener?.("change", onChange);

  return () => {
    reducedMotionQuery.removeEventListener("change", onChange);
    connection?.removeEventListener?.("change", onChange);
  };
}
```
The register-listener-then-return-matching-cleanup shape is the project's one established convention for browser-API subscriptions — apply it identically for `IntersectionObserver`, `document.visibilitychange`, and `webglcontextlost`/`webglcontextrestored` inside `HeroCanvas`/`useHeroRenderer`.

**Single-context discipline** (`src/hooks/useCapabilitySignals.ts` lines 12-20, comment is load-bearing):
```tsx
// Probed once per page load (module-level cache) to avoid exhausting the
// browser's WebGL context limit before Phase 2's hero creates its own
// (threat T-05-02).
let webglResult: boolean | null = null;
```
This is a direct dependency: Phase 1's probe already releases its context via `WEBGL_lose_context().loseContext()` specifically so `HeroCanvas` can open the *one real, lasting* context. Do not add a second capability-style probe inside `HeroCanvas` — go straight to constructing the `ogl` `Renderer` once, on mount, inside the `canAnimateHero === true` branch only.

**No codebase analog for the render loop itself.** Use RESEARCH.md's Code Examples verbatim as the starting template (already spike-flagged as MEDIUM confidence, not copy-paste-final):
```typescript
import { Renderer, Triangle, Program, Mesh } from "ogl";

const renderer = new Renderer({
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  alpha: false,
  powerPreference: "low-power",
});
const gl = renderer.gl;
containerEl.appendChild(gl.canvas);

const geometry = new Triangle(gl);
const program = new Program(gl, {
  vertex: gradientVertexShader,
  fragment: gradientFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: [0, 0] },
    uBrand: { value: [0x0B / 255, 0x25 / 255, 0x45 / 255] },
    uAccent: { value: [0x0F / 255, 0x76 / 255, 0x6E / 255] },
    uCta: { value: [0xE7 / 255, 0x6F / 255, 0x51 / 255] },
  },
});
const mesh = new Mesh(gl, { geometry, program });
```
Context-loss handling (RESEARCH.md Pattern 5 / Pitfall 3 — `preventDefault()` is non-optional even though this phase doesn't rebuild):
```typescript
gl.canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault(); // keep restoration possible; we don't act on it this phase
  setContextLost(true); // triggers shouldRun = false and canvas opacity -> 0
});
```
Touch-interaction rule (D-04, RESEARCH.md Pitfall 4 — hard requirement, not discretionary):
```typescript
el.addEventListener("touchmove", onTouchMove, { passive: true }); // never preventDefault()
```

---

### `src/components/hero/useHeroRenderer.ts` (hook, event-driven)

**Analog:** `src/hooks/useCapabilitySignals.ts` (only hook in the codebase; role-match).

**SSR-safe default + `useSyncExternalStore`-style shape** (`src/hooks/useCapabilitySignals.ts` lines 1-5, 66-68, 83-85):
```tsx
'use client';

import { useSyncExternalStore } from "react";
import { readSignals, SSR_DEFAULT_SIGNALS } from "@/lib/capabilities";
```
```tsx
function getServerSnapshot(): CapabilitySignals {
  return SSR_DEFAULT_SIGNALS;
}
```
```tsx
export function useCapabilitySignals(): CapabilitySignals {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```
`useHeroRenderer` doesn't need `useSyncExternalStore` specifically (plain `useState`/`useEffect` is fine per RESEARCH.md Pattern 4's `IntersectionObserver`/`visibilitychange` example), but the **shape to copy** is: export one hook function, return a plain derived value (here: a `shouldRun` boolean or `{ paused, toggle, contextLost }` object), and never let the hook throw or require a provider ancestor — consistent with the project's "always fail toward the static/safe state" rule (`CapabilitiesProvider.tsx` comment, cited above).

**Concrete gating logic from RESEARCH.md Pattern 4** (this is the primary template — no codebase file does IntersectionObserver/visibilitychange yet):
```tsx
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

**Testability pattern (optional, Claude's Discretion):** if any pure logic is extracted from this hook (e.g. node-layout math, distance thresholds), follow the existing test pattern in `scripts/capabilities.test.mjs` (lines 1-20) — plain `node --test` with `--experimental-strip-types`, no test framework dependency:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveVerdicts, readSignals, SSR_DEFAULT_SIGNALS, STATIC_VERDICTS } from "../src/lib/capabilities.ts";
```
Any new pure module (e.g. `src/components/hero/nodeNetwork.ts` if node math is split out for testability) should be importable the same way — plain exported functions, no `window`/`document` references inside the pure module itself (see `src/lib/capabilities.ts` lines 7-9 comment: "Pure module: no window/navigator/document references. All environment access comes through the ... argument passed by callers").

---

### `src/components/hero/shaders.ts` (utility/config, transform)

**Analog:** none — first shader file in the codebase.

**Required export shape** (RESEARCH.md Anti-Patterns, "Importing `.glsl`/`.vert`/`.frag` files directly"): export plain `string` template literals from a `.ts` file, since no raw-text loader is configured for shader extensions:
```typescript
export const gradientVertexShader = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`;

export const gradientFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uBrand;
  uniform vec3 uAccent;
  uniform vec3 uCta;
  varying vec2 vUv;
  // ... noise + color mix, spike-verified before finalizing
`;
```
Colors must be derived from `src/app/globals.css`'s `@theme` block (lines 6-19) — do not hardcode a different palette:
```css
--color-brand: #0B2545;
--color-brand-strong: #071A33;
--color-accent: #0F766E;
--color-cta: #E76F51;
--color-on-brand: #FFFFFF;
```

---

### `src/components/hero/PauseButton.tsx` (component, request-response toggle)

**Analog:** `src/components/sections/Contact.tsx` for inline-SVG icon authoring convention (role-match on "icon inside interactive element," not on semantics — `Contact.tsx` uses `<a>`, this phase requires a native `<button>`).

**Inline SVG convention to copy** (`src/components/sections/Contact.tsx` lines 20-22):
```tsx
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
</svg>
```
No icon library anywhere in the codebase (confirmed: zero `lucide`/`heroicons`/`react-icons` in `package.json`) — `className="w-N h-N"` + `viewBox="0 0 24 24"` + `currentColor`/`stroke` is the established hand-authored-SVG convention; reuse this sizing/attribute shape for the pause/play glyphs.

**Primary interactive-pattern template** (RESEARCH.md Code Examples — no native toggle `<button>` exists anywhere yet in the codebase, so this is the template, not an adaptation of existing code):
```tsx
<button
  type="button"
  aria-pressed={isPlaying}
  aria-label={isPlaying ? "Pause background animation" : "Play background animation"}
  onClick={() => setIsPlaying((p) => !p)}
  className="h-10 w-10 min-h-6 min-w-6 rounded-full backdrop-blur-sm bg-on-brand/15 border border-on-brand/30 text-on-brand focus-visible:ring-2 focus-visible:ring-on-brand"
>
  {/* inline SVG, swapped by isPlaying */}
</button>
```
`backdrop-blur-sm` on a translucent `bg-on-brand/15` fill is a new combination for this codebase, but it extends the only existing `backdrop-blur` usage (`src/components/Header.tsx` line 6: `bg-brand/95 backdrop-blur-xs`) — same "translucent brand-tinted surface over content" idea, applied to `on-brand` instead of `brand` since the button sits on the dark hero, not the light page.

Per D-13, only render/enable this when `canAnimateHero && !contextLost` is true — compose with the `useCapabilities()` read already established in `HeroCanvasLoader.tsx`.

---

### `src/components/sections/Services.tsx` (component, request-response) — add `id="employers"`

**Analog:** itself. Current section tag (line 5):
```tsx
<section id="services" className="py-20 bg-surface-muted">
```
**Constraint (D-08):** `Header.tsx` line 23 links to `/#services` — that id must keep resolving. Per D-08, wrap or add an inner anchor element rather than renaming the existing id:
```tsx
<section id="services" className="py-20 bg-surface-muted">
  <div id="employers" className="scroll-margin-top-header"> {/* or inline style/utility, see globals.css entry */}
    {/* existing content unchanged */}
  </div>
</section>
```
(Exact wrapper element/utility class is an implementation choice for the plan — the constraint is: both `#services` and `#employers` must resolve to a scrollable target in the final DOM, and `#services` must not move or disappear.)

---

### `src/components/sections/Expertise.tsx` (component, request-response) — add `id="candidates"`

**Analog:** itself. Current section tag (line 3):
```tsx
<section id="expertise" className="py-24">
```
Same wrapper constraint as `Services.tsx` above — `Header.tsx` line 26 links to `/#expertise` and must keep working alongside the new `#candidates` target (D-08).

---

### `src/app/globals.css` (config, transform)

**Analog:** itself — current `@theme` block and its load-bearing comment style (lines 3-5):
```css
/* Semantic design tokens (D-04). Contrast-checked against WCAG AA in
   .planning/phases/01-foundation/01-01-PLAN.md — do not rename without
   re-running that check. */
@theme {
  --color-surface: #FFFFFF;
  ...
```
Follow this same "comment explaining the decision + reference to the phase doc" convention when adding the new rules. RESEARCH.md's concrete CSS to add (D-10, `prefers-reduced-motion`-gated smooth scroll + header-offset anchor scroll):
```css
html {
  scroll-behavior: smooth;
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
#employers, #candidates {
  scroll-margin-top: <measured-header-height>; /* measure Header.tsx's actual rendered height, don't guess from Tailwind classes — see RESEARCH.md Open Question 1 */
}
```
Place inside (or alongside) the existing `@layer base { body { ... } }` block (lines 25-30) rather than a new ad hoc location, to keep base-layer rules together.

---

### `package.json` (config)

**Analog:** itself — current pinning convention.

**Exact-pin precedent** (lines 10-20, `dependencies`/`devDependencies`):
```json
"next": "16.3.8",
...
"eslint-config-next": "16.3.8",
"postcss": "8.5.28",
"tailwindcss": "4.3.3",
```
Most entries are pinned with no caret (exact version), matching CONTEXT.md's "pin per the Phase 1 supply-chain practice" instruction. Add `ogl` the same way:
```json
"dependencies": {
  "next": "16.3.8",
  "ogl": "1.0.11",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```
(Exact-pin `ogl`, not `^1.0.11` — consistent with `next`/most devDependencies, and with RESEARCH.md's own `npm install ogl@1.0.11` instruction.)

## Shared Patterns

### Client/Server boundary isolation
**Source:** RESEARCH.md Pattern 1 (no codebase precedent exists yet — this will be the first `next/dynamic(..., { ssr: false })` call in the project)
**Apply to:** `HeroCanvasLoader.tsx` (the only file allowed to call `dynamic()`), `Hero.tsx` (stays a server component, only imports/renders `<HeroCanvasLoader />`)
```tsx
// HeroCanvasLoader.tsx only
'use client';
import dynamic from "next/dynamic";
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });
```

### Capability gating — single source of truth
**Source:** `src/providers/CapabilitiesProvider.tsx` lines 24-27, `src/lib/capabilities.ts` lines 46-48
**Apply to:** `HeroCanvasLoader.tsx`, `HeroCanvas.tsx`, `PauseButton.tsx` (render/enable condition)
```tsx
import { useCapabilities } from "@/providers/CapabilitiesProvider";
const { canAnimateHero } = useCapabilities();
```
Never add a second WebGL probe or re-derive the reduced-motion/network/device-memory rules inside any Phase 2 file — `src/lib/capabilities.ts` line 46's comment is explicit that it's "the ONLY place" this logic may live.

### `@/` path-alias imports
**Source:** `src/providers/CapabilitiesProvider.tsx` lines 4-6, `src/hooks/useCapabilitySignals.ts` lines 4-5
**Apply to:** all new files under `src/components/hero/`
```tsx
import { useCapabilities } from "@/providers/CapabilitiesProvider";
import type { Capabilities } from "@/types/capabilities";
```

### Semantic Tailwind tokens only, no raw hex / no `dark:`
**Source:** `src/app/globals.css` lines 6-19 (`@theme` block); confirmed zero `dark:` usage in any Phase-1-era file under `src/components/sections/`
**Apply to:** `Hero.tsx`, `PauseButton.tsx`, chooser buttons — use `bg-brand`, `text-on-brand`, `border-on-brand/30`, etc., never a literal `#0B2545` in JSX/className.

### Inline SVG icons, no icon library
**Source:** `src/components/sections/Contact.tsx` lines 20-22, 31-33; `src/components/sections/AboutHero.tsx` lines 24-37
**Apply to:** `PauseButton.tsx` pause/play glyphs
```tsx
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
</svg>
```

### Section id preserved + extended, not renamed
**Source:** `src/components/sections/Services.tsx` line 5, `src/components/sections/Expertise.tsx` line 3, `src/components/Header.tsx` lines 23-28
**Apply to:** `Services.tsx` (`#employers`), `Expertise.tsx` (`#candidates`) — existing `#services`/`#expertise` ids referenced by `Header.tsx` must continue to resolve.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/hero/HeroCanvas.tsx` | component | streaming (rAF loop) | No `<canvas>`/WebGL file exists anywhere in the codebase yet. Use RESEARCH.md Architecture Pattern 2 + Code Examples as the primary template; treat as a spike per ROADMAP's research flag (shader/uniform field names are MEDIUM confidence, not codebase-verified). |
| `src/components/hero/shaders.ts` | utility/config | transform | No GLSL/shader-string file exists. Use RESEARCH.md Anti-Patterns section (export as `.ts` template literals, not `.glsl` files) and the Don't-Hand-Roll noise-function guidance (reuse the public-domain Ashima/Gustavson `snoise` snippet rather than deriving one). |
| `src/components/hero/useHeroRenderer.ts` (IntersectionObserver/visibilitychange/context-loss portions specifically) | hook | event-driven | No file in the codebase uses `IntersectionObserver`, `document.visibilitychange`, or `webglcontextlost`/`restored`. `useCapabilitySignals.ts` supplies the closest *shape* (subscribe/cleanup, SSR-safe default) but not these specific browser APIs — RESEARCH.md Patterns 4 and 5 are the primary reference. |
| Poster/still asset generation (`public/hero-poster.webp` or similar) | asset (not code) | file-I/O | No image-generation/compression tooling exists in this repo (no `sharp`, no Playwright). RESEARCH.md Common Pitfall 2 and Environment Availability table cover the manual-capture + Squoosh fallback workflow; this is a one-time manual asset-production step, not a pattern to copy from source. |

## Metadata

**Analog search scope:** `src/app/`, `src/components/` (all subdirectories), `src/hooks/`, `src/lib/`, `src/providers/`, `src/types/`, `scripts/`, `package.json`, `src/app/globals.css`
**Files scanned:** 17 source files (all `.ts`/`.tsx` in `src/`) + `package.json` + `scripts/capabilities.test.mjs`
**Pattern extraction date:** 2026-10-11

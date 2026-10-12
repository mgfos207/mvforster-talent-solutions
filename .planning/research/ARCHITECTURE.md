# Architecture Research

**Domain:** WebGL hero + ambient video + scroll motion + Calendly popup on a static-exported (`output: 'export'`) Next.js 14 App Router marketing site
**Researched:** 2026-09-29
**Confidence:** MEDIUM-HIGH (component/boundary patterns HIGH — official Next.js docs + multiple corroborating sources; specific library choices MEDIUM — WebSearch-verified, no Context7 entries for `ogl`/`react-calendly`)

## Standard Architecture

### System Overview

The current codebase (`.planning/codebase/ARCHITECTURE.md`) has **zero client components** — three monolithic server-component pages, one shared `Header`, no hooks, no context, Tailwind 3.3.3 with a broken v4-only `@theme inline` block. Static export (`output: 'export'`, `images.unoptimized: true`) means there is no server runtime in production: everything interactive must resolve to plain HTML/CSS at build time, then hydrate as isolated client "islands." The target architecture layers new interactive capability on top of the existing static shell without converting whole pages to client components.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Server Component Layer (build-time)               │
│  app/layout.tsx → app/page.tsx → components/sections/*.tsx           │
│  (headline copy, semantic HTML, alt text, links — always rendered,   │
│   always crawlable, always the fallback content)                     │
├───────────────────────────┬───────────────────────────────────────── ┤
│   CapabilitiesProvider     │   Section shells render server-side;     │
│   ('use client', high in   │   each shell decides, via context, what  │
│   the tree, cheap)         │   client island to mount inside itself   │
├───────────────────────────┴───────────────────────────────────────── ┤
│                    Client Island Layer (hydrated, lazy)              │
│  ┌───────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────┐ │
│  │ HeroCanvas│  │ AmbientVideo  │  │ AmbientVideo  │  │ CalendlyCTA│ │
│  │ (WebGL,   │  │ (Employers,   │  │ (Candidates,  │  │ (popup,    │ │
│  │ dynamic   │  │ IO-gated)     │  │ IO-gated)     │  │ dynamic    │ │
│  │ ssr:false)│  │               │  │               │  │ ssr:false) │ │
│  └───────────┘  └───────────────┘  └───────────────┘  └───────────┘ │
├───────────────────────────────────────────────────────────────────── ┤
│                    Browser Capability Layer                          │
│  matchMedia(prefers-reduced-motion) · WebGL context probe ·          │
│  navigator.connection.saveData/effectiveType · IntersectionObserver  │
│  · Page Visibility API (document.visibilitychange)                  │
├───────────────────────────────────────────────────────────────────── ┤
│                    Static Assets (public/, served verbatim)          │
│  video/*.webm|mp4 + poster JPGs · og-image · favicons                │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `app/layout.tsx` | Root HTML shell, fonts, global metadata defaults, mounts `CapabilitiesProvider` once for the whole tree | Server component; one `'use client'` provider nested inside it |
| `CapabilitiesProvider` | Computes `{ hasWebGL, prefersReducedMotion, saveData, isLowPower }` once client-side; exposes via context; SSR-safe defaults (`false`/"assume constrained") so static HTML never depends on it | Client component + `useSyncExternalStore`/`useEffect`, no props from server |
| `components/sections/*.tsx` | Own the semantic content (headings, copy, links, structured markup) for one page section; always server-rendered so content exists without JS | Server components; each one imports at most one client island as a child |
| `HeroCanvas` | Renders the WebGL mesh-gradient + node network, owns the render loop, reads capabilities to decide whether to mount at all | Client component, dynamic-imported with `ssr:false`, thin wrapper around a non-React render module |
| `AmbientVideo` | Lazily mounts a `<video>` only when its section is near-viewport, gated by capabilities; otherwise renders the poster image | Client component using `IntersectionObserver` + `<video preload="none" muted loop playsInline>` |
| `CalendlyCTA` / `CalendlyPopup` | Opens the Calendly popup widget on click; loads the Calendly script/portal only on interaction, not on page load | Client component, dynamic-imported with `ssr:false`, `document.body` portal target |
| `ScrollReveal` | Thin presentational wrapper that toggles a CSS class when a section enters the viewport, driving fade/slide-in motion | Client component, `IntersectionObserver`, no-op passthrough when `prefersReducedMotion` |

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # server: html shell, fonts, default metadata, mounts CapabilitiesProvider
│   ├── page.tsx                # server: composes Home from sections/*
│   ├── about/page.tsx          # server: composes About from sections/*
│   ├── sitemap.ts              # server: static sitemap (compatible with output:'export')
│   ├── robots.ts               # server: static robots.txt
│   └── globals.css             # Tailwind directives + CSS variable design tokens (fixed, see below)
├── components/
│   ├── Header.tsx              # server shell + one client CTA island (Book intro chat button)
│   ├── Footer.tsx               # server, new — secondary CTA + links
│   ├── sections/
│   │   ├── Hero.tsx            # server: headline/subhead/CTA + <HeroCanvas /> child
│   │   ├── EmployersSection.tsx # server: copy + <AmbientVideo variant="employers" />
│   │   ├── CandidatesSection.tsx# server: copy + <AmbientVideo variant="candidates" />
│   │   ├── ServicesGrid.tsx    # server, static, no client children
│   │   ├── ExpertiseGrid.tsx   # server, static
│   │   ├── WhyChooseUs.tsx     # server, static
│   │   └── ContactSection.tsx  # server + <CalendlyCTA /> island
│   ├── webgl/
│   │   ├── HeroCanvas.tsx      # 'use client', mounted via next/dynamic(ssr:false) from Hero.tsx
│   │   ├── renderLoop.ts       # pure module: rAF loop start/stop, no React
│   │   └── meshGradientScene.ts# pure module: ogl scene/shader setup, no React
│   ├── media/
│   │   ├── AmbientVideo.tsx    # 'use client', IntersectionObserver-gated <video> mount
│   │   └── VideoPoster.tsx     # server, next/image poster fallback (also the initial paint)
│   ├── cta/
│   │   ├── CalendlyCTA.tsx     # 'use client', button that triggers popup on click
│   │   └── CalendlyPopup.tsx   # 'use client', dynamic-imported, wraps react-calendly PopupModal
│   └── motion/
│       └── ScrollReveal.tsx    # 'use client', IntersectionObserver class toggle wrapper
├── hooks/
│   ├── useCapabilities.ts      # reads matchMedia + WebGL probe + navigator.connection
│   ├── useIntersection.ts      # shared IntersectionObserver hook (video + scroll reveal)
│   └── usePageVisibility.ts    # document.visibilitychange → boolean, for render-loop pausing
├── providers/
│   └── CapabilitiesProvider.tsx# 'use client', context wrapper around useCapabilities
└── lib/
    └── calendly.ts             # constants: booking URL, popup color/text config

public/
├── video/
│   ├── employers-ambient.webm
│   ├── employers-ambient.mp4   # fallback for browsers without webm support
│   ├── employers-poster.jpg
│   ├── candidates-ambient.webm
│   ├── candidates-ambient.mp4
│   └── candidates-poster.jpg
└── og/
    └── home-og.jpg              # 1200x630 social preview image
```

### Structure Rationale

- **`components/sections/`:** Matches the existing codebase's own stated gap (`.planning/codebase/ARCHITECTURE.md` names this exact anti-pattern: monolithic pages with no section extraction). Extracting sections first is a *prerequisite*, not a nice-to-have — it is what makes it possible to swap the hero without touching unrelated markup.
- **`components/webgl/` and `components/media/` separated from `components/sections/`:** Sections own *content and layout*; islands own *browser API access*. This boundary means a section can be reviewed/edited by anyone touching copy without needing to understand WebGL or video internals, and the island can be rewritten (e.g. swap `ogl` for raw WebGL) without touching section markup.
- **Non-React modules (`renderLoop.ts`, `meshGradientScene.ts`) separate from the React wrapper (`HeroCanvas.tsx`):** The render loop and shader setup have no business being React state — putting them in plain TS modules avoids re-render-triggered re-initialization and keeps the React component's job limited to lifecycle (mount/unmount/visibility), which is exactly what needs testing.
- **`hooks/` and `providers/` split from `components/`:** `useCapabilities`, `useIntersection`, and `usePageVisibility` are consumed by *three* independent islands (hero canvas, ambient video, scroll reveal). Centralizing them avoids three slightly-different `matchMedia`/`IntersectionObserver` implementations drifting apart, and gives one place to unit-test capability logic.
- **`public/video/` and `public/og/` subfolders:** The current `public/` is flat and already has stray/corrupted files (per `.planning/codebase/STRUCTURE.md`: several ~40-byte "images" and an unrelated `filing-llc.png` at repo root). New binary asset categories should not repeat that flat-and-messy pattern.

## Architectural Patterns

### Pattern 1: Server section shell + dynamically-imported client island

**What:** Each section that needs a canvas/video/widget stays a server component for its text and structure, and renders exactly one client child that is itself loaded via `next/dynamic(() => import(...), { ssr: false })`.

**When to use:** Any time a section needs a browser-only API (WebGL context, `<video>`, a third-party popup script) but the section's *text content* should remain server-rendered, crawlable, and part of the static HTML that ships with zero JS cost.

**Trade-offs:** Requires discipline to keep `'use client'` at the leaf, not the section root — it is easy to accidentally mark the whole section file `'use client'` "just to be safe," which silently opts the entire section (including copy that could be static) out of server rendering. Verified pattern: with the App Router, `ssr:false` for `next/dynamic` must be called from inside a client component; a Server Component can still *import* that client wrapper directly without needing `dynamic` itself, but the browser-only work (Three.js/WebGL/Calendly) has to live behind the dynamic boundary to avoid build-time `window`/`document` errors during `next build`'s static export pass. [Confidence: HIGH — Next.js official docs on `next/dynamic` + corroborated by multiple 2025-2026 Next.js/Three.js integration guides]

**Example:**
```tsx
// components/sections/Hero.tsx — SERVER component
import dynamic from 'next/dynamic'

const HeroCanvas = dynamic(() => import('@/components/webgl/HeroCanvas'), {
  ssr: false,
  loading: () => null, // poster/gradient CSS fallback already in the DOM below
})

export function Hero() {
  return (
    <section className="relative isolate min-h-[90vh]">
      <div className="absolute inset-0 -z-10 bg-gradient-hero" /> {/* CSS fallback, always present */}
      <HeroCanvas /> {/* mounts on top only if capabilities allow it */}
      <h1 className="relative">Calm, human recruiting for healthcare teams</h1>
      {/* ...CTA, subhead — all server-rendered, present even with JS disabled */}
    </section>
  )
}
```

### Pattern 2: Capability gate as context, read once, checked everywhere

**What:** One `CapabilitiesProvider` mounted near the root computes WebGL support, `prefers-reduced-motion`, `navigator.connection.saveData`/`effectiveType`, and a derived `isLowPower` flag exactly once per page load, then every island (`HeroCanvas`, `AmbientVideo`, `ScrollReveal`) reads from context instead of re-probing.

**When to use:** Whenever more than one independent component needs the same environment signal. Re-running `matchMedia` and WebGL context creation in three separate components wastes work and risks the three islands disagreeing (e.g. hero renders WebGL while video section decides "low power, skip video").

**Trade-offs:** `navigator.deviceMemory` and `navigator.connection` are Chromium-only and absent in Safari/Firefox — treat their absence as "unknown," never as "assume low-power," or a large share of desktop Safari visitors get needlessly downgraded. [Confidence: MEDIUM — WebSearch-verified across multiple capability-detection writeups, no single authoritative spec source since these are non-standard APIs] Because static export means these values are unknowable at build time, the provider must render a safe default (motion off, WebGL off) during SSR and only upgrade after `useEffect` runs client-side — this causes one unavoidable "upgrade" render after hydration, which is fine since the fallback (poster/gradient) is the correct initial paint anyway (helps LCP, not just a compromise).

**Example:**
```tsx
// hooks/useCapabilities.ts — 'use client'
export function useCapabilities() {
  const [caps, setCaps] = useState({
    hasWebGL: false, prefersReducedMotion: true, saveData: false, isLowPower: false,
  }) // conservative defaults = the fallback path, matches SSR output

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const conn = (navigator as any).connection
    const saveData = !!conn?.saveData
    const hasWebGL = probeWebGL() // create+immediately discard a WebGL context
    setCaps({
      hasWebGL, prefersReducedMotion: reducedMotion, saveData,
      isLowPower: saveData || (conn?.effectiveType && ['slow-2g','2g','3g'].includes(conn.effectiveType)),
    })
  }, [])

  return caps
}
```

### Pattern 3: IntersectionObserver-gated video mount with Page Visibility pause

**What:** `<video>` elements are not mounted (not even with `preload="none"`) until their section crosses an intersection threshold; once playing, a separate `document.visibilitychange` listener pauses playback/render loops when the tab is backgrounded, and unmounting when scrolled far out of view stops the media element entirely rather than just pausing it.

**When to use:** Any ambient/looping video or WebGL render loop on a page with more than one such element — required by the performance budget (mobile Lighthouse ≥ 90, LCP ≤ 2.5s) since eagerly requesting video bytes or running two simultaneous rAF loops off-screen wastes bandwidth and battery for no visible benefit.

**Trade-offs:** Two separate concerns must both be handled — *visibility in viewport* (IntersectionObserver, "should this exist at all right now") and *tab visibility* (Page Visibility API, "should this animate right now even though it's in the viewport"). Conflating them causes bugs like a hero animation that keeps burning CPU while the user is on a different browser tab.

**Example:**
```tsx
// components/media/AmbientVideo.tsx — 'use client'
export function AmbientVideo({ src, poster, caps }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const isVisible = useIntersection(ref, { rootMargin: '200px', threshold: 0.1 })
  const isTabVisible = usePageVisibility()

  useEffect(() => { if (isVisible && !caps.isLowPower && !caps.prefersReducedMotion) setShouldLoad(true) }, [isVisible])

  return (
    <div ref={ref} className="relative aspect-video">
      <img src={poster} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      {shouldLoad && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src} poster={poster} muted loop playsInline preload="metadata"
          autoPlay={isVisible && isTabVisible}
          aria-hidden
        />
      )}
    </div>
  )
}
```

## Data Flow

### Request Flow (static export — no server at request time)

```
Browser requests /  (or /about)
    ↓
GitHub Pages serves pre-built out/index.html   ← content, section markup, poster <img>s all present, no JS required
    ↓ (hydration)
React hydrates section shells → CapabilitiesProvider runs useEffect → context updates from conservative defaults
    ↓
Each island (HeroCanvas / AmbientVideo / ScrollReveal) re-renders once capability values resolve
    ↓
If capable: HeroCanvas dynamic-imports its chunk, initializes WebGL, starts rAF loop gated by IntersectionObserver + visibilitychange
If not capable / reduced motion / save-data: island stays unmounted, CSS gradient / poster image is the final, permanent state
```

### Capability & Gating Flow

```
matchMedia(prefers-reduced-motion) ─┐
navigator.connection.saveData ──────┼──→ CapabilitiesProvider (context) ──→ HeroCanvas   (mount? render loop run?)
WebGL context probe ────────────────┘                                  ├──→ AmbientVideo (mount <video>? autoplay?)
                                                                          └──→ ScrollReveal (animate class? or static?)
```

### Video Lifecycle Flow

```
Section scrolled near viewport (IntersectionObserver, rootMargin ~200px)
    ↓
<video> element mounted (was previously just a poster <img>)
    ↓
Tab visible AND element intersecting → autoplay/resume
Tab hidden OR element scrolled far out → pause (video), stop rAF (canvas)
Element far enough out of view (e.g. exits with margin) → unmount <video> entirely, revert to poster
```

### Calendly Popup Flow

```
User clicks any "Book an intro chat" CTA (Header, Hero, ContactSection, mobile sticky bar)
    ↓
CalendlyCTA (already hydrated, small) → dynamically imports CalendlyPopup chunk on first click (not on page load)
    ↓
CalendlyPopup mounts react-calendly PopupModal into a document.body portal, opens immediately
    ↓
No Calendly JS/network cost paid by users who never click the CTA
```

### Design Token Flow

```
tailwind.config.ts (theme.extend.colors → CSS var references)
    ↓
globals.css :root (source of truth hex values: navy / teal / coral palette)
    ↓
Tailwind utility classes (bg-primary, text-accent, etc.) used inside sections/*.tsx and webgl/media modules
    ↓
WebGL shader uniforms + video color-grading choices are hand-matched to the same hex values (no automatic bridge — shaders can't read Tailwind classes, so palette constants must be duplicated intentionally, e.g. in a small `lib/theme.ts` exporting the same hex values as JS constants for GLSL uniforms)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (brochure site, 2 real pages) | Everything above applies directly. No need for a component library, no state management, no build-time data fetching — this is not a scaling problem, it's a boundary/isolation problem. |
| If more sections/pages are added (e.g. dedicated `/employers`, `/candidates` landing pages) | Section components already being standalone (`EmployersSection`, `CandidatesSection`) means they can be reused directly on new routes without duplication — this is the main payoff of doing the section extraction now. |
| If video/testimonial count grows significantly | `AmbientVideo` as a single parameterized component (not one bespoke component per video) keeps this linear; consider a small manifest (`lib/videos.ts`) mapping variant → `{src, poster, alt}` instead of hardcoding paths per section. |

### Scaling Priorities

1. **First likely bottleneck: cumulative JS bundle from multiple client islands.** Three separate dynamic chunks (hero canvas, two ambient videos' shared component, Calendly) is fine; watch total transferred JS if more WebGL/video sections get added later — the fix is keeping `ogl` (few KB) rather than a full `three.js` + `@react-three/fiber` stack (80-120KB+) for a background-only shader, not premature code-splitting. [Confidence: MEDIUM — WebSearch, bundle-size figures from third-party comparison, not independently verified in this research pass]
2. **Second likely bottleneck: video asset weight.** Self-hosted WebM/MP4 pairs for two sections is manageable; if more ambient video sections are added, revisit whether a CDN-hosted/streamed approach is worth the added complexity versus continuing to self-host compressed clips in `public/video/`.

## Anti-Patterns

### Anti-Pattern 1: Marking a whole section (or page) `'use client'` to "make WebGL work"

**What people do:** Add `'use client'` to the top of `components/sections/Hero.tsx` (or worse, `app/page.tsx`) because that's the fastest way to get `useRef`/`useEffect` working for a canvas.
**Why it's wrong:** It opts the section's static heading/copy/CTA text out of server rendering too, growing the client JS bundle and increasing hydration cost for content that never needed JS in the first place — directly works against the stated LCP/Lighthouse budget. It also reintroduces the exact monolithic-file problem this refresh is meant to fix, just moved from "one big server file" to "one big client file."
**Do this instead:** Keep the section server-rendered; push `'use client'` down to the smallest possible leaf component (`HeroCanvas`, `AmbientVideo`), and load that leaf via `next/dynamic(..., { ssr: false })`.

### Anti-Pattern 2: Gating only on WebGL support, ignoring `prefers-reduced-motion` and Save-Data

**What people do:** Check `canvas.getContext('webgl')` and consider that sufficient to decide whether to animate.
**Why it's wrong:** A device can fully support WebGL and still have the user request reduced motion (accessibility) or be on a metered/slow connection (Save-Data). Shipping motion anyway violates the explicit accessibility constraint in `.planning/PROJECT.md` and can trigger vestibular discomfort for users who opted out.
**Do this instead:** Treat capability gating as a conjunction — WebGL support is necessary but not sufficient. `CapabilitiesProvider` should require `hasWebGL && !prefersReducedMotion && !saveData` (or an equivalent explicit policy) before ever mounting `HeroCanvas`, and apply the same conjunction to autoplaying ambient video.

### Anti-Pattern 3: Running the render loop or video playback while off-screen or tab-hidden

**What people do:** Start `requestAnimationFrame` once on mount and never stop it until unmount; `autoPlay` a `<video>` once mounted and leave it playing regardless of scroll position or tab focus.
**Why it's wrong:** Burns CPU/GPU and battery for content the user cannot see, which is the single most common real-world complaint about "modern" animated marketing sites on mobile, and directly threatens the mobile Lighthouse Performance ≥ 90 budget (long tasks reported even for off-screen canvases in some Lighthouse audits).
**Do this instead:** Pair every render loop / autoplaying video with both an `IntersectionObserver` (viewport gate) and a `document.visibilitychange` listener (tab gate); pause on either signal going false, resume only when both are true again.

### Anti-Pattern 4: Loading the Calendly widget script on every page load

**What people do:** Add the Calendly `<script>`/embed globally in `layout.tsx` so the popup is "ready" everywhere.
**Why it's wrong:** Pays third-party script cost (network + parse + a chunk of main-thread time) for every visitor, even the majority who never click a CTA — directly competes with the LCP budget on first load.
**Do this instead:** Dynamically import the Calendly popup component only inside the `onClick` handler (or via `next/dynamic(ssr:false)` triggered by a state flag set on first click), so the cost is paid only by users who engage.

### Anti-Pattern 5 (carried over from existing codebase, must not repeat during this work): Section-as-inline-JSX

**What people do:** Add the new hero/video sections as more inline `<section>` blocks appended to the existing `page.tsx`, matching current file style.
**Why it's wrong:** This is the exact anti-pattern already documented in `.planning/codebase/ARCHITECTURE.md` for the existing services/expertise/contact sections; repeating it for the new, more complex WebGL/video sections makes them harder to isolate, not easier.
**Do this instead:** Every new visual section is its own file under `components/sections/`, matching the structure in this document, from the start — do not add new sections to `page.tsx` inline even temporarily.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Calendly (`calendly.com/micah-mvforster/introductory-chat`) | Client-only popup widget (`react-calendly`'s `PopupModal`, or Calendly's own `PopupWidget` script), mounted via portal to `document.body`, loaded on first interaction | Requires `rootElement={document.body}` (or equivalent) since it renders via React Portal; cannot render during SSR/static build — must be behind `ssr:false`. [Confidence: MEDIUM — WebSearch across multiple integration guides, consistent across sources, not Context7-verified since `react-calendly` has no Context7 entry found] |
| Stock/generated video source | Self-hosted static files in `public/video/`, not a live CDN embed | Matches the "self-hosted and compressed" constraint in `.planning/PROJECT.md`; no runtime dependency on a third party for the ambient video, keeping it consistent with the fully-static hosting model. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `sections/*` (server) ↔ `webgl/`, `media/`, `cta/` (client islands) | One-directional: section passes static props (variant name, src paths, alt text) down to the island as component props; island never needs to call back up into server logic (there is none at runtime) | Keeps the dependency arrow pointing one way — content layer doesn't know *how* an island renders, island doesn't own any copy/content |
| `hooks/useCapabilities` ↔ every island | Read-only context consumption; islands never mutate capabilities, only read and react | Prevents one island's decision (e.g. hero deciding to skip WebGL) from being second-guessed by inconsistent local re-detection elsewhere |
| `webgl/renderLoop.ts` ↔ `webgl/HeroCanvas.tsx` (React wrapper) | React component calls `start()`/`stop()` imperatively from `useEffect`/`IntersectionObserver`/`visibilitychange` callbacks; the loop module holds no React state | Keeps animation frame timing outside React's render cycle, which is standard practice for canvas/WebGL loops paired with React — avoids re-render-driven loop restarts |
| Tailwind config/tokens ↔ WebGL shader palette | Manual duplication via a shared `lib/theme.ts` constants file (hex values exported as plain JS, imported both by Tailwind config indirectly and by shader uniform setup) | No automatic bridge exists between CSS custom properties and GLSL uniforms; document this duplication point clearly so a future palette change doesn't miss the shader |

### Design Tokens — Existing Bug to Resolve Before Building New Sections

`src/app/globals.css` currently defines a Tailwind v4-syntax `@theme inline` block on top of Tailwind 3.3.3 (confirmed in `package.json`: `"tailwindcss": "3.3.3"`), which is not a supported v3 directive — this is why `text-primary`/`bg-primary` classes currently resolve to nothing. This is already flagged as an Active requirement in `.planning/PROJECT.md`. Architecturally, resolve it **before** extracting sections or building the new palette, since every new section and island will be styled with these tokens:
- **Option A (stay on v3):** Move the palette into `tailwind.config.ts` under `theme.extend.colors`, referencing the existing CSS custom properties (`var(--primary)`, etc.) as the color values — standard, well-documented v3 pattern, zero dependency upgrade risk.
- **Option B (upgrade to Tailwind v4):** Adopt the CSS-first `@theme` config natively, removing `tailwind.config.ts` entirely. Cleaner long-term but is a dependency/build-tooling decision belonging in `STACK.md`, not this document — flagging here only because it blocks consistent design-token usage in the new sections either way.

## Sources

- [Next.js — `next/dynamic` API reference](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — Confidence: HIGH (official docs, App Router metadata/dynamic import behavior)
- [Next.js — Metadata Files: robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) — Confidence: HIGH (official docs)
- ["Animated Next.js Without Turning the Whole Page into a client component"](https://dev.to/jyotipathak__/animated-nextjs-without-turning-the-whole-page-into-a-client-component-dko) — Confidence: MEDIUM (community writeup, corroborates official pattern)
- [ogl — Minimal WebGL Library (GitHub)](https://github.com/oframe/ogl) — Confidence: MEDIUM (project README, bundle-size claims cross-referenced against comparison article below)
- ["React Shader Backgrounds: What WebGL Costs and When It Pays"](https://21st.dev/blog/react-shader-background-components) — Confidence: MEDIUM (single third-party source for bundle-size comparisons; not independently benchmarked in this research pass)
- [react-calendly — npm](https://www.npmjs.com/package/react-calendly) — Confidence: MEDIUM (package docs via search summary; recommend re-verifying exact `PopupModal` props against the published README before implementation)
- [Josh W. Comeau — "Accessible Animations in React with prefers-reduced-motion"](https://www.joshwcomeau.com/react/prefers-reduced-motion/) — Confidence: MEDIUM (respected independent source, pattern matches official `matchMedia` API)
- Internal: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `.planning/PROJECT.md`, `package.json`, `tailwind.config.ts`, `src/app/globals.css` — Confidence: HIGH (direct repository inspection)

---
*Architecture research for: WebGL/video/motion integration into a static Next.js 14 marketing site*
*Researched: 2026-09-29*

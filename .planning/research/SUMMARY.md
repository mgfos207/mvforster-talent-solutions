# Project Research Summary

**Project:** MVForster Talent Solutions — Modern Site Refresh
**Domain:** Healthcare/behavioral-health recruiting agency marketing site (solo founder, dual-audience, static-exported Next.js on GitHub Pages), adding a WebGL hero, ambient video, scroll motion, and a Calendly CTA
**Researched:** 2026-09-29
**Confidence:** MEDIUM-HIGH overall (stack versions and pitfalls verified against live registries/official docs; feature and architecture patterns cross-verified across multiple sources with some single-source flags)

## Executive Summary

This is a brochure-style B2B/B2C recruiting site where the entire business goal is funneling two distinct audiences (healthcare employers and BCBA/RBT/healthcare-admin candidates) into a single Calendly booking action. Expert practice in this niche (verified directly against two live ABA-recruiting competitor sites) is a one-page, dual-audience-split hero with a repeated, unvaried CTA and quantified trust stats standing in for testimonials — none of the direct competitors use any motion or WebGL, which makes the planned "calm Stripe-gradient hero" a genuine, low-risk differentiator rather than a crowded pattern to fight through. The codebase today is a single monolithic static-export Next.js 14 site with zero client components, a currently-broken Tailwind color system (v4 CSS syntax running under a v3 engine, so brand colors silently render as black), and lingering privacy exposure (`/goals` and `public/family/` photos) that is more serious than a simple deletion can fix because the GitHub repo is public and git retains full history.

The recommended approach layers new interactive capability onto the existing static shell without converting whole pages to client code: extract `components/sections/*` first (a stated prerequisite the research repeatedly returns to), fix the design-token bug, then build one shared `CapabilitiesProvider` (WebGL support, `prefers-reduced-motion`, Save-Data/low-power) that every new island — hand-rolled `ogl` WebGL hero, `IntersectionObserver`-gated ambient `<video>` per audience section, `motion`-driven scroll reveal, and a lazily-loaded Calendly popup — reads from rather than re-detecting independently. Recommended stack choices (`ogl` over three.js/r3f, `motion` over unshipped CSS scroll-timelines, self-hosted compressed WebM/MP4 over a video CDN, Tailwind v4 + Next.js 16 upgrades) are all chosen specifically to protect the project's hard performance budget (mobile Lighthouse ≥90, LCP ≤2.5s) and to avoid forcing an unwanted React 19 bump.

The dominant risks are not exotic: the canvas/video becoming the LCP element, WebGL context loss with no recovery path, iOS Safari autoplay silently failing without literal `muted playsinline` attributes, a WCAG 2.2.2 pause-control gap that automated scanners miss, and Calendly's script/cookie-banner degrading both performance and the mobile booking flow if loaded eagerly. All of these have well-documented, cheap mitigations that must be built into each feature's first implementation, not bolted on later. Separately — and orthogonally to the visual redesign — the `/goals`/family-photo exposure requires an explicit, user-approved git history rewrite (`git filter-repo` + force-push) or making the repo private; this is a gated decision, not something to execute autonomously, and should be resolved early since the whole point of this redesign is to drive more traffic and eyes to the repo.

## Key Findings

### Recommended Stack

The stack additions are deliberately minimal and chosen to avoid forcing unrelated major-version upgrades. `ogl` (zero-dependency, ~34KB gzipped full package, tree-shakes smaller) replaces any three.js/react-three-fiber consideration for the hero shader, because r3f's current major requires React ≥19 and three.js core alone is ~170KB+ gzipped — both contradict the project's explicit "no heavy 3D" scope and its intent to stay on React 18. `motion` (the renamed, actively-maintained successor to `framer-motion`) drives scroll-reveal with `whileInView` and a built-in `useReducedMotion()`, working unchanged on React 18.2.0. Two infrastructure upgrades are treated as required, not optional: Tailwind v4 (the codebase's `globals.css` already contains v4-only `@theme inline` syntax that is a silent no-op under the installed v3.3.3) and Next.js 16 (Next 14 is EOL as of Oct 2025; Next 15's LTS window closes ~3 weeks after this research date). Both upgrades share a hard blocker — Node ≥20 — that must be bumped in CI (currently pinned to Node 18) before either package installs correctly.

**Core technologies:**
- `ogl` 1.0.11 — hand-rolled WebGL2 abstraction for the hero mesh-gradient + connected-nodes canvas — zero dependencies, no forced React version, matches the "ambient shader, not full 3D" scope
- `motion` 13.4.6 — scroll-reveal fade/slide-in with built-in reduced-motion support — React-idiomatic `whileInView` API, no framer-motion deprecation risk
- `tailwindcss` 4.3.3 + `@tailwindcss/postcss` — fixes the already-broken `@theme inline` block and removes the JS-config duplication risk; requires Node ≥20
- `next` 16.3.7 — actively-patched LTS replacing EOL Next 14, with peer deps that keep React at `^18.2.0` (no forced React 19 bump)
- `ffmpeg` (system binary) — encodes the self-hosted WebM/MP4 ambient video pair and poster frames; static export has no server-side transcoding path

Fallback options are documented if the primary choices prove too costly: `@paper-design/shaders-react` for a pre-built gradient component (83KB gzipped, heavier but lower implementation risk) and `@tsparticles/react` for the node-network effect (60-90KB gzipped combined) if hand-rolling either in `ogl`/Canvas2D takes too long.

### Expected Features

Both direct niche competitors (Recruit ABA, Career Connections) validate the planned architecture: a dual-audience-split hero with paired CTAs, one unvaried "Book a call"-style CTA repeated everywhere, and quantified stats/founder narrative substituting for testimonials that don't exist yet. Neither uses any motion or WebGL, confirming the planned visual differentiation is genuinely uncontested in this niche rather than table stakes to match.

**Must have (table stakes):**
- Dual-audience split reachable in one click from the hero (For Employers / For Candidates)
- One consistent primary CTA ("Book an intro chat") repeated at every section, header included
- Static/reduced-motion/no-WebGL/low-power fallback for the hero — not optional, will trigger for real visitors (mobile Low Power Mode disables background video/animation unconditionally)
- Fast load / Core Web Vitals maintained despite the new animation and video
- Founder-led trust section (photo + bio + credentials) surfaced on the home page, not buried on `/about`
- Quantified, honest trust stats (years practicing, roles placed, specialties) replacing fabricated testimonials

**Should have (competitive differentiators):**
- WebGL mesh-gradient + cursor-reactive node-network hero — no competitor in this niche uses any motion
- Separate ambient muted video per audience section (calmer/clinical tone for employers, warmer tone for candidates)
- "How it works" 3-step process split per audience, ending in the same CTA
- Sticky mobile bottom CTA bar (~15-25% conversion lift in published A/B data; unused by any niche competitor checked)

**Defer (v1.x / v2+):**
- Inline Calendly embed alongside the popup (a deliberate scope change from PROJECT.md's single-embed-type decision — flag explicitly if pursued, don't add by default)
- Broader scroll-reveal staging beyond the hero (add incrementally once base performance is proven safe)
- Real testimonials/case studies and custom-filmed video (explicitly deferred in PROJECT.md pending real client data/footage)
- Any job board/listings/ATS features (explicitly out of scope — conflicts with static hosting and the single-CTA funnel)

### Architecture Approach

The current codebase has zero client components and one monolithic page per route; the target architecture keeps that server-rendered shell for all real content and layers browser-only capability behind small, dynamically-imported (`next/dynamic({ ssr: false })`) client "islands." A single `CapabilitiesProvider`, mounted once near the root, computes WebGL support, `prefers-reduced-motion`, and Save-Data/low-power signals exactly once and exposes them via context so the hero, video, and scroll-reveal islands never independently re-detect (and potentially disagree).

**Major components:**
1. `components/sections/*.tsx` (server) — own all headline/copy/CTA text; always rendered and crawlable regardless of JS, one per page section, extracted from the current monolithic `page.tsx`
2. `CapabilitiesProvider` + `hooks/useCapabilities`, `useIntersection`, `usePageVisibility` (client, shared) — single source of truth for "can/should this device animate," read-only by every island
3. `components/webgl/HeroCanvas.tsx` + non-React `renderLoop.ts`/`meshGradientScene.ts` modules — WebGL render loop kept out of React state, gated by capabilities + IntersectionObserver + Page Visibility, dynamically imported with `ssr:false`
4. `components/media/AmbientVideo.tsx` — IntersectionObserver-gated `<video>` mount (poster-first, video only after near-viewport + capability checks pass), one shared parameterized component for both audience sections
5. `components/cta/CalendlyCTA.tsx` / `CalendlyPopup.tsx` — Calendly script/popup loaded only on first click, never on page load, portal-mounted to `document.body`

### Critical Pitfalls

1. **Canvas/video becomes the LCP element and stays empty for seconds** — ensure a fast text/poster element is the largest visible paint, mount the canvas/video after first paint via `next/dynamic({ ssr: false })`, verify with Chrome DevTools' LCP marker, not just the Lighthouse score.
2. **WebGL context loss (`webglcontextlost`) crashes the hero on mobile with no recovery** — add listener pairs and fall back to the same static poster/gradient used for reduced-motion, rather than attempting partial recovery; test by forcing loss via the `WEBGL_lose_context` extension.
3. **iOS Safari autoplay silently fails** without literal `muted playsinline autoplay loop` HTML attributes (JS-only `.muted = true` isn't sufficient) — always provide a poster, catch rejected `.play()` promises, and test on a real iPhone including Low Power Mode.
4. **WCAG 2.2.2 (Pause, Stop, Hide) violation** — any continuous decorative motion (WebGL gradient or looping video) needs a visible on-page pause control independent of `prefers-reduced-motion`; automated scanners routinely miss this, requiring a manual check.
5. **`/goals` and family photos remain in git history after deletion** — the repo is confirmed public, so `git rm` alone does not remove exposure; a `git filter-repo` history rewrite + force-push (or making the repo private) is required, and per orchestrator guidance this is a gated, user-approved step, not something an executor performs autonomously.
6. **Calendly script/cookie banner degrades performance and mobile UX if loaded eagerly** — inject `widget.js` only on first CTA click, and default to keeping Calendly's own GDPR banner rather than suppressing it without equivalent consent infrastructure.

## Implications for Roadmap

Based on combined research, suggested phase structure (dependency-ordered):

### Phase 1: Repo Hygiene & Privacy Resolution
**Rationale:** Independent of the visual redesign but time-sensitive — this redesign is explicitly intended to drive more traffic/attention to the repo, which raises the stakes of the existing exposure. Pitfalls research treats this as its own early phase, not a side effect of a feature branch.
**Delivers:** `/goals` and `public/family/` removed from the working tree and (pending explicit user approval) purged from git history via `git filter-repo` + force-push, or the repo made private; dead/duplicate config files (`next.config.jsold`, `page.tsx.bak/.new`, duplicate Tailwind/PostCSS configs) removed.
**Addresses:** PROJECT.md's "Privacy" constraint and Active requirement to remove `/goals`/family photos.
**Avoids:** Pitfall 8 (git history exposure) and the config-drift technical-debt pattern (dead config files causing silent no-op changes once WebGL config is added).
**Gate:** History rewrite/repo-visibility change requires explicit user approval before execution — do not treat researcher or agent recommendation as consent.

### Phase 2: Foundation Fixes (Node/Tailwind/Next upgrades + design tokens)
**Rationale:** Every subsequent phase styles new components with `text-primary`/`bg-primary`-style utilities and needs a working Node version for tooling — fixing this after building on top of broken colors means restyling everything twice.
**Delivers:** CI/local Node bumped to ≥20; Tailwind v4 (or, as a stopgap, `theme.extend.colors` mapping under v3) so brand colors actually render; Next.js 14→16 upgrade (or 15 as a short-term stepping stone if the static-export nested-route prefetch bug blocks 16) via official codemods.
**Uses:** `tailwindcss@4.3.3`, `@tailwindcss/postcss`, `next@16.3.7`, `npx @tailwindcss/upgrade`, `npx @next/codemod@canary upgrade latest` from STACK.md.
**Avoids:** Pitfall 11 (silent broken brand colors) and the Next.js EOL/security-patch risk.

### Phase 3: Section Componentization
**Rationale:** Explicitly flagged as a structural prerequisite in both FEATURES.md and ARCHITECTURE.md — the CTA, WebGL hero, and video features all depend on sections existing as standalone, swappable components rather than inline JSX in a monolithic page.
**Delivers:** `src/components/sections/*.tsx` extracted from `page.tsx`/`about/page.tsx`, matching the target project structure (Hero, EmployersSection, CandidatesSection, ServicesGrid, ExpertiseGrid, WhyChooseUs, ContactSection).
**Addresses:** "Section componentization" P1 feature; establishes the server/client component boundary correctly before any WebGL/video content is layered in.
**Avoids:** Pitfall 10 (marketing copy trapped in client components) and Anti-Pattern 5 (repeating the monolithic-page pattern for new sections).

### Phase 4: Capability Detection Infrastructure
**Rationale:** Three independent features (WebGL hero, ambient video, scroll reveal) all need the same environment signals; building this once, before any of the three, prevents three drifting re-implementations and gives a single fallback path all three features share.
**Delivers:** `CapabilitiesProvider` + `hooks/useCapabilities`, `useIntersection`, `usePageVisibility`; conservative SSR-safe defaults (motion off, WebGL off) that upgrade once client-side.
**Implements:** ARCHITECTURE.md Pattern 2 (capability gate as context, read once).
**Avoids:** Pitfall/Anti-Pattern 2 (gating only on WebGL support while ignoring `prefers-reduced-motion`/Save-Data).

### Phase 5: WebGL Hero (mesh gradient + connected nodes)
**Rationale:** The highest-complexity, highest-differentiation feature; depends on Phases 2-4 (working design tokens, section boundary, capability gate) being in place first.
**Delivers:** `HeroCanvas` (ogl-based render loop in a non-React module) mounted via `next/dynamic({ ssr: false })` inside the server-rendered `Hero.tsx`; static gradient/poster fallback; `webglcontextlost`/`restored` handling; a visible pause control (WCAG 2.2.2); throttled cursor-reactive node network.
**Addresses:** FEATURES.md's top differentiator (no niche competitor uses WebGL/motion).
**Avoids:** Pitfalls 1, 2, 3, 5, 6 (LCP/canvas, hydration/INP cost, context loss, WCAG 2.2.2, contrast over moving background) — all pitfalls research explicitly maps to this phase.
**Research flag:** Needs deeper research/validation during planning — `ogl` has no Context7 entry and its tree-shaking claims are community-reported, not independently benchmarked.

### Phase 6: Ambient Video Sections (Employers / Candidates)
**Rationale:** Depends on the audience-split hero/sections existing (Phase 3) since the video's differentiation value comes from reinforcing which audience a section addresses — building video before the split exists wastes that value.
**Delivers:** One parameterized `AmbientVideo` component, IntersectionObserver-gated mount, poster-first, self-hosted compressed WebM/MP4 pairs per clip (target <3-5MB), literal `muted playsinline autoplay loop` attributes, Page Visibility pause.
**Addresses:** FEATURES.md differentiator "separate ambient video per audience section."
**Avoids:** Pitfalls 4, 7, 9 as applicable to video (iOS autoplay failure, GitHub Pages video-hosting/size limits) — also shares the WCAG 2.2.2 pause-control requirement and the scrim/overlay contrast pattern established in Phase 5.
**Research flag:** Needs a real-device (iPhone, normal + Low Power Mode) QA pass specific to this phase — not catchable from desktop testing.

### Phase 7: Site-wide Calendly CTA
**Rationale:** Depends on section componentization (Phase 3) so the CTA can be one shared component consumed everywhere, not hand-copied per section; independent of the WebGL/video work otherwise, so it can proceed in parallel with Phases 5-6 once Phase 3 lands.
**Delivers:** `CalendlyCTA`/`CalendlyPopup` client islands, widget script lazy-loaded only on first click, portal-mounted popup, consistent "Book an intro chat" copy in header + every major section.
**Addresses:** The single most important feature in FEATURES.md — this is the entire business goal of the redesign.
**Avoids:** Pitfall 9 (eager script load + mobile cookie-banner blocking the booking flow) — standard, well-documented integration pattern per ARCHITECTURE.md Anti-Pattern 4.
**Research flag:** Standard pattern — official Calendly docs are HIGH confidence; skip research-phase unless `react-calendly`'s exact `PopupModal` props need re-verification against its README.

### Phase 8: Visual System, Trust Content & Scroll Reveal
**Rationale:** Comes last because it depends on working design tokens (Phase 2) and benefits from the hero/video's established scrim/overlay contrast pattern (Phase 5) being reusable for the rest of the page; this is largely content/copy/motion polish rather than new architecture.
**Delivers:** Palette/typography/frosted-glass card system applied sitewide; founder-led trust section surfaced on the home page; quantified trust stats (content-dependent on real numbers from the business owner — schedule this data-gathering early even though implementation is last); "How it works" 3-step section per audience; `motion`-driven scroll-reveal (`whileInView`) across sections.
**Addresses:** Remaining P1 table-stakes features (founder trust section, quantified stats, "how it works") and the "should have" light scroll-reveal differentiator.
**Avoids:** Anti-feature risk of fabricated testimonials (use only honest, verifiable stats).

### Phase Ordering Rationale

- Privacy/repo-hygiene (Phase 1) and foundation fixes (Phase 2) are placed first because both are described in PITFALLS.md as "resolve before further public-facing work" and "resolve before any new component styling begins," respectively — building on top of either broken colors or unresolved exposure means redoing work later.
- Section componentization (Phase 3) is a hard prerequisite named identically across FEATURES.md, ARCHITECTURE.md, and PITFALLS.md — every subsequent phase's component boundaries depend on it existing first.
- Capability detection (Phase 4) is extracted as its own phase, ahead of WebGL/video, because three later features consume it and research explicitly warns against three drifting re-implementations.
- WebGL hero (Phase 5) precedes ambient video (Phase 6) because the hero is higher-risk/higher-complexity and establishes the fallback and contrast patterns (poster/gradient, scrim overlay, pause control) that video reuses rather than reinventing.
- Calendly (Phase 7) is architecturally independent of the WebGL/video work and could run in parallel with Phases 5-6 once Phase 3 is done, but is sequenced after to keep the roadmap's critical path linear; a roadmapper may choose to parallelize it.
- Visual polish and trust content (Phase 8) is last because it depends on the design-token fix and benefits from patterns established in earlier phases, and because the quantified-stats content depends on data from the business owner that should be gathered in parallel starting early, even though the implementation slot is late.

### Research Flags

Needs research during planning:
- **Phase 5 (WebGL Hero):** `ogl`'s modular tree-shaking behavior is community-reported, not independently benchmarked; the mesh-gradient GLSL implementation needs a reference adaptation (Whatamesh/gradient-stripe repos cited, MEDIUM confidence).
- **Phase 6 (Ambient Video):** Needs real-device iOS testing methodology and a concrete stock-footage sourcing/licensing decision (Coverr/Pexels/Mixkit vs. paid Runway) before implementation.
- **Phase 1 (Repo Hygiene):** `git filter-repo` execution mechanics and the tradeoffs of history-rewrite vs. making the repo private need to be resolved with the user directly — this is a decision point, not a research gap, but the roadmapper should flag it as requiring explicit sign-off before any destructive git operation.
- **Phase 2 (Foundation):** Next.js 16's static-export nested-route prefetch issue is single-source (one blog, unverified against an official issue) — needs a smoke test on this project's actual CI (Ubuntu runners) before committing to Next 16 over a 15.x stepping stone.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 3 (Section Componentization):** Standard Next.js App Router server/client component splitting, HIGH confidence, official docs.
- **Phase 4 (Capability Detection):** Standard `matchMedia`/`IntersectionObserver`/Page Visibility API patterns, well-documented (Josh Comeau, MDN).
- **Phase 7 (Calendly CTA):** Official Calendly embed docs are HIGH confidence and the lazy-load-on-click pattern is well-established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions, peer dependencies, and bundle sizes verified live against npm registry, endoflife.date, and the Bundlephobia API; architectural framing (e.g., OGL tree-shaking) is MEDIUM within an otherwise HIGH-confidence document. |
| Features | MEDIUM-HIGH | Two direct niche competitors fetched and analyzed live; broader UX/conversion patterns (sticky CTA lift, inline-vs-popup Calendly conversion data) rely on MEDIUM-confidence secondary sources with no access to this project's own analytics. |
| Architecture | MEDIUM-HIGH | Component-boundary and server/client split patterns are HIGH confidence (official Next.js docs, corroborated by multiple sources); specific library integration details (`ogl`, `react-calendly`) are MEDIUM since neither has a Context7 entry and rely on WebSearch/README verification. |
| Pitfalls | HIGH | Core Web Vitals, WCAG, iOS Safari autoplay behavior, and GitHub Pages limits verified against official docs (web.dev, MDN, W3C, webkit.org, GitHub Docs); Calendly-specific CSP/consent behavior and stock-footage authenticity concerns are MEDIUM (community/vendor sources). |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Git history exposure resolution is a decision, not a research gap:** the orchestrator has already confirmed the repo is public; the roadmap must surface the `git filter-repo`-vs-private-repo choice as an explicit, gated, user-approved step in Phase 1 rather than assuming an approach.
- **Next.js 16 static-export prefetch bug:** single-source report, unverified on this project's Ubuntu CI — validate with a smoke test immediately after the Phase 2 upgrade, before merging, with Next 15.5.27 as a documented fallback if it reproduces.
- **Quantified trust stats depend on real data from the business owner** (years practicing, roles placed, certifications) — this is a content-gathering dependency, not a code dependency, and should be scheduled to start early (in parallel with Phase 1-4) so it doesn't block Phase 8 implementation later.
- **Stock/generated video sourcing and licensing** is not fully resolved — Coverr/Pexels/Mixkit license terms should be spot-checked per clip before publishing, and any AI-generated video must use a paid tier with documented commercial terms (free tiers and Sora API are both flagged as unusable).
- **`ogl` and `react-calendly` implementation details** were verified via WebSearch/README rather than Context7 or hands-on testing — treat initial implementation of both as needing a quick spike/validation pass before committing to the full build.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`) — live version/peerDependencies/engines data for `motion`, `gsap`, `ogl`, `@react-three/fiber`, `three`, `tailwindcss`, `next`, `react-calendly`, `@paper-design/shaders-react`, tsParticles packages
- Bundlephobia API — live gzip measurements for `ogl@1.0.11`, `motion@13.4.6`, `gsap@3.15.0`, `@paper-design/shaders-react@0.0.81`
- [endoflife.date/nextjs](https://endoflife.date/nextjs) — Next.js 14/15/16 EOL and LTS windows
- [nextjs.org/docs/app/guides/upgrading/version-16](https://nextjs.org/docs/app/guides/upgrading/version-16), [nextjs.org/blog/next-16](https://nextjs.org/blog/next-16) — official Next 16 migration docs
- [tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide) — official v3→v4 migration guide
- [web.dev — Largest Contentful Paint](https://web.dev/articles/lcp), [MDN LCP glossary](https://developer.mozilla.org/en-US/docs/Glossary/Largest_contentful_paint)
- [Khronos WebGL Wiki — HandlingContextLost](https://www.khronos.org/webgl/wiki/HandlingContextLost), MDN `webglcontextlost`/`webglcontextrestored` docs
- [WebKit blog — New `<video>` Policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/)
- [W3C — Understanding WCAG 2.2.2 (Pause, Stop, Hide)](https://www.w3.org/TR/UNDERSTANDING-WCAG20/time-limits-pause.html)
- [GitHub Docs — Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Removing sensitive data from a repository](https://docs.github.com/en/enterprise-server@3.0/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- Direct competitor site fetches: [Recruit ABA](https://recruitaba.com/), [Career Connections](https://www.careerconnections.io/) — live site analysis
- Internal repository inspection: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/STRUCTURE.md`, `.planning/PROJECT.md`, `package.json`, `tailwind.config.ts`, `src/app/globals.css`

### Secondary (MEDIUM confidence)
- [github.com/oframe/ogl](https://github.com/oframe/ogl) and HN discussion — OGL modular tree-shaking behavior, community-reported
- [react-calendly npm docs](https://www.npmjs.com/package/react-calendly) — via search summary, recommend re-verifying `PopupModal` props before implementation
- [Josh W. Comeau — Accessible Animations with prefers-reduced-motion](https://www.joshwcomeau.com/react/prefers-reduced-motion/)
- HubSpot, Azuro Digital, Made by Evoke, Haley Marketing, WANDR — recruitment/staffing website design pattern roundups
- [Calendly Help — Embed options / GDPR FAQs / cookie management](https://calendly.com/help/embed-options-overview) — official but community-reported mobile-banner issues cross-referenced separately
- [blog.axiorema.com — Next.js 16 static export nested-route prefetch 404s](https://blog.axiorema.com/engineering/uncurious-case-broken-static-exports-404s-nextjs-16/) — single source, flagged for smoke-testing, not treated as settled

### Tertiary (LOW confidence)
- [StickyCTAs — Engineering Conversion](https://www.stickyctas.com/articles/engineering-conversion) — vendor content on sticky-CTA conversion lift, cross-referenced with one independent source but not a primary study
- tsParticles combined bundle-size estimate — reasoned estimate from documented per-package sizes, not independently measured via Bundlephobia (rate-limited during research)

---
*Research completed: 2026-09-29*
*Ready for roadmap: yes*

# Stack Research

**Domain:** WebGL/motion/video additions to an existing static-exported Next.js 14 marketing site (GitHub Pages, custom domain, healthcare recruiting)
**Researched:** 2026-09-29
**Confidence:** HIGH for versions/EOL/bundle-size data (verified against live npm registry, endoflife.date, bundlephobia API, official docs). MEDIUM for architectural recommendations (some rely on community consensus + single-source blog verification, flagged below).

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `ogl` | 1.0.11 | Minimal WebGL wrapper for the hero mesh-gradient + connected-nodes canvas | Hand-rolled WebGL2 abstraction with **zero dependencies**. Full package is 34.2KB gzipped (verified via Bundlephobia API), but it's split into Core/Math/Extras modules — importing only `Renderer`, `Camera`, `Program`, `Mesh`, `Triangle` (everything one shader-driven hero canvas needs) tree-shakes to well under half that. This is the library Awwwards-tier agency sites use for exactly this "ambient shader hero" pattern because it gives raw shader control without three.js's scene-graph overhead. It has **no React dependency**, so it works identically whether this project stays on React 18 or later moves to 19. |
| `motion` | 13.4.6 | Scroll-reveal motion (fade/slide-in on scroll, respects reduced motion) | This is the current name for what was `framer-motion` — the package was spun out as an independent, framework-agnostic project in 2025; API and import paths changed (`motion/react`), but it is the direct successor and still the most React-idiomatic animation library (`whileInView`, `useReducedMotion()` built in). Peer deps (`react ^18.0.0 \|\| ^19.0.0`, `react-dom` same) mean it works on the site's current React 18.2.0 with no forced upgrade. |
| `tailwindcss` | 4.3.3 | Utility CSS engine | **Required, not optional** — `src/app/globals.css` already contains a `@theme inline { ... }` block, which is Tailwind v4 CSS-native config syntax. It is a complete no-op under the installed v3.3.3, which is why `text-primary`/`bg-primary`/etc. currently render as unstyled black text (confirmed in `.planning/codebase/CONCERNS.md`). Upgrading to v4 makes that block *do what it already looks like it's supposed to do*, and removes the JS-config duplication risk (`tailwind.config.js` vs `.ts`) the codebase audit flagged, since v4 doesn't need a JS config file at all. |
| `next` | 16.3.7 | App Router framework, static export builder | Next.js **14 has been end-of-life since 26 Oct 2025** — no more security patches land on the `^14.0.1`/installed `14.2.35` line (verified via endoflife.date). Next 15's LTS security support ends **21 Oct 2026** (about 3 weeks from this research date), so upgrading to 15 would only buy a few weeks before needing to upgrade again. Next 16 is the actively-patched LTS (16.3.7 addresses a scheduled Sept 30 2026 security release covering 9 CVEs). Its peer dependency for `react`/`react-dom` is `^18.2.0 \|\| ^19.0.0` — **it explicitly supports the site's current React 18.2.0**, so this is a framework upgrade without a forced React major bump. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tailwindcss/postcss` | 4.3.3 | PostCSS plugin for Tailwind v4 | Replaces the `tailwindcss` PostCSS plugin entry from v3. v4 also auto-prefixes internally, so the separate `autoprefixer` dependency can be **removed** from `package.json` once v4 is in place. |
| `@paper-design/shaders-react` | 0.0.81 | Pre-built `MeshGradient` React component (alternative gradient path) | Use **instead of** hand-writing GLSL in `ogl` if the team wants a production-tested, prop-configurable gradient component and is willing to pay the bundle cost: 82.9KB gzipped (verified via Bundlephobia API — larger than the "each shader tree-shakes" marketing suggests, because the peer `@paper-design/shaders` core is pulled in whole). Peer deps (`react ^18 \|\| ^19`) are compatible with React 18.2.0. Reasonable fallback if the hand-rolled `ogl` shader proves too time-consuming to get right. |
| `react-calendly` | 4.4.0 | React wrapper around Calendly's popup/inline widgets | Only if the team wants typed React props for *multiple* embed variants (inline + popup + badge) across pages. **Not recommended for this project's single sitewide popup CTA** — see "What NOT to Use." |
| `@tsparticles/react` + `@tsparticles/slim` | 4.4.0 | Off-the-shelf "linked particles" cursor-reactive network | Fallback only if hand-rolling the connected-nodes canvas effect in `ogl`/Canvas2D turns out to be too time-consuming. Adds real bundle weight (engine + slim preset + React wrapper commonly lands 60-90KB gzipped combined) for an effect this project's own constraints describe as "subtle." |
| `ffmpeg` | latest stable (system binary, not an npm dependency) | Encode/compress sourced stock or AI video clips for the ambient video sections | Static export (`output: 'export'`, `images.unoptimized: true`) has **no server-side transcoding pipeline** — every video byte shipped to production must already be small when committed. `ffmpeg` is the standard free tool for producing the H.264 MP4 + VP9 WebM pair (see Architecture note below) and for generating poster frames. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npx @tailwindcss/upgrade` | Automated Tailwind v3→v4 codemod | Handles ~90% of the mechanical class renames (`flex-shrink-0`→`shrink-0`, `bg-gradient-to-r`→`bg-linear-to-r`, etc.) per Tailwind's own upgrade guide. Run once, then manually verify `@theme inline` resolves the `text-primary`/`bg-primary` classes correctly. |
| `npx @next/codemod@canary upgrade latest` | Automated Next.js 14→16 codemod | Official Vercel migration tool; handles the sync-to-async `params`/`searchParams` API change (Next 16 fully removes synchronous access) and other mechanical renames. |
| `.nvmrc` pinning Node 20 or 22 | Enforce a Node version that satisfies both upgrades | **Hard blocker to check before either upgrade lands:** Tailwind v4's native Oxide engine requires **Node ≥20** (root package advertises `>=10` but native platform binaries only ship for 20+), and Next.js 16 requires **Node ≥20.9.0**. CI is currently pinned to Node 18 (`.github/workflows/nextjs.yml`). Bump `node-version` in CI to 20 or 22 (local dev is already on Node 22 per `.planning/codebase/CONCERNS.md`) as the *first* change in this phase, before installing either package — otherwise CI will fail immediately after `npm ci`. |

## Installation

```bash
# Core additions
npm install ogl motion

# If choosing the pre-built gradient component instead of hand-rolled GLSL:
npm install @paper-design/shaders-react

# Tailwind v4 (replaces tailwindcss@3.3.3 + autoprefixer)
npm install -D tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3
npm uninstall autoprefixer postcss-import  # if present; v4 handles prefixing internally

# Next.js 16 (keep React 18 — no react/react-dom version bump needed)
npm install next@16.3.7

# Calendly: no npm package needed — official widget script is loaded via next/script
# from Calendly's own CDN (see Architecture notes), so it does not appear here.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `ogl` (hand-rolled shader + node canvas) | `three.js` + `@react-three/fiber` + `drei` | Only if the roadmap later wants a genuine 3D scene (camera, lit geometry, GLTF models) — explicitly out of scope per `PROJECT.md`. `three.js` core alone is ~170KB gzipped before tree-shaking, and `@react-three/fiber@9.x` (current major) requires **React ≥19** as a peer dependency (verified via `npm view`), which would force an unwanted React major upgrade just to render a flat ambient gradient. `@react-three/fiber@8.x` supports React 18, but it's still a scene-graph abstraction layer, more weight and more API surface than an ambient 2-effect hero needs. |
| `ogl` for the connected-nodes effect | `@tsparticles/react` + `@tsparticles/slim` | Use if the team wants a battle-tested "linked particles" preset out of the box and is fine spending 60-90KB gzipped combined (engine + slim bundle + React wrapper) on a decorative effect. tsParticles is Canvas2D-based (not WebGL), actively maintained (v4.4.0), and has a purpose-built "links"/"connect" interactivity mode that is literally this exact visual pattern — lowest implementation risk, highest bundle cost. |
| `motion` (LazyMotion + `domAnimation` feature bundle) | `gsap` 3.15.0 + `@gsap/react` | GSAP became **100% free including all former Club plugins** (ScrollTrigger, SplitText, MorphSVG) after Webflow's April 2025 licensing change — cost is no longer a factor. Core GSAP is smaller (27.3KB gzipped vs `motion`'s 47.6KB full-package gzip). Choose GSAP if the roadmap later wants complex scrubbed/pinned timelines (e.g., a scroll-driven canvas sequence) — it's the stronger tool for orchestration. For this milestone's scope ("scroll-reveal motion" — simple fade/slide triggers), `motion`'s React-native `whileInView` API and built-in `useReducedMotion()` are a better DX fit and avoid mixing two animation libraries. |
| `motion`-driven scroll reveal | Native CSS `animation-timeline: view()` / `scroll()` | Use as a *progressive enhancement layer only*, not the primary mechanism. As of mid-2026, Chrome/Edge 115+ and Safari 26+ (Sept 2025) support it, but Firefox still ships it behind a flag in stable (Firefox 152, June 2026) with only Nightly defaulting it on — global support sits around 84%. Since this project already needs a JS-driven `prefers-reduced-motion` gate for the WebGL/video, and `motion` is already loaded for that, splitting scroll-reveal across `@supports` CSS + a JS fallback adds complexity for no bundle savings. |
| Self-hosted MP4/WebM video | Mux / Cloudflare Stream / Bunny Stream | Revisit if video scope grows well beyond a couple of muted 15-20s ambient loops — e.g., if Micah wants many more clips, adaptive bitrate, or analytics. At that point Bunny Stream is the cheapest per-minute option (no free tier, pay-as-you-go, roughly half Cloudflare's cost) and Cloudflare Stream is simplest if the site ever sits behind Cloudflare's CDN. Mux's 10,000 free minutes/month is the most generous free tier if analytics matter. None of these are worth the added third-party script/CSP surface and recurring cost for the small, muted, decorative clips this milestone describes. |
| Official Calendly widget script via `next/script` | `react-calendly` npm package (4.4.0) | Use `react-calendly` if the site later needs multiple embed *types* (inline widget on a dedicated booking page, popup button, badge widget) with typed React props across several places. For a single sitewide "Book an intro chat" popup trigger, it's simpler and lighter to call `window.Calendly.initPopupWidget()` directly — `react-calendly` is a thin wrapper around the same script and adds its own package weight for functionality this project can replicate in ~15 lines. |
| Tailwind v4 (upgrade now) | Patch v3.3.3 in place (add `colors.primary`/`colors.secondary` to `tailwind.config.js`, delete the dead `@theme inline` block) | Valid *only* as a stopgap if the Node ≥20 CI requirement can't be met immediately. It's a strictly worse long-term choice here because this milestone is already doing a full visual-system overhaul (new palette, frosted-glass cards, display type) — the exact moment to adopt the CSS-native config the codebase is already halfway written for, rather than patch the old JS-config system and create a second migration later. |
| Next.js 16.3.7 | Next.js 15.5.27 | Use 15.5.27 only as a *very short-term* stepping stone if Next 16's static-export nested-route prefetch issue (see Pitfalls/Known Issues below) blocks the upgrade during testing. Next 15's own LTS security window closes 21 Oct 2026, so it is not a durable destination — treat it as "buy a few weeks," not "solved." |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `three.js` / `@react-three/fiber` / `drei` for the hero | ~170KB+ gzipped for `three.js` core alone before any geometry/materials; `@react-three/fiber@9.x`'s peer deps force React ≥19, an unwanted, unrelated major upgrade; directly contradicts the project's own "Out of Scope: Heavy 3D scenes... cost too much performance... don't fit the calm tone" decision. | `ogl` for a hand-rolled shader canvas, or `@paper-design/shaders-react` if a pre-built component is preferred. |
| `framer-motion` (old package name) | Deprecated/renamed — the actively maintained package on npm is now `motion` (import from `motion/react`). Installing `framer-motion` today pulls the same underlying code but under a name that will stop receiving new releases going forward. | `motion` (npm package name `motion`, version 13.4.6). |
| `next export` CLI command | Fully removed as of Next.js 14 — attempting to run it throws an error directing you to `output: 'export'` in `next.config.js`, which this project already uses correctly. Not a live risk here, just worth knowing if any old tutorial/AI suggestion references it. | Keep `output: 'export'` in `next.config.js` (already correct). |
| Free-tier AI video generation for anything shipped to production | Free tiers across Runway/Pika/Kling either block commercial use outright or cap quality/watermark output; terms vary and change quickly. OpenAI's Sora API is shutting down 24 Sept 2026 — do not build any workflow around it. | If stock footage (Coverr/Pexels/Mixkit) doesn't cover a needed shot, use a **paid** tier of Runway (clearest commercial-ownership terms, ~$15/mo) and keep a record of the license/provenance for every clip used, regardless of source. |
| `autoprefixer` alongside Tailwind v4 | v4's Lightning CSS-based pipeline (`@tailwindcss/postcss`) handles vendor prefixing internally — keeping `autoprefixer` in `postcss.config` alongside it is redundant dead weight, the same class of "duplicate config" risk already flagged in `.planning/codebase/CONCERNS.md`. | Remove `autoprefixer` from `package.json` once v4 lands. |
| CSS scroll-driven animations as the *sole* scroll-reveal mechanism | ~84% global browser support in mid-2026 with Firefox stable still behind a flag — real visitors on Firefox or older Safari would see no reveal animation at all (not a graceful degradation, an invisible one, since there's no JS fallback wired up). | `motion`'s `whileInView`, optionally layered with CSS scroll-timeline as a bonus for supporting browsers only. |

## Stack Patterns by Variant

**If the hero shader (mesh gradient + connected nodes) turns out to be too time-consuming to hand-write in `ogl`:**
- Fall back to `@paper-design/shaders-react`'s `MeshGradient` component for the gradient layer, and hand-roll only the connected-nodes overlay as a plain Canvas2D `requestAnimationFrame` loop (no library — this is a well-known, cheap pattern: draw N dots, connect pairs within a distance threshold with faded lines, nudge positions toward/away from cursor).
- Because it's simpler to implement correctly on the first pass, at the cost of ~83KB extra gzipped JS versus the fully hand-rolled path.

**If Next.js 16's static-export nested-route prefetch bug (see below) blocks the CI build after upgrading:**
- Temporarily pin to `next@15.5.27` (still receiving security patches through 21 Oct 2026) and re-attempt the Next 16 upgrade in a follow-up phase once a patch lands.
- Because a short-term stepping stone is safer than shipping a broken production build, but 15.x is not a place to stay long-term.

**If video clip sizes or count grow beyond "a couple of 15-20s ambient loops":**
- Move to Cloudflare Stream or Bunny Stream rather than continuing to bloat `public/videos/` in the static export.
- Because GitHub Pages' CDN (Fastly) has no per-request cost concerns at small scale, but large/many video files bloat every deploy and clone, and a dedicated video CDN adds adaptive bitrate delivery that self-hosted `<video>` tags cannot do.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `next@16.3.7` | `react@^18.2.0`, `react-dom@^18.2.0` | Verified via `npm view next@16.3.7 peerDependencies` — Next 16 does **not** force a React 19 upgrade. Keep `react`/`react-dom` at their current `^18.2.0` pin. |
| `next@16.3.7` | Node.js `>=20.9.0` | Verified via `npm view next@16.3.7 engines`. CI must move off Node 18 before this upgrade — bundle with the Tailwind v4 Node bump. |
| `tailwindcss@4.3.3` | Node.js `>=20` (practical minimum; native Oxide binaries don't ship for 18) | The root package's declared `engines.node` is looser (`>=10`), but the native `@tailwindcss/oxide-*` platform packages only publish binaries for Node 20+, so v4 is non-functional on Node 18 in practice. |
| `@react-three/fiber@9.x` | `react@>=19 <19.4`, `react-dom@>=19 <19.4` | Confirmed via `npm view` — this is the reason r3f is not recommended here; it would force a React 19 upgrade this milestone doesn't otherwise need. `@react-three/fiber@8.x` supports `react@>=18.0` if r3f is ever adopted without a React bump. |
| `motion@13.4.6` | `react@^18.0.0 \|\| ^19.0.0` | Works on the current React 18.2.0 with no changes. |
| `@paper-design/shaders-react@0.0.81` | `react@^18 \|\| ^19` | Works on React 18.2.0. Pre-1.0 versioning (`0.0.x`) — flag as a library still stabilizing its API if adopted. |
| `react-calendly@4.4.0` | `react@>=16.8.0` | Compatible with React 18.2.0 if adopted instead of the official script. |
| Next.js 16 static export + nested App Router routes (e.g. `/about`) | Known open issue, unresolved as of this research | A documented bug (single-source blog report, MEDIUM/LOW confidence) shows Next 16's Cache Components feature generates RSC prefetch payload files at nested paths (`__next/company/__PAGE__.txt`) while the client requests a dot-separated path (`__next.company.__PAGE__.txt`), causing 404s that silently disable prefetching (full page navigation still works — this degrades performance, not correctness). Reported as diverging specifically "on Windows" build environments; this project's CI builds on Ubuntu GitHub Actions runners, so it may not reproduce, but **smoke-test the `/about` route's prefetch behavior after upgrading, before merging.** |

## Sources

- npm registry (`npm view <pkg> version/peerDependencies/engines`) — HIGH confidence, live data pulled during this research for: `motion`, `gsap`, `ogl`, `@react-three/fiber` (v8 and v9), `three`, `tailwindcss`, `@tailwindcss/postcss`, `next` (14/15/16 lines), `react-calendly`, `@paper-design/shaders-react`, `tsparticles`/`@tsparticles/react`/`@tsparticles/slim`.
- Bundlephobia API (`bundlephobia.com/api/size?package=...`) — HIGH confidence, live gzip measurements for `ogl@1.0.11` (34,177 B), `motion@13.4.6` (47,603 B), `gsap@3.15.0` (27,350 B), `@paper-design/shaders-react@0.0.81` (82,958 B).
- [endoflife.date/nextjs](https://endoflife.date/nextjs) — HIGH confidence, Next.js 14 EOL 26 Oct 2025, Next.js 15 LTS support ends 21 Oct 2026, Next.js 16 current LTS.
- [tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide) and multiple 2026 migration write-ups (digitalapplied.com, buildmvpfast.com, designrevision.com) — MEDIUM-HIGH confidence, cross-verified across sources for v3→v4 breaking changes and the `@tailwindcss/upgrade` codemod.
- [GitHub tailwindlabs/tailwindcss issue #20491 / PR #20497](https://github.com/tailwindlabs/tailwindcss) — MEDIUM confidence, community discussion confirming the Node ≥20 practical requirement for v4's native Oxide binaries.
- [nextjs.org/docs/app/guides/upgrading/version-16](https://nextjs.org/docs/app/guides/upgrading/version-16), [nextjs.org/blog/next-16](https://nextjs.org/blog/next-16) — HIGH confidence, official Next 16 migration/breaking-change documentation.
- [blog.axiorema.com — "Uncurious case of broken static exports and 404's in Next.js 16"](https://blog.axiorema.com/engineering/uncurious-case-broken-static-exports-404s-nextjs-16/) — LOW-MEDIUM confidence, single source, not corroborated by an official Next.js issue/changelog in this research pass. Flagged as a pre-merge smoke-test item, not a blocker.
- [github.com/oframe/ogl](https://github.com/oframe/ogl), [Hacker News discussion of OGL](https://news.ycombinator.com/item?id=41501241) — MEDIUM confidence on OGL's modular Core/Math/Extras tree-shaking behavior (community-reported, not independently re-measured with a custom tree-shaken build in this research pass).
- [github.com/jordienr/whatamesh](https://github.com/jordienr/whatamesh), [github.com/exzenter/gradient-stripe](https://github.com/exzenter/gradient-stripe) — MEDIUM confidence, open-source reference GLSL implementations of the Stripe-style mesh gradient effect, usable as an adaptation base for the hand-rolled `ogl` shader (both zero-dependency, pure WebGL/GLSL).
- [motion.dev/docs/gsap-vs-motion](https://motion.dev/docs/gsap-vs-motion), [gsap.com/pricing](https://gsap.com/pricing/) and multiple 2026 comparison posts — MEDIUM-HIGH confidence, cross-verified GSAP's April 2025 move to fully free licensing (including ScrollTrigger).
- [particles.js.org](https://particles.js.org/) (tsParticles official docs) — MEDIUM confidence on bundle composition; exact combined gzip figure for `@tsparticles/react` + `@tsparticles/slim` + `@tsparticles/engine` was not independently measured via Bundlephobia in this pass (rate-limited) — figure quoted is a reasoned estimate from documented per-bundle sizes, not a direct measurement.
- WebSearch (Coverr, Pexels, Mixkit license pages; AI video generator commercial-terms roundups) — MEDIUM confidence, cross-verified across 2-3 independent 2026 roundup articles per claim; individual clip licenses on Mixkit should still be spot-checked per the project owner's own due diligence before publishing.

---
*Stack research for: WebGL hero + ambient video + motion + Calendly additions to mvforster-talent-solutions*
*Researched: 2026-09-29*

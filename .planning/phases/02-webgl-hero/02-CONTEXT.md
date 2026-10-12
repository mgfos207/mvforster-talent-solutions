# Phase 2: WebGL Hero - Context

**Gathered:** 2026-10-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the static office-photo hero (`src/components/sections/Hero.tsx`) with a client-side `ogl` WebGL background. The background is a slow mesh-gradient shader in the navy/teal/coral palette with a subtle connected-nodes network that reacts to the cursor or touch. This phase also delivers:
- a static fallback with no layout shift
- a keyboard-accessible pause/play control (WCAG 2.2.2)
- an "I'm hiring" / "I'm looking for work" audience chooser
- offscreen and hidden-tab render pausing
- recovery from WebGL context loss

Covers HERO-01..06. The Calendly CTA, the real Employers/Candidates sections, ambient video, and the full visual system (display type, glass cards site-wide, scroll motion) belong to Phases 3–4.

</domain>

<decisions>
## Implementation Decisions

### Motion & network feel
- **D-01:** The gradient is **navy-dominant with teal currents and small warm coral glints**. Coral stays scarce so it remains special for the Phase 3 CTA. White hero text must keep WCAG AA contrast over every part of the gradient, so the navy base must stay dark enough behind the text block.
- **D-02:** Gradient motion is **very slow and barely noticeable**, about 20–30s per full color cycle. It should read as "alive", never as attention-grabbing.
- **D-03:** The connected-nodes network is **subtle**: about 30–60 small, low-opacity nodes with faint connecting lines on desktop, and fewer on mobile/small viewports. It should hint at "connecting people" without looking like a tech startup.
- **D-04:** Pointer interaction uses **gentle attraction plus line highlighting**. Nearby nodes drift slightly toward the cursor and their connecting lines brighten. On touch devices, tap and drag do the same at the touch point, then the nodes ease back. The interaction must never block page scroll on mobile (passive listeners, no `preventDefault` on touch).

### Fallback look
- **D-05:** The static fallback is a **pre-rendered still of the actual shader and network**. Use a compressed WebP/AVIF image of roughly 30–60KB, captured from the real gradient so it looks like the animation frozen. It is the server-rendered and first-paint state and the LCP-safe background, and it's what devices with `canAnimateHero === false` keep.
- **D-06:** When WebGL is ready, the canvas **crossfades in over the still across ~600–1000ms**, with no flash or pop. On WebGL context loss (HERO-06), the canvas is removed or hidden and the still shows again.
- **D-07:** **Stop using `public/office-bg.jpg` on the hero** and remove its import. Leave the file in `public/`. Phase 4 cleanup deletes it if nothing else references it.

### Audience chooser (HERO-05)
- **D-08:** The buttons link to the **final anchors `#employers` and `#candidates` now**. Until Phase 3 builds the real sections, add `id="employers"` to the closest existing section (Services) and `id="candidates"` to Expertise. Phase 3 moves the ids to the real sections, and the hero buttons never change. Existing ids (`#services`, `#expertise`) used by the Header nav must keep working. Use a wrapper or an inner element so you don't break them.
- **D-09:** The buttons are **two equal-weight, side-by-side glass/frosted pill buttons**: a translucent fill over the gradient, high-contrast text, and a visible focus ring. They stack vertically on mobile. They use **no coral**, which is reserved for the Calendly CTA.
- **D-10:** Behavior is **plain anchor links with smooth scroll only**. They work without JS. Scrolling is instant when `prefers-reduced-motion` is on (e.g. `scroll-behavior: smooth` gated by a motion media query). Account for the fixed header height with `scroll-margin-top`. Don't store or persist the audience choice.
- **D-11:** **Reserve layout room for the Phase 3 coral "Book an intro chat" CTA** next to or under the chooser, so Phase 3 can drop it in without redesigning the hero. Don't build the CTA in this phase.

### Hero copy & pause control
- **D-12:** **Rewrite the hero headline and subline for healthcare focus** now. The audience is healthcare, behavioral health (BCBA/RBT), and healthcare admin. The tone should be calm, warm, and human. Remove "technology" and "innovative companies". Claude drafts 2–3 headline+subline options and puts them in the plan for user review before implementation.
- **D-13:** The pause/play control is a **small round glass button in the bottom-right corner of the hero**. It shows a pause/play icon, has a dynamic `aria-label` ("Pause background animation" / "Play background animation") and `aria-pressed` or an equivalent state, is keyboard-focusable with a visible focus ring, and meets a ≥ 24×24px target size. It only renders (or is only enabled) when the animation is actually running, so there's no dead control in the static fallback.
- **D-14:** **Paused means freeze the current frame.** Stop the render loop (no rAF, zero GPU work), and the canvas holds its last frame. Don't crossfade back to the still.
- **D-15:** **The pause state doesn't persist.** It resets on every page load, consistent with Phase 1 D-13 (no localStorage motion persistence).

### Carried forward (locked in Phase 1 / project init)
- `ogl` is the WebGL library. Don't use three.js or R3F, because R3F forces React 19 and the project is on React 18.
- The only gate is `useCapabilities().canAnimateHero` (`src/providers/CapabilitiesProvider.tsx`). The server render and first paint are always static (Phase 1 D-16), and the hero reacts live to verdict changes, e.g. the OS reduced-motion setting flipping mid-visit (D-15).
- Use the semantic tokens from `src/app/globals.css` `@theme` (`brand` #0B2545, `brand-strong` #071A33, `accent` #0F766E, `cta` #E76F51, `on-brand`). The shader colors must be sourced from or match these values.
- The WebGL/ogl JS must not block first paint. Use a lazy client-only boundary (dynamic import), with mobile Lighthouse ≥ 90 and LCP ≤ 2.5s.

### Claude's Discretion
- Exact shader approach (Whatamesh/Stripe-style mesh gradient adaptation vs custom noise), node count per breakpoint, line distance thresholds, attraction strength and easing.
- Whether nodes are drawn in the same ogl program/pass or a second pass.
- Mobile frame-rate cap / DPR clamp (e.g. clamp devicePixelRatio to ≤ 1.5–2) for perf.
- How the still image is produced (script that renders the shader headlessly vs a manual capture), plus file format and whether to ship separate mobile and desktop stills.
- Hero height (keep `h-screen` vs `min-h-[90svh]` etc.), as long as there's no CLS.
- Component and file structure (e.g. `HeroBackground` client component + `useHeroRenderer` hook, files under `src/components/hero/`).
- Whether to add a runtime FPS probe that downgrades janky devices to the still. This was deferred from Phase 1, so revisit it only if the heuristics let janky devices through during testing.
- Pause icon implementation (inline SVG preferred, no icon library).

</decisions>

<specifics>
## Specific Ideas

- Visual reference: Stripe's animated mesh-gradient homepage plus Linear's crisp typography, warmed up for healthcare. Calm, trustworthy, and human, not techy or flashy (PROJECT.md).
- The ROADMAP research flag says to **spike a small `ogl` reference adaptation first** (Whatamesh/gradient-stripe pattern) and verify tree-shaking and bundle size before building the full render loop.
- The node network metaphor is "connecting people" (recruiting), not "data/tech".
- The fallback still should look the same as the animation frozen, so the crossfade is nearly imperceptible.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 2: WebGL Hero": goal, success criteria 1–5, and the `ogl` spike research flag
- `.planning/REQUIREMENTS.md`: HERO-01..HERO-06 (lines ~22–27)
- `.planning/PROJECT.md`: core value (Calendly booking must not be hindered), constraints (static export, perf budget, a11y), and the visual direction

### Prior decisions
- `.planning/phases/01-foundation/01-CONTEXT.md`: D-01..D-04 (semantic tokens), D-12..D-16 (capability check rules, live subscription, SSR-static default), D-13 (no persisted motion toggle)

### Codebase maps
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONVENTIONS.md`: section/component conventions and the `@/` alias

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/providers/CapabilitiesProvider.tsx` → `useCapabilities()` returns `{ canAnimateHero, canPlayVideo, canAnimateScroll, signals }`. This is the single gate for the hero animation.
- `src/lib/capabilities.ts` (`deriveVerdicts`, `STATIC_VERDICTS`) + `scripts/capabilities.test.mjs`: the test pattern (node `--test` with `--experimental-strip-types`) can be extended for any pure hero logic (e.g. node layout math).
- `src/app/globals.css` `@theme`: color tokens to feed into the shader uniforms.
- `src/hooks/useCapabilitySignals.ts`: example of a client hook pattern already in the repo.

### Established Patterns
- Sections are server components under `src/components/sections/` and are composed by `src/app/page.tsx`. Keep `Hero.tsx` as a server component that renders the copy, chooser, and still, and mounts a small client island for canvas + pause.
- Semantic Tailwind utilities only (`bg-brand`, `text-on-brand`). No `dark:` classes.
- `next/image` with `images.unoptimized` (static export). The still can use `next/image` with `priority`, or a CSS background. Pick whichever gives the best LCP.

### Integration Points
- `src/components/sections/Hero.tsx`: rewrite target.
- `src/components/sections/Services.tsx` (`id="services"`) and `Expertise.tsx` (`id="expertise"`): add the interim `#employers` / `#candidates` anchors (D-08).
- `src/components/Header.tsx`: the fixed header height determines `scroll-margin-top`.
- `package.json`: add the `ogl` dependency (pin per the Phase 1 supply-chain practice).

</code_context>

<deferred>
## Deferred Ideas

- **Site metadata still says "Technical Recruitment Specialist / technology companies"** (`src/app/layout.tsx`). That's an SEO/copy fix for Phase 4 (QUAL/SEO), not hero scope.
- **Remembering the audience choice to tailor later copy:** a new capability, not in v1.
- **Deleting `public/office-bg.jpg`:** Phase 4 cleanup, once confirmed unused.
- **Runtime FPS probe:** still deferred (Claude's discretion to add only if testing shows a need).

</deferred>

---

*Phase: 02-webgl-hero*
*Context gathered: 2026-10-11*

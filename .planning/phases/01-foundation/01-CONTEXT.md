# Phase 1: Foundation - Context

**Gathered:** 2026-10-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Get the site onto current tooling (Node ≥ 20 in CI, Next.js 16 static export, Tailwind v4) and fix the broken design tokens. Remove dead or duplicate config and page files so only one effective file of each kind remains. Split the Home and About pages into section components. Build one shared capability check that the hero, video, and motion features (Phases 2–4) will read. Requirements: FOUND-01..05 and CAP-01.

Not in this phase: the WebGL hero, ambient video, Calendly CTAs, How-it-works content, scroll motion, and any layout or content redesign. `/goals` and `public/family/` stay untouched.

</domain>

<decisions>
## Implementation Decisions

### Brand tokens & theme
- **D-01:** Define the **new navy/teal/coral palette** in the Tailwind v4 `@theme` during Phase 1. Don't just repair today's greens. After Phase 1 the live site shows the new colors on the existing layout. This pulls the palette part of CONT-01 forward. Display typography, frosted-glass cards, and the rest of the visual system stay in Phase 4.
- **D-02:** **Drop automatic dark mode.** Ship a single designed theme. Remove the `@media (prefers-color-scheme: dark)` block in `globals.css` and every `dark:` class (about 61 across `page.tsx` and `about/page.tsx`) while extracting sections.
- **D-03:** Claude proposes the exact hex values for navy, teal, coral, and neutrals. Every text/background pair used must pass a **WCAG AA** check (4.5:1 for body text, 3:1 for large text and UI). Put the proposed palette and contrast results in the plan for the user to review.
- **D-04:** Name tokens **semantically**, e.g. `surface`, `ink`, `ink-muted`, `brand`, `accent`, `cta`, `border`. Components use only semantic utilities (`bg-surface`, `text-ink`, `bg-cta`), so later phases can retune shades without renaming classes.

### Refactor fidelity
- **D-05:** The section split keeps **the same content, order, and layout as today**. The only visual changes are the new token colors and removing dark mode. Don't merge, reorder, or rewrite sections. That happens in Phases 2–4.
- **D-06:** **Delete all commented-out JSX**: the hero CTA buttons block, the "Talent Assessment" card, and the "Jobs" nav link in `Header.tsx`. Don't restore any of it.
- **D-07:** **Split the About page too**, not just Home. About's Hero, Experience, Skills & Expertise, and Education each become their own section component, and `about/page.tsx` only composes them.
- **D-08:** Home's `page.tsx` only composes its sections: Hero, Services, Expertise, WhyChooseUs, Contact.

### Upgrade & ship strategy
- **D-09:** **Merge Phase 1 to `main` and deploy it live** when the phase is done. Don't hold everything on the feature branch until the end of the milestone. That makes the real-domain check (`/` and `/about` load and navigate on mvforster.com, no `basePath`, CNAME still works) part of verifying this phase.
- **D-10:** Upgrade **in steps, verifying each one**: Node in CI first, then Tailwind v4, then Next.js 16. Run `npm ci && npm run build` and check `out/` after each step, so any breakage points to a single change. npm stays canonical and `package-lock.json` is regenerated.
- **D-11:** Do the prefetch smoke test (nested-route navigation `/` ↔ `/about` on the static export) right after the Next 16 step, before section extraction builds on top of it.

### Capability check (CAP-01)
- **D-12:** The static fallback triggers on **explicit signals plus light heuristics**:
  - `prefers-reduced-motion: reduce`
  - no WebGL support
  - Save-Data on, or `effectiveType` of 2G / slow-2G
  - `navigator.deviceMemory ≤ 2`
  - `navigator.hardwareConcurrency ≤ 2`

  Missing APIs (e.g. Safari has no `deviceMemory`) count as "unknown, not low-end." iOS Low Power Mode can't be detected. Phase 3 video handles it by failing autoplay gracefully, not through this check.
- **D-13:** **No site-wide override or toggle.** Rely on the OS setting plus the per-feature pause controls (HERO-04, VID-04 in later phases). Don't add a setter or localStorage persistence.
- **D-14:** The provider exposes **per-feature verdicts**, e.g. `canAnimateHero`, `canPlayVideo`, `canAnimateScroll`, plus the raw signals for debugging. The rule for which signals block which feature lives only in the provider, so features can't disagree.
- **D-15:** **Subscribe to live changes.** Use `matchMedia` change listeners for reduced motion, and connection change where available, so animation stops immediately when the visitor changes the OS setting mid-visit.
- **D-16:** SSR and first render default conservatively: every verdict is false (static) and upgrades only after client-side detection. Server-rendered HTML always shows the static state. This is carried forward from the research architecture.

### Claude's Discretion
- **Typography:** Claude decides how far to go in Phase 1. At minimum, fix the broken font wiring: `--font-sans` points at nonexistent Geist variables, `layout.tsx` loads Inter, and `body` falls back to Arial. Claude may also lock a display typeface now if it fits cleanly. Otherwise display type is chosen in Phase 4.
- **Folder layout for sections:** `sections/home/*` + `sections/about/*` with an optional `components/ui/`, or a flat `sections/` folder. Claude picks. Prefer the `@/` import alias everywhere.
- **Next 16 prefetch fallback:** if the smoke test reproduces the bug, Claude picks between dropping to Next 15.5.x (amending FOUND-02 and noting the deferred upgrade) and a clean workaround on 16 (e.g. `prefetch={false}` or a `trailingSlash` config). The deciding factor is whichever passes the smoke test with the least hackery.
- **Node version:** Claude picks the exact version. It must be ≥ 20. Node 20 reached EOL in April 2026, so prefer an active or maintenance LTS (22 or 24). Claude also decides whether to add `.nvmrc` and an `engines` field so local matches CI.
- **Provider API naming:** exact hook and verdict names, and the file locations for `CapabilitiesProvider` and hooks.
- **Where the effective Tailwind config lives after v4:** CSS-first `@theme` in `globals.css` + `postcss.config.mjs` with `@tailwindcss/postcss` is expected. Delete the leftover JS/TS Tailwind configs if v4 doesn't need them.

</decisions>

<specifics>
## Specific Ideas

- Visual direction is carried from PROJECT.md: "calm, premium, human." It combines Stripe's mesh-gradient homepage with Linear's crisp typography, warmed up for healthcare. The palette choice in D-03 should read trustworthy and warm, not techy.
- The navy hero (Phase 2) is the dark anchor of the page. A single light-surface theme for content sections, with navy as the brand and hero color, fits the decision to drop dark mode.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope & requirements
- `.planning/PROJECT.md` — Core value, constraints (static export, no `basePath`, npm canonical, perf/a11y budgets), Key Decisions table
- `.planning/REQUIREMENTS.md` — FOUND-01..05, CAP-01 acceptance wording
- `.planning/ROADMAP.md` § Phase 1 — success criteria and the Next 16 prefetch research flag

### Research (stack, architecture, pitfalls)
- `.planning/research/SUMMARY.md` — Upgrade rationale (Node ≥20 blocker, Tailwind v4, Next 16 vs 15.5.x fallback), CapabilitiesProvider pattern
- `.planning/research/STACK.md` — Version targets and upgrade notes
- `.planning/research/ARCHITECTURE.md` — Target structure (`components/sections/*`, `CapabilitiesProvider` + `useCapabilities`/`useIntersection`/`usePageVisibility`, SSR-safe defaults)
- `.planning/research/PITFALLS.md` — Tailwind v3/v4 token bug, static-export gotchas, basePath/CNAME footguns

### Existing codebase maps
- `.planning/codebase/STACK.md` — Which duplicate config file is actually in effect today and why
- `.planning/codebase/CONCERNS.md` — Broken tokens, dead files, config footguns
- `.planning/codebase/STRUCTURE.md` / `.planning/codebase/ARCHITECTURE.md` — Current section boundaries in `page.tsx` / `about/page.tsx`
- `.planning/codebase/CONVENTIONS.md` — Naming, `@/` alias, JSX section-marker comments

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/Header.tsx`: the only shared component. It stays, gets the new tokens, and loses the commented "Jobs" link. Phase 3 adds the booking CTA to it later.
- `src/app/globals.css`: already contains v4-style `@theme inline` and `:root` vars. Under Tailwind v4 this becomes the real token source. Replace the values with the new semantic palette and remove the dark-mode block.
- `src/app/layout.tsx`: loads Inter via `next/font/google`. This is where `CapabilitiesProvider` mounts and where the font variable gets wired.

### Established Patterns
- Pages are monolithic server components with `{/* X Section */}` markers that map 1:1 to extraction targets. Home has Hero, Services, Expertise, Why Choose Us, and Contact. About has Hero, Experience, Skills & Expertise, and Education.
- Default-exported PascalCase components, inline prop types, Tailwind utilities inline. Section components stay server components. Only the capability provider and hooks are `'use client'`.

### Integration Points
- CI: `.github/workflows/nextjs.yml` pins Node 18 and runs `npm ci && npm run build`, then uploads `./out`. Bump Node here.
- Effective config: `next.config.js` (`output: 'export'`, `images.unoptimized`, no `basePath`). Keep this one and delete `next.config.ts` and `next.config.jsold`.
- Files to remove: `next.config.ts`, `next.config.jsold`, the duplicate `tailwind.config.*` / `postcss.config.*`, `src/app/page.tsx.bak`, `src/app/page.tsx.new`, `.github/workflows/.nextoldyml`, and the untracked `pnpm-lock.yaml` / `pnpm-workspace.yaml`. Also remove the unused boilerplate SVGs in `public/` if no page references them.

</code_context>

<deferred>
## Deferred Ideas

- **Site-wide "Reduce motion" toggle with persistence:** rejected for v1 (D-13). Revisit only if visitor feedback asks for it.
- **Runtime FPS probe for low-end detection:** not chosen. Revisit in Phase 2 if heuristics let janky devices through.
- **Restructuring sections into Employers / Candidates / How it works:** belongs to Phase 3 (CONT-02/03, VID-01/02).

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-10-02*

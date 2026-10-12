# Phase 1: Foundation - Research

**Researched:** 2026-10-02
**Domain:** Next.js/Tailwind/Node tooling upgrade + static-export config hygiene + section componentization + browser capability detection, on an existing static-exported Next.js 14 marketing site deployed to GitHub Pages with a custom domain
**Confidence:** HIGH for versions/EOL/peer-deps/registry data (verified live against npm registry and official GitHub issues during this session). MEDIUM for the Next.js 16 static-export prefetch bug's practical impact on this project specifically (root cause confirmed, but no official fixed-version number yet — mitigated by the fact this project's CI/dev environment doesn't match the bug's trigger condition, see Pitfall 1).

## Summary

This phase is a tooling-and-structure phase, not a feature phase: no new user-facing behavior ships except the brand-color fix and (per CONTEXT.md D-01) the new palette. The work is three sequential upgrades (Node → Tailwind v4 → Next 16, each verified independently per D-10), a dead-file cleanup, a mechanical section extraction that preserves content/order/layout (D-05), and a small, self-contained `CapabilitiesProvider` that later phases will read but this phase does not consume. All of the libraries involved (`next`, `tailwindcss`, `@tailwindcss/postcss`) are official, high-trust packages already verified by `slopcheck` this session — there is no "don't hand-roll" risk from unfamiliar third-party packages in this phase.

The single genuine open risk is the Next.js 16 static-export RSC-prefetch-404 bug tracked upstream as [vercel/next.js#85374](https://github.com/vercel/next.js/issues/85374). It is confirmed **root-caused and Windows-specific** (an unnormalized `path.relative()` backslash in the static export's segment-cache-file writer) and is **still open** as of this research date, with an unmerged fix ([PR #99058](https://github.com/vercel/next.js/pull/99058)). This project's CI runs on `ubuntu-latest` and local dev is WSL2 (Linux paths) — neither matches the bug's trigger condition, which lowers the practical risk from "likely to reproduce" to "defense in depth only." D-11's smoke test is still the correct move; this research adds the specific repro mechanism to check for and confirms Next 15.5.x as a safe, documented fallback if it somehow does reproduce.

**Primary recommendation:** Upgrade Node → 22 (matches current local dev, Maintenance LTS until Apr 2027), then Tailwind v4.3.3 + `@tailwindcss/postcss` (rewrite `globals.css` to v4 `@import "tailwindcss"` syntax, delete the dead JS/TS Tailwind/PostCSS configs), then Next.js 16.3.8 (official codemod + manual verification), each with its own `npm ci && npm run build` checkpoint — then extract sections, delete dead files, and build `CapabilitiesProvider` last since nothing in this phase consumes it yet.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Define the new navy/teal/coral palette in the Tailwind v4 `@theme` during Phase 1 (not just repair today's greens). After Phase 1 the live site shows the new colors on the existing layout. Display typography, frosted-glass cards, and the rest of the visual system stay in Phase 4.
- **D-02:** Drop automatic dark mode. Remove the `@media (prefers-color-scheme: dark)` block in `globals.css` and every `dark:` class (~61 occurrences across `page.tsx` and `about/page.tsx`) while extracting sections.
- **D-03:** Claude proposes exact hex values for navy, teal, coral, and neutrals. Every text/background pair used must pass WCAG AA (4.5:1 body text, 3:1 large text/UI). Put the proposed palette and contrast results in the plan for user review.
- **D-04:** Name tokens semantically: `surface`, `ink`, `ink-muted`, `brand`, `accent`, `cta`, `border`. Components use only semantic utilities (`bg-surface`, `text-ink`, `bg-cta`).
- **D-05:** The section split keeps the same content, order, and layout as today. Only visual changes are new token colors and removing dark mode. Don't merge, reorder, or rewrite sections.
- **D-06:** Delete all commented-out JSX: hero CTA buttons block, "Talent Assessment" card, "Jobs" nav link in `Header.tsx`. Don't restore any of it.
- **D-07:** Split the About page too. About's Hero, Experience, Skills & Expertise, and Education each become their own section component.
- **D-08:** Home's `page.tsx` only composes: Hero, Services, Expertise, WhyChooseUs, Contact.
- **D-09:** Merge Phase 1 to `main` and deploy it live when done — don't hold on the feature branch. The real-domain check (`/` and `/about` load and navigate on mvforster.com, no `basePath`, CNAME works) is part of verifying this phase.
- **D-10:** Upgrade in steps, verifying each: Node in CI first, then Tailwind v4, then Next.js 16. Run `npm ci && npm run build` and check `out/` after each step. npm stays canonical; `package-lock.json` is regenerated.
- **D-11:** Do the prefetch smoke test (nested-route navigation `/` ↔ `/about` on the static export) right after the Next 16 step, before section extraction builds on top of it.
- **D-12:** The static fallback triggers on explicit signals plus light heuristics: `prefers-reduced-motion: reduce`; no WebGL support; Save-Data on or `effectiveType` 2G/slow-2G; `navigator.deviceMemory <= 2`; `navigator.hardwareConcurrency <= 2`. Missing APIs count as "unknown, not low-end." iOS Low Power Mode can't be detected (Phase 3 handles it via autoplay-failure fallback, not this check).
- **D-13:** No site-wide override or toggle. Rely on the OS setting plus per-feature pause controls (HERO-04, VID-04, later phases). No setter, no localStorage persistence.
- **D-14:** The provider exposes per-feature verdicts (`canAnimateHero`, `canPlayVideo`, `canAnimateScroll`) plus raw signals for debugging. The feature-to-signal mapping rule lives only in the provider.
- **D-15:** Subscribe to live changes via `matchMedia` change listeners (reduced motion) and connection-change where available, so animation stops immediately on a mid-visit OS setting change.
- **D-16:** SSR and first render default conservatively — every verdict is `false` until client-side detection upgrades it. Server-rendered HTML always shows the static state.

### Claude's Discretion

- **Typography:** At minimum fix the broken font wiring (`--font-sans` points at nonexistent Geist variables; `layout.tsx` loads Inter via `--font-inter`; `body` hardcodes `font-family: Arial, Helvetica, sans-serif`, so Inter never actually applies today). May lock a display typeface now if it fits cleanly; otherwise deferred to Phase 4.
- **Folder layout for sections:** `sections/home/*` + `sections/about/*`, optional `components/ui/`, or a flat `sections/` folder. Prefer `@/` import alias everywhere.
- **Next 16 prefetch fallback:** if the smoke test reproduces the bug, choose between dropping to Next 15.5.x (amend FOUND-02, note deferred upgrade) or a workaround on 16 (`prefetch={false}` or `trailingSlash`). Pick whichever passes the smoke test with the least hackery.
- **Node version:** must be >=20. Node 20 reaches EOL April 2026 — prefer 22 or 24.
- **Provider API naming:** exact hook/verdict names and file locations for `CapabilitiesProvider` and hooks.
- **Effective Tailwind config location after v4:** CSS-first `@theme` in `globals.css` + `postcss.config.mjs` with `@tailwindcss/postcss` is expected; delete leftover JS/TS Tailwind configs if v4 doesn't need them.

### Deferred Ideas (OUT OF SCOPE)

- Site-wide "Reduce motion" toggle with persistence — rejected for v1 (D-13).
- Runtime FPS probe for low-end detection — not chosen; revisit in Phase 2 if heuristics let janky devices through.
- Restructuring sections into Employers/Candidates/How-it-works — belongs to Phase 3 (CONT-02/03, VID-01/02).
- WebGL hero, ambient video, Calendly CTAs, How-it-works content, scroll motion, any layout/content redesign — all Phases 2-4.
- `/goals` and `public/family/` — stay untouched (separate, user-decided, out of this entire milestone).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | CI builds/deploys from Node >=20 to mvforster.com, no `basePath` | Node LTS research (below); current workflow confirmed pinned to Node 18 at `.github/workflows/nextjs.yml:19` |
| FOUND-02 | Next.js 16 static export; `/` and `/about` load and navigate correctly on deployed site | Stack research + live verification of `next@16.3.8` peer deps/engines; Pitfall 1 (prefetch bug) fully root-caused and scoped to this project's risk profile |
| FOUND-03 | Tailwind v4; brand tokens render visibly on every page | Confirmed via Tailwind CLI compile audit (codebase/CONCERNS.md) that tokens render zero CSS today; v4 install/config pattern verified below |
| FOUND-04 | Dead config/page files removed; single canonical file of each kind | Exact file inventory confirmed by direct read in this session (next.config.*, tailwind.config.*, postcss.config.*, page.tsx.bak/.new, .nextoldyml, pnpm files) |
| FOUND-05 | Each home-page section its own component under `src/components/sections/` | Section boundaries confirmed by direct read of `page.tsx`/`about/page.tsx`; Pattern 1 below |
| CAP-01 | Shared capability check (WebGL, reduced-motion, data-saver/low-power) ready for Phases 2-4 | `CapabilitiesProvider` pattern from project research (ARCHITECTURE.md), adapted to D-12 through D-16 |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CI build/deploy pipeline (FOUND-01) | Build tooling (GitHub Actions) | — | Node version is a CI runner concern; no app-tier code involved |
| Static export routing (FOUND-02) | Build tooling (Next.js compiler) | Browser/Client (prefetch/navigation at runtime) | Next's static export is a build-time concern; the prefetch bug manifests client-side at navigation time, so both tiers matter for verification |
| Design tokens (FOUND-03) | Browser/Client (CSS delivered to browser) | Build tooling (Tailwind compiler resolves `@theme` at build time) | Tokens are CSS custom properties resolved at build, consumed at render/paint time |
| Config/file hygiene (FOUND-04) | Build tooling | — | Config file resolution happens entirely at build/tooling level, no runtime tier |
| Section componentization (FOUND-05) | Browser/Client via Frontend Server (SSR) | — | Sections are React Server Components rendered server-side at build time (static export) and shipped as static HTML; no client JS needed for this requirement alone |
| Capability detection (CAP-01) | Browser/Client | Frontend Server (SSR) provides conservative default | WebGL/matchMedia/connection APIs only exist in the browser; SSR must emit a safe default per D-16 since static export has no per-request server |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| `next` | 16.3.8 | App Router framework, static export builder | [VERIFIED: npm registry] Current stable; `npm view next engines` confirms `{ node: '>=20.9.0' }`; `npm view next peerDependencies` confirms `react`/`react-dom` `^18.2.0 \|\| ^19.0.0` — no forced React 19 bump. Next 14 is EOL (Oct 2025); Next 15's security window closes ~Oct 21 2026. |
| `tailwindcss` | 4.3.3 | Utility CSS engine | [VERIFIED: npm registry] Current stable (published 2026-07-16 per `npm view tailwindcss time`). `globals.css` already contains v4-only `@theme inline` syntax that is a silent no-op under the installed v3.3.3 — upgrading makes it function as intended. |
| `@tailwindcss/postcss` | 4.3.3 | PostCSS plugin for Tailwind v4 | [VERIFIED: npm registry] Published 2026-09-30. Replaces the `tailwindcss` PostCSS plugin entry from v3; v4 auto-prefixes internally so standalone `autoprefixer` becomes redundant. |

**Node.js:** 22.x (Maintenance LTS, EOL Apr 2027) — [CITED: endoflife.date/nodejs, cross-verified via WebSearch 2026-10-02] Recommended over Node 24 because local dev is already on `v22.23.2` (confirmed via `node --version` this session) — matching CI to local dev eliminates a "works on my machine" class of bug for the remaining 3 project phases. Node 24 (Active→Maintenance transition Oct 20 2026, EOL Apr 2028) is a valid alternative with a longer runway; either satisfies the `>=20.9.0`/`>=20` floors from Next 16 and Tailwind v4. **This is Claude's-discretion territory per CONTEXT.md — present both options to the user in the plan, recommend 22.**

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `npx @next/codemod@canary upgrade latest` | n/a (CLI, not installed) | Automated Next 14→16 migration | Run once during the Next 16 step; handles the sync-to-async `params`/`searchParams` API removal and other mechanical renames. [CITED: nextjs.org/docs/app/guides/upgrading/version-16] |
| `npx @tailwindcss/upgrade` | n/a (CLI, not installed) | Automated Tailwind v3→v4 class-rename codemod | Run once during the Tailwind step; handles ~90% of mechanical renames (`flex-shrink-0`→`shrink-0`, etc.) per Tailwind's own upgrade guide. [CITED: tailwindcss.com/docs/upgrade-guide] This project's actual class usage is simple (no `flex-shrink-0`/`bg-gradient-to-r` patterns found in a grep of `page.tsx`/`about/page.tsx`/`Header.tsx`), so the codemod's main value here is the `@theme`/`@import` rewrite, not bulk class renames — verify its output rather than assume it's a no-op. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Next.js 16.3.8 | Next.js 15.5.x | Only if the D-11 smoke test reproduces the prefetch bug despite the Ubuntu-CI/WSL2-dev mismatch with the bug's Windows-specific trigger. Next 15's security window closes ~Oct 21 2026 — a short-term stepping stone, not a destination. Document as FOUND-02 amendment if chosen. |
| Node 22 | Node 24 | Node 24 is the current Active LTS (transitioning to Maintenance Oct 20 2026) with a longer EOL runway (Apr 2028 vs Apr 2027) but doesn't match the already-installed local dev version (22.23.2), so choosing 24 reintroduces a local/CI version mismatch that didn't exist before this phase. |
| `@tailwindcss/upgrade` automated codemod | Manual `@theme` rewrite | The codebase's actual Tailwind usage is small and already written in close-to-v4 syntax (`@theme inline` block exists, just inert) — a manual rewrite of `globals.css` plus deleting the JS configs may be faster and more auditable than running a codemod against a ~3-file, <50-line Tailwind surface. Either is reasonable; the codemod is the officially documented path. |

**Installation:**
```bash
# Step 1 (CI only, no local install needed): bump node-version in .github/workflows/nextjs.yml to '22'
# Optionally add .nvmrc with "22" to match

# Step 2: Tailwind v4
npm install -D tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3
npm uninstall autoprefixer
# Delete tailwind.config.js, tailwind.config.ts, postcss.config.js (or .mjs — keep exactly one, rewritten for v4)

# Step 3: Next.js 16
npm install next@16.3.8
npx @next/codemod@canary upgrade latest   # optional, review diff before accepting
```

**Version verification:** All three packages verified live this session via `npm view <pkg> version/engines/peerDependencies/time` against the public npm registry on 2026-10-02. `next@16.3.8` published with `engines: { node: '>=20.9.0' }` and peer deps keeping React at `^18.2.0 || ^19.0.0`. `tailwindcss@4.3.3` published 2026-07-16; `@tailwindcss/postcss@4.3.3` published 2026-09-30.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `next` | npm | 9+ yrs (Vercel) | very high | github.com/vercel/next.js | [OK] | Approved |
| `tailwindcss` | npm | 8+ yrs (Tailwind Labs) | very high | github.com/tailwindlabs/tailwindcss | [OK] | Approved |
| `@tailwindcss/postcss` | npm | new scoped package for v4 (Tailwind Labs org) | high (ships with every v4 install) | github.com/tailwindlabs/tailwindcss (monorepo) | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

All three packages were checked with `slopcheck install next tailwindcss @tailwindcss/postcss` against the live npm registry this session — all returned `[OK]`. These are official first-party packages from Vercel and Tailwind Labs respectively, already present in this project's dependency tree (`next`, `tailwindcss`) or a direct, officially-documented sibling of an existing dependency (`@tailwindcss/postcss` replaces the `tailwindcss` PostCSS plugin entry). No new, unfamiliar, or community-maintained packages are introduced in this phase.

**IMPORTANT — side effect encountered during this research session:** running `slopcheck install <pkgs>` executes a **real `npm install`**, not a dry-run check. This modified `package.json`/`package-lock.json` in the working tree during research; it was caught and reverted via `git checkout -- package.json package-lock.json` before this document was written. **Whoever executes this phase's plan must NOT run `slopcheck install` again as a verification step** — use `npm view <pkg> version` (read-only) instead, or run `slopcheck install` only inside a disposable directory/sandbox, never directly in this working tree.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────────────────┐
                     │   CI (GitHub Actions, ubuntu-latest)     │
                     │   Node 22 → npm ci → npm run build       │
                     └───────────────────┬───────────────────────┘
                                         │ produces out/
                                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Build-time: Next.js 16 static export compiler            │
│  app/layout.tsx (server)                                              │
│     └─ app/page.tsx (server) ──composes──> components/sections/*.tsx  │
│     └─ app/about/page.tsx (server) ──composes──> sections/About*.tsx  │
│  globals.css: @import "tailwindcss"; @theme { --color-surface: ... }  │
│  Tailwind v4 (@tailwindcss/postcss) compiles tokens -> static CSS     │
└───────────────────────────────┬────────────────────────────────────────┘
                                 │ emits static HTML/CSS/JS to out/
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│         GitHub Pages (static host, custom domain via CNAME)           │
│  out/index.html, out/about.html (or about/index.html) served verbatim │
└───────────────────────────────┬────────────────────────────────────────┘
                                 │ browser requests / or /about
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser / Client tier                          │
│  1. Static HTML paints immediately (sections always server-rendered) │
│  2. React hydrates; CapabilitiesProvider mounts, defaults all-false   │
│  3. useEffect probes: matchMedia(reduced-motion), WebGL context,      │
│     navigator.connection, deviceMemory, hardwareConcurrency           │
│  4. Context updates -> canAnimateHero/canPlayVideo/canAnimateScroll   │
│     (no consumer yet in Phase 1 -- Phases 2-4 read these verdicts)    │
│  5. Link navigation /  <-> /about: Next.js attempts RSC prefetch      │
│     (verify here per D-11 -- Pitfall 1 below)                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx              # server: html shell, Inter font, mounts CapabilitiesProvider
│   ├── page.tsx                # server: composes Home from sections/*
│   ├── about/page.tsx          # server: composes About from sections/*
│   └── globals.css             # Tailwind v4 @import + @theme (new semantic tokens, no dark mode)
├── components/
│   ├── Header.tsx              # server, existing — gets new tokens, loses commented "Jobs" link
│   └── sections/
│       ├── Hero.tsx            # home hero (Image bg, heading, CTA copy — commented CTA block deleted)
│       ├── Services.tsx        # home services grid (commented 3rd card deleted)
│       ├── Expertise.tsx       # home expertise 3-column list
│       ├── WhyChooseUs.tsx     # home "why choose us" 2-column list
│       ├── Contact.tsx         # home contact + mailto/LinkedIn links
│       ├── AboutHero.tsx       # about page hero (bio + LinkedIn/GitHub links)
│       ├── Experience.tsx      # about page experience timeline
│       ├── SkillsExpertise.tsx # about page skills grid
│       └── Education.tsx       # about page education/certifications
├── hooks/
│   └── useCapabilities.ts      # 'use client' — matchMedia + WebGL probe + navigator.connection/deviceMemory/hardwareConcurrency
└── providers/
    └── CapabilitiesProvider.tsx # 'use client', context wrapper around useCapabilities; exposes canAnimateHero/canPlayVideo/canAnimateScroll + raw signals
```

**Note on naming:** `Hero.tsx` (home) and `AboutHero.tsx` (about) avoid a same-name collision while both sections stay flat under `components/sections/` per FOUND-05's literal wording ("under `src/components/sections/`" — singular folder, not nested `home/`/`about/` subfolders). This satisfies the requirement text directly; the `sections/home/*` + `sections/about/*` discretion option is also valid if the planner prefers stronger grouping for a 9-component set — either organizes identically well at this file count.

### Pattern 1: Mechanical section extraction preserving content/order/layout (D-05)

**What:** Each `{/* X Section */}`-marked JSX block in `page.tsx`/`about/page.tsx` becomes its own file, exporting a server component with the exact same markup, moved verbatim (minus dead code per D-06, minus `dark:` classes per D-02, minus old color-token classes which get renamed to new semantic tokens).

**When to use:** This phase only — it's a structural move, not a redesign. The existing section boundaries are already clean 1:1 candidates:
- Home (`src/app/page.tsx`): Hero (lines 9-53), Services (56-83), Expertise (86-175), WhyChooseUs (178-226), Contact (229-273)
- About (`src/app/about/page.tsx`): Hero (8-57), Experience (59-162), Skills & Expertise (164-215), Education (217-266)

**Example:**
```tsx
// src/components/sections/Services.tsx — SERVER component (no 'use client')
import Image from "next/image";

export default function Services() {
  return (
    <section id="services" className="py-20 bg-surface">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-4xl font-bold text-center mb-16 text-brand">Our Services</h2>
        {/* ...grid content moved verbatim, dark: classes removed, text-primary -> text-brand, etc. */}
      </div>
    </section>
  );
}

// src/app/page.tsx — SERVER component, composes only
import Header from "@/components/Header";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Expertise from "@/components/sections/Expertise";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <Services />
        <Expertise />
        <WhyChooseUs />
        <Contact />
      </main>
    </>
  );
}
```
[Confidence: HIGH — standard Next.js App Router server-component composition, no new APIs involved, verified against this project's actual current file contents]

### Pattern 2: Tailwind v4 CSS-first theme with semantic tokens (D-01, D-03, D-04, FOUND-03)

**What:** Replace the three `@tailwind` directives with a single `@import "tailwindcss";`, and replace the dead `@theme inline` block (which referenced nonexistent `--font-geist-sans`/`--font-geist-mono` variables and old green/navy hex values) with a real `@theme` block defining semantic color tokens.

**When to use:** This phase, during the Tailwind v4 step (D-10's second verified step).

**Example:**
```css
/* src/app/globals.css — Tailwind v4 syntax */
@import "tailwindcss";

@theme {
  --color-surface: #ffffff;        /* placeholder — Claude proposes final hex per D-03 */
  --color-ink: #0f1b2e;
  --color-ink-muted: #45526b;
  --color-brand: #0b3d5c;          /* navy */
  --color-accent: #1f8a8c;         /* teal */
  --color-cta: #e8664a;            /* coral */
  --color-border: #d8dee6;

  --font-sans: var(--font-inter);  /* fixes the current Geist-variable bug; matches layout.tsx's actual Inter variable name */
}

body {
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: var(--font-sans), sans-serif;
}
```
[Confidence: HIGH for the `@import "tailwindcss"` + `@theme` mechanics — CITED: tailwindcss.com/docs/upgrade-guide, cross-verified across multiple 2026 migration writeups in prior project research. MEDIUM/ASSUMED for the specific hex values shown — these are placeholders; D-03 requires Claude to propose final values with WCAG AA contrast results in the plan, not in this research document.]

**Trade-offs:** Tailwind v4's content detection is automatic (no `content: [...]` array needed) [CITED: tailwindcss.com, cross-verified via WebSearch 2026-10-02], which is why the JS/TS `tailwind.config.*` files can be deleted outright rather than migrated — there is nothing in them (`content` globs, a `backgroundImage` extension) that v4 needs preserved; the `backgroundImage` gradient utilities (`bg-gradient-radial`, `bg-gradient-conic`) currently defined there are not used anywhere in the three source files that reference the config (confirmed via grep) and can be dropped.

### Anti-Patterns to Avoid

- **Keeping both old and new Tailwind configs "to be safe":** Already flagged in `.planning/codebase/CONCERNS.md` as the exact failure mode that produced today's broken-tokens bug — a future edit lands in the dead file, produces silent no-op changes. Delete, don't coexist.
- **Marking a whole section `'use client'` to use the capability hook:** CAP-01's provider should mount once near the root (`layout.tsx`); individual static sections built in this phase (Services, Expertise, etc.) have no reason to be client components at all. Keep sections server components; only `CapabilitiesProvider`/`useCapabilities` are client code in this phase.
- **Re-running the Tailwind/Next upgrades together "to save a build":** D-10 explicitly requires verifying each step in isolation (`npm ci && npm run build`, inspect `out/`) — combining them means a build failure can't be attributed to a single change, which is the exact problem D-10 is designed to prevent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Tailwind v3→v4 class renames | Manual search-and-replace across all source files | `npx @tailwindcss/upgrade` (review diff, then accept) | Official codemod handles edge cases (e.g. `shadow-sm`→`shadow-xs` renames) that are easy to miss by hand, even though this project's surface area is small |
| Next 14→16 API migration | Manual edit of every route/config touchpoint | `npx @next/codemod@canary upgrade latest` | Handles the sync-to-async `params`/`searchParams` removal and other mechanical Next 16 breaking changes officially, reducing the chance of a missed call site |
| WebGL feature detection | Hand-rolled `canvas.getContext('webgl')` try/catch scattered per-component | One `useCapabilities` hook, probed once, exposed via `CapabilitiesProvider` context | This phase's entire point (CAP-01) is to prevent exactly this — three independent re-implementations in Phases 2-4 that could disagree with each other |

**Key insight:** This phase has almost no "don't hand-roll" risk because it adds zero new third-party runtime dependencies — the only new package is `@tailwindcss/postcss`, an official sibling of a dependency that's already present. The capability detection logic (CAP-01) is intentionally hand-rolled per the project's own prior research (`.planning/research/ARCHITECTURE.md` Pattern 2) because the signals involved (`matchMedia`, `navigator.connection`, `navigator.deviceMemory`) are small, standard browser APIs with no meaningful library abstraction worth adding weight for.

## Runtime State Inventory

> This phase involves file renames/deletions and a config-system migration (Tailwind v3→v4), not a rename/rebrand/string-replacement migration. The canonical rename-phase question ("what runtime systems still have the old string cached/stored/registered?") does not apply — there is no string being renamed across systems. Answering the 5 categories for completeness:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — this is a static site with zero databases/datastores of any kind | none |
| Live service config | None — GitHub Pages config lives entirely in-repo (`CNAME`, workflow YAML); no external dashboard/UI-configured service is touched by this phase | none |
| OS-registered state | None — no OS-level task scheduling, process managers, or daemons involved anywhere in this project | none |
| Secrets/env vars | None — confirmed via `process.env` grep in prior codebase research: zero matches anywhere in `src/`; no `.env*` files exist | none |
| Build artifacts | `package-lock.json` will be regenerated by the npm install steps (D-10) — this is the only "stale artifact" risk, and it's explicitly handled by D-10's "package-lock.json is regenerated" instruction. `node_modules/.cache`/`.next/` build caches should be cleared (`rm -rf .next node_modules/.cache`) if any step's build output looks stale/inconsistent after an upgrade. | npm install + regenerate lockfile per D-10; clear caches if debugging stale build output |

**Nothing found in 4 of 5 categories** — this is a static-export frontend tooling upgrade with no backend, no secrets, and no OS-level registration anywhere in the project.

## Common Pitfalls

### Pitfall 1: Next.js 16 static-export RSC prefetch 404 (D-11's target)

**What goes wrong:** `next/link` prefetching on a static export requests an RSC payload file at a dot-separated path (`__next.about.__PAGE__.txt`) while the build wrote it to a nested-directory path (`__next/about/__PAGE__.txt`). The 404 doesn't break navigation (full-page nav still works) — it silently disables prefetching, which is a performance regression, not a correctness break.

**Why it happens:** [VERIFIED: GitHub issue tracker, 2026-10-02] Root-caused in [vercel/next.js#85374](https://github.com/vercel/next.js/issues/85374) and [#92339](https://github.com/vercel/next.js/issues/92339): the static export's segment-cache-file writer calls `path.relative()`, which returns **backslash-separated paths on Windows**, and prepending `/` produces a malformed path. The fix ([PR #99058](https://github.com/vercel/next.js/pull/99058)) normalizes to forward slashes — **confirmed open/unmerged** as of this research session. Affected versions per the issue: 16.0.0 through at least 16.3.5 (current latest is 16.3.8; no confirmation the fix has shipped in a stable release yet).

**How to avoid:** This project's CI runs on `ubuntu-latest` (confirmed: `.github/workflows/nextjs.yml:16`, `runs-on: ubuntu-latest`) and local dev is WSL2/Linux (confirmed via this session's environment) — **neither matches the bug's Windows-specific trigger condition** (`path.relative()` only returns backslashes on Windows). This substantially lowers the probability the bug reproduces in this project's actual build pipeline, but D-11's smoke test is still correct and now has a precise target: after the Next 16 upgrade, build locally and in CI, then open DevTools Network tab while clicking the `/` ↔ `/about` nav links and confirm no 404s on any `__next*` request path. If it does reproduce: per Claude's Discretion, try `prefetch={false}` on the two `Link`s first (lowest-hackery fix, keeps Next 16); only drop to Next 15.5.x if that doesn't resolve it.

**Warning signs:** Console/Network tab shows 404s on paths containing `__PAGE__` or `__next` segments when navigating between `/` and `/about` after the Next 16 upgrade and a production-style static build (`npm run build` + serve `out/` — dev server does not reproduce static-export-specific bugs).

### Pitfall 2: Tailwind v4 silently not resolving tokens if `globals.css` keeps v3 directives

**What goes wrong:** If `@tailwind base; @tailwind components; @tailwind utilities;` (current v3 syntax, confirmed present in `globals.css` today) is left in place alongside an updated `@theme` block, or if the file isn't rewritten to `@import "tailwindcss";`, Tailwind v4 may not process the stylesheet as expected, reproducing the exact "classes compile to nothing" bug this phase exists to fix (already confirmed happening today for a different reason — v4 syntax running under a v3 engine).

**Why it happens:** v4's CSS-first model expects `@import "tailwindcss";` as the entry point, not the three legacy `@tailwind` directives. [CITED: tailwindcss.com/docs/upgrade-guide]

**How to avoid:** After the Tailwind v4 install step, explicitly compile and grep the output for expected utility classes before moving on — this project's own prior research (`.planning/codebase/CONCERNS.md`) already used exactly this technique (`npx tailwindcss -i ./src/app/globals.css -o /tmp/out.css` then grep for `.text-brand`/`.bg-surface` etc.) to catch the original bug; repeat it as a verification gate for the new tokens rather than trusting a successful `next build` alone (a missing utility class is not a build error).

**Warning signs:** `npm run build` succeeds but the deployed/previewed page shows unstyled (black/default) text or backgrounds where a semantic color utility was used.

### Pitfall 3: Deleting the wrong config file (not verifying which one is active first)

**What goes wrong:** Three Next config files, two Tailwind config files, and two PostCSS config files currently coexist. Deleting the live one instead of the dead one breaks the build; this project's prior research already flagged this exact risk class.

**Why it happens:** [VERIFIED: direct file read this session] `next.config.js` (active, no basePath) vs. `next.config.ts` (dead — sets `basePath: '/mvforster-talent-solutions'`, would break the custom domain if ever loaded) vs. `next.config.jsold` (dead). `tailwind.config.js`/`.ts` are near-identical duplicates. `postcss.config.js`/`.mjs` are identical duplicates.

**How to avoid:** Confirm `next.config.js` is the one Next.js 14+ actually loads (`.js` resolves before `.ts` in Next's config loader — already verified in `.planning/codebase/CONCERNS.md` by reading `node_modules/next/dist/server/config.js`), then delete `next.config.ts` and `next.config.jsold`. For Tailwind/PostCSS, since the whole config system is being rewritten for v4 anyway, the "active" question becomes moot — just end up with exactly one `postcss.config.mjs` (ESM, matches v4's own docs examples) referencing `@tailwindcss/postcss`, and zero `tailwind.config.*` files (v4 doesn't need one for this project's simple theme).

**Warning signs:** After deletion, run `npm run build` immediately — if `basePath` behavior or missing styles appear, the wrong file was deleted or a needed setting wasn't carried over.

### Pitfall 4: Section extraction accidentally changing content/order/layout (violates D-05)

**What goes wrong:** It's tempting to "clean up" small things while moving JSX into new files (e.g. fixing the `bg-gray-800` + `bg-background/90` double-background on `Header.tsx`, reordering a list, tweaking spacing) — D-05 explicitly forbids this in Phase 1.

**Why it happens:** Natural impulse when staring at code with visible quality issues (several are flagged in `.planning/codebase/CONCERNS.md`, e.g. the Header's conflicting background classes, the inconsistent `@/` vs relative import style).

**How to avoid:** Move markup verbatim except for the three explicitly-scoped changes: (1) delete commented-out dead JSX (D-06), (2) remove `dark:` classes (D-02), (3) rename old color-token classes to new semantic tokens (D-01/D-04). Anything else — the Header's double-background, the About page's relative Header import — is fair game to fix only if the user/planner explicitly scopes it into this phase; otherwise defer and note it for a later phase.

**Warning signs:** Diff review shows layout/structural changes beyond the three scoped categories.

## Code Examples

### CapabilitiesProvider (CAP-01, D-12 through D-16)

```tsx
// src/hooks/useCapabilities.ts — 'use client'
'use client'
import { useEffect, useState } from 'react'

type Signals = {
  prefersReducedMotion: boolean
  hasWebGL: boolean | null       // null = unknown (probe not yet run)
  saveData: boolean
  effectiveType: string | null   // null = API unavailable (e.g. Safari)
  deviceMemory: number | null    // null = API unavailable
  hardwareConcurrency: number | null
}

const CONSERVATIVE_DEFAULT: Signals = {
  prefersReducedMotion: true,  // D-16: default to the static/conservative state
  hasWebGL: null,
  saveData: false,
  effectiveType: null,
  deviceMemory: null,
  hardwareConcurrency: null,
}

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function useCapabilities() {
  const [signals, setSignals] = useState<Signals>(CONSERVATIVE_DEFAULT)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const conn = (navigator as any).connection

    const update = () => {
      setSignals({
        prefersReducedMotion: mq.matches,
        hasWebGL: probeWebGL(),
        saveData: !!conn?.saveData,
        effectiveType: conn?.effectiveType ?? null,
        deviceMemory: (navigator as any).deviceMemory ?? null,       // D-12: missing API = unknown, not low-end
        hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      })
    }

    update()
    mq.addEventListener('change', update)          // D-15: live reduced-motion changes
    conn?.addEventListener?.('change', update)      // D-15: live connection changes (where available)

    return () => {
      mq.removeEventListener('change', update)
      conn?.removeEventListener?.('change', update)
    }
  }, [])

  return signals
}

// src/providers/CapabilitiesProvider.tsx — 'use client'
'use client'
import { createContext, useContext, ReactNode } from 'react'
import { useCapabilities } from '@/hooks/useCapabilities'

type Verdicts = {
  canAnimateHero: boolean
  canPlayVideo: boolean
  canAnimateScroll: boolean
  signals: ReturnType<typeof useCapabilities>  // raw, for debugging
}

const CapabilitiesContext = createContext<Verdicts | null>(null)

function deriveVerdicts(signals: ReturnType<typeof useCapabilities>): Verdicts {
  const isLowEndConnection =
    signals.saveData ||
    (signals.effectiveType !== null && ['slow-2g', '2g'].includes(signals.effectiveType))
  const isLowEndDevice =
    (signals.deviceMemory !== null && signals.deviceMemory <= 2) ||
    (signals.hardwareConcurrency !== null && signals.hardwareConcurrency <= 2)

  const baseline =
    !signals.prefersReducedMotion && signals.hasWebGL !== false && !isLowEndConnection && !isLowEndDevice

  return {
    canAnimateHero: baseline && signals.hasWebGL === true,
    canPlayVideo: baseline,
    canAnimateScroll: !signals.prefersReducedMotion,
    signals,
  }
}

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const signals = useCapabilities()
  const verdicts = deriveVerdicts(signals)
  return <CapabilitiesContext.Provider value={verdicts}>{children}</CapabilitiesContext.Provider>
}

export function useCapabilityVerdicts() {
  const ctx = useContext(CapabilitiesContext)
  if (!ctx) throw new Error('useCapabilityVerdicts must be used within CapabilitiesProvider')
  return ctx
}
```
[Confidence: MEDIUM — adapted from this project's own prior architecture research (`.planning/research/ARCHITECTURE.md` Pattern 2, itself WebSearch-verified across multiple capability-detection writeups with no single authoritative spec source for the non-standard `navigator.connection`/`navigator.deviceMemory` APIs), restructured to match D-12 through D-16's exact signal list and per-feature-verdict shape, which the prior research did not specify at this granularity. Exact hook/file names are Claude's discretion per CONTEXT.md — the names above (`useCapabilities`, `CapabilitiesProvider`, `useCapabilityVerdicts`, `canAnimateHero`/`canPlayVideo`/`canAnimateScroll`) are this research's recommendation, not a locked decision.]

**Mounting (layout.tsx):**
```tsx
// src/app/layout.tsx — add the provider around children, keep everything else server-rendered
import { CapabilitiesProvider } from '@/providers/CapabilitiesProvider'
// ...
<body className={`${inter.variable} antialiased`}>
  <CapabilitiesProvider>{children}</CapabilitiesProvider>
</body>
```
No section built in this phase reads `useCapabilityVerdicts()` — CAP-01 only requires the provider to exist and be mounted correctly; Phases 2-4 are the consumers.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Tailwind JS/TS config (`tailwind.config.js`, `theme.extend`) | CSS-first `@theme` block directly in the stylesheet | Tailwind v4 (early 2026 per prior project research) | No JS config file needed for this project's simple palette; content detection is automatic, removing the `content: [...]` glob array entirely |
| `@tailwind base/components/utilities` (3 directives) | `@import "tailwindcss";` (1 import) | Tailwind v4 | Must rewrite `globals.css`'s first three lines, not just the `@theme` block |
| Next.js sync `params`/`searchParams` in route handlers | Async-only `params`/`searchParams` | Next.js 16 | Not applicable to this project today (no dynamic routes exist — only static `/` and `/about`), but the official codemod will flag/fix it if any dynamic route is added in a later phase |
| `next export` CLI command | `output: 'export'` in `next.config.js` | Removed as of Next.js 14 | Already correctly configured in this project; no action needed, just confirming no stale documentation/muscle-memory reintroduces the removed CLI command |

**Deprecated/outdated:**
- `autoprefixer` as a standalone PostCSS plugin alongside Tailwind v4: redundant once `@tailwindcss/postcss` is installed, since v4's Lightning CSS-based pipeline handles vendor prefixing internally. [CITED: carried forward from `.planning/research/STACK.md`, consistent with official v4 docs]
- `framer-motion` as a package name: not used in this phase, but worth noting for Phase 4 planning — the actively maintained successor is `motion` (same team, renamed in 2025).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Proposed placeholder hex values (navy `#0b3d5c`, teal `#1f8a8c`, coral `#e8664a`, etc.) in the Pattern 2 code example | Architecture Patterns > Pattern 2 | Low — explicitly marked as placeholders in the research; D-03 already requires the planner/Claude to propose final values with real WCAG AA contrast calculations in the plan itself, not inherit these from research. These are illustrative syntax only. |
| A2 | Node 22 is the right choice over Node 24 | Standard Stack | Low-medium — both satisfy the `>=20.9.0` floor; choosing 22 trades "longer EOL runway" (24) for "matches current local dev exactly" (22). If the user has a stronger opinion (e.g. wants max runway), 24 is an equally valid, fully-supported choice. Flagged as Claude's Discretion in CONTEXT.md, so this needs no additional sign-off beyond the planner's judgment call being visible in the plan. |
| A3 | `prefetch={false}` would be the lowest-hackery fallback if the Next 16 prefetch bug reproduces | Common Pitfalls > Pitfall 1 | Low — this is CONTEXT.md's own suggested option (Claude's Discretion section), not a novel claim; only matters if the smoke test actually reproduces the bug, which this research assesses as unlikely given the Ubuntu CI / WSL2 dev environment mismatch with the bug's Windows-specific trigger. |

**No other claims in this research are tagged [ASSUMED]** — version numbers, peer dependencies, engine requirements, and the GitHub issue root-cause analysis were verified live against the npm registry and GitHub during this research session (see Sources).

## Open Questions (RESOLVED)

> Both resolved during planning: Q1 is operationalized as the blocking D-11 smoke-test checkpoint in `01-02-PLAN.md` Task 2; Q2 is decided as a manual rewrite (no codemod) in `01-01-PLAN.md` Task 2.

1. **Will the Next 16 RSC-prefetch bug actually reproduce on this project's Ubuntu CI/WSL2 dev setup?**
   - What we know: Root cause is confirmed Windows-specific (`path.relative()` backslash behavior); this project's CI is `ubuntu-latest` and local dev is WSL2 (Linux filesystem semantics).
   - What's unclear: Whether any part of the static export process could still produce a backslash on a non-Windows runner under some edge condition (e.g. a dependency shimming path behavior) — no evidence of this, but not provably impossible without running the actual smoke test.
   - Recommendation: Run D-11's smoke test exactly as specified (production-style `npm run build`, serve `out/` locally, click `/` ↔ `/about`, check Network tab for `__next*`/`__PAGE__` 404s) immediately after the Next 16 step, before section extraction. Budget ~15 minutes; this is cheap insurance, not a deep investigation.

2. **Does the official `@tailwindcss/upgrade` codemod handle this project's `@theme inline` → `@theme` + `@import` rewrite cleanly, or is a manual rewrite faster?**
   - What we know: The codemod's primary documented value is mechanical class renames; this project has almost none of those (`flex-shrink-0`, `bg-gradient-to-r`, etc. were not found in a grep of the three affected source files).
   - What's unclear: Whether running the codemod against a `globals.css` that already has a (dead, wrong-syntax) `@theme inline` block produces a clean result or needs manual cleanup afterward either way.
   - Recommendation: Try the codemod first (it's officially documented and low-cost to run), but plan to manually verify/rewrite `globals.css` regardless — the plan should treat the semantic-token rewrite (D-04) as a manual step either way, since the codemod has no way to know the new navy/teal/coral semantic names.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All build/CI steps | ✓ | v22.23.2 (local, confirmed this session) | — |
| npm | Canonical package manager (D-10) | ✓ | 10.9.8 (confirmed this session) | — |
| GitHub Actions (`ubuntu-latest` runner) | CI build/deploy | ✓ | Standard GitHub-hosted runner, currently pinned to Node 18 — **must be bumped to 22 as part of FOUND-01** | — |
| `slopcheck` (Python CLI) | Package legitimacy verification (this research session only, not a phase dependency) | ✓ | 0.6.1 (installed this session via `pip install slopcheck --break-system-packages`) | `npm view <pkg>` as a manual substitute if unavailable in a future session |

**Missing dependencies with no fallback:** none — all required tooling is either already present locally or is a one-line CI config change (Node version bump).

**Missing dependencies with fallback:** none applicable to this phase's actual execution (the `slopcheck` note above is a research-session tool, not something the phase's plan needs to install).

## Validation Architecture

> `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`. Per the skip condition, this section is omitted.

## Security Domain

> `security_enforcement` is absent from `.planning/config.json`, so it is treated as enabled per the default rule.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Site has no auth of any kind — static marketing content only |
| V3 Session Management | No | No sessions — fully static, no cookies set by this project's own code |
| V4 Access Control | No | No access-controlled resources; `/goals` access-control gap is a pre-existing, separately-scoped issue explicitly out of this milestone per PROJECT.md |
| V5 Input Validation | No | This phase introduces no forms, no user input, no data fetching of any kind |
| V6 Cryptography | No | No cryptographic operations anywhere in this phase or this project |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Supply-chain risk from new/renamed packages (`@tailwindcss/postcss`) | Tampering | Verified via `slopcheck` + live npm registry checks this session (see Package Legitimacy Audit) — all `[OK]`, official Tailwind Labs package |
| Config confusion leading to accidental `basePath` reintroduction breaking the custom domain | Tampering (of build config, not malicious) | D-09's live-deploy verification step and this research's Pitfall 3 — confirm `next.config.js` (no `basePath`) remains the sole active config before and after deletion of dead files |
| No CSP possible under GitHub Pages static hosting | Tampering/Information Disclosure (future risk, not this phase) | Pre-existing, documented constraint (`.planning/codebase/CONCERNS.md`) — no action needed in Phase 1 since no third-party scripts are introduced here; relevant again in Phase 3 (Calendly) |

This phase introduces no auth, no user input, no data handling, and no new third-party runtime scripts — the security surface is effectively unchanged except for the supply-chain check already performed above.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view next/tailwindcss/@tailwindcss/postcss version/engines/peerDependencies/time`) — live, verified 2026-10-02
- [vercel/next.js#85374](https://github.com/vercel/next.js/issues/85374) — official issue tracker, root cause and affected-version range
- [vercel/next.js#92339](https://github.com/vercel/next.js/issues/92339) — companion issue, same root cause, confirms Windows-specific trigger
- [vercel/next.js PR #99058](https://github.com/vercel/next.js/pull/99058) — unmerged fix, confirms open status and exact mechanism
- `slopcheck install next tailwindcss @tailwindcss/postcss` — live registry legitimacy check, all `[OK]`, run this session
- Direct repository reads this session: `package.json`, `next.config.js`/`.ts`/`.jsold`, `tailwind.config.js`/`.ts`, `postcss.config.js`/`.mjs`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/about/page.tsx`, `src/components/Header.tsx`, `src/app/layout.tsx`, `.github/workflows/nextjs.yml`, `.github/workflows/.nextoldyml`
- `.planning/codebase/CONCERNS.md`, `.planning/codebase/STRUCTURE.md` — prior-session codebase audit, including the Tailwind CLI compile verification technique

### Secondary (MEDIUM confidence)
- [endoflife.date/nodejs](https://endoflife.date/nodejs) and cross-referencing WebSearch roundups — Node 22/24 LTS windows, verified 2026-10-02
- [tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide) — official v4 migration guide, `@import`/`@theme`/automatic-content-detection mechanics
- [nextjs.org/docs/app/guides/upgrading/version-16](https://nextjs.org/docs/app/guides/upgrading/version-16) — official Next 16 migration docs
- `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/SUMMARY.md`, `.planning/research/PITFALLS.md` — this project's own prior milestone-level research, reused rather than duplicated per this agent's instructions
- [anjanesh.dev — Exporting a Next.js app with correct static page routes](https://anjanesh.dev/exporting-a-nextjs-app-with-correct-static-page-routes-on-the-server) — general static-export routing mechanics (not GitHub-Pages-specific)

### Tertiary (LOW confidence)
- [blog.axiorema.com — Next.js 16 static export 404s](https://blog.axiorema.com/engineering/uncurious-case-broken-static-exports-404s-nextjs-16/) — the original single-source report that flagged this bug for the prior milestone research; now superseded in confidence by the official GitHub issue/PR found this session, but retained as the originating source
- GitHub Pages clean-URL behavior (WebSearch roundup, not an official GitHub Docs citation) — sufficiently corroborated across multiple independent community sources to treat as reliable for this project's no-`trailingSlash` configuration, but flagged as not an official-docs citation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all three packages' versions, engines, and peer deps verified live against the npm registry this session
- Architecture: HIGH for section-extraction/config patterns (direct reads of this project's actual files); MEDIUM for the exact CapabilitiesProvider shape (adapted from prior research, not yet executed/tested)
- Pitfalls: HIGH for the Next 16 prefetch bug's root cause and status (verified against official GitHub issue/PR this session, a meaningful upgrade from the prior milestone research's single-blog-source MEDIUM/LOW rating)

**Research date:** 2026-10-02
**Valid until:** ~30 days (Next.js 16.x and Tailwind 4.x are both actively shipping patch releases; re-check `npm view next version` and the status of vercel/next.js#85374 before executing if this phase starts materially later than the research date)

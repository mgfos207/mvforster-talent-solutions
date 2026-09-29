<!-- refreshed: 2026-09-29 -->
# Architecture

**Analysis Date:** 2026-09-29

## System Overview

This is a static marketing/portfolio site for MVForster Talent Solutions (recruiting business), built with Next.js App Router and exported as static HTML (`output: 'export'`). There is no backend, API, or database — it is a pure client-rendered/static-generated brochure site with three routes.

```text
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│                      `src/app/`                               │
├──────────────────┬──────────────────┬───────────────────────┤
│   Home Route      │   About Route    │   Goals Route          │
│  `src/app/page.tsx`│ `src/app/about/  │ `src/app/goals/        │
│                    │  page.tsx`       │  page.tsx`             │
└────────┬───────────┴────────┬─────────┴──────────┬────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Shared Layout + Shared Component                   │
│  `src/app/layout.tsx` (root shell, fonts, metadata)           │
│  `src/components/Header.tsx` (fixed nav, used by Home+About)  │
└────────┬───────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│         Static Assets (images used directly, no CMS)         │
│  `public/*.jpg|png|svg`, `public/family/*.jpg`                │
└─────────────────────────────────────────────────────────────┘
```

There is no client-side state management, no API routes, no data-fetching layer, and no server components doing real work beyond static markup — every page is a single large server component composed of hard-coded JSX sections.

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `RootLayout` | HTML shell, global font (`Inter` via `next/font/google`), page `<html>`/`<body>`, metadata (title/description/favicon) | `src/app/layout.tsx` |
| `Home` (default export) | Landing page: hero, services, expertise, "why choose us", contact — all in one file | `src/app/page.tsx` |
| `About` (default export) | Bio/resume page for Micah Forster: hero, experience timeline, skills, education | `src/app/about/page.tsx` |
| `Page` (goals route, default export) | Personal/private financial-goals page with family photos; not linked from nav | `src/app/goals/page.tsx` |
| `Header` | Fixed top navigation bar with logo + anchor links (`/about`, `/#services`, `/#expertise`, `/#contact`) | `src/components/Header.tsx` |

## Pattern Overview

**Overall:** Static-exported Next.js 14 App Router site ("brochureware" pattern) — no client interactivity beyond CSS hover/transition effects, no fetch/data layer, no global state.

**Key Characteristics:**
- Every route is a monolithic single-file server component containing all markup for that page (no sub-components for sections like hero/services/expertise — they are inline `<section>` blocks within `page.tsx`)
- Only one reusable component exists in the entire codebase: `Header`
- Styling is 100% Tailwind utility classes inline in JSX; no CSS Modules, no styled-components, no CSS-in-JS
- Images use `next/image` (`Image` component) on Home/About but plain `<img>` tags on the Goals page — inconsistent image-handling pattern
- No routing logic beyond Next's file-based routing (3 routes total: `/`, `/about`, `/goals`)
- No tests, no API layer, no environment-driven config beyond `next.config`

## Layers

**Routing / Pages layer:**
- Purpose: Defines the 3 pages of the site
- Location: `src/app/` (page.tsx per route directory)
- Contains: Page-level React Server Components; each is monolithic (hero + multiple content sections combined)
- Depends on: `src/components/Header.tsx`, `next/image`, `next/link`, static assets in `public/`
- Used by: Next.js App Router file-based routing

**Shared UI layer:**
- Purpose: Cross-page chrome (navigation)
- Location: `src/components/`
- Contains: Only `Header.tsx` currently
- Depends on: `next/link`, `next/image`, `public/android-chrome-512x512.png` (used as the logo image)
- Used by: `src/app/page.tsx`, `src/app/about/page.tsx` (NOT used by `src/app/goals/page.tsx`, which has no header/nav)

**Global styling layer:**
- Purpose: CSS variables (light/dark theme tokens), Tailwind directives, base body styles
- Location: `src/app/globals.css`
- Contains: `:root` CSS custom properties (`--primary`, `--secondary`, `--background`, etc.), a `@theme inline` block mapping vars to Tailwind color tokens, a `prefers-color-scheme: dark` override block, and base `body` styles
- Depends on: Tailwind (`@tailwind base/components/utilities`)
- Used by: every page implicitly via `src/app/layout.tsx` import

**Static assets layer:**
- Purpose: All imagery for hero backgrounds, logos, favicons, and personal photos
- Location: `public/`
- Contains: Background/hero image (`office-bg.jpg`), portrait/profile images, logo variants, favicon set, placeholder SVGs (from create-next-app boilerplate: `next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg`), and a `family/` subfolder of personal photos used only on the (unlinked) Goals page
- Used by: `Image`/`img` tags across all three pages

## Data Flow

### Primary Request Path (Home page)

1. Browser requests `/` → static HTML from `out/` (pre-rendered at build time via `output: 'export'`), no server runtime involved in production
2. `RootLayout` (`src/app/layout.tsx`) wraps the page: applies `Inter` font variable and global CSS
3. `Home` component (`src/app/page.tsx`) renders in order: `Header`, then hero `<section>` (full-viewport background image via `next/image` with `fill` + `objectFit: cover`, dark overlay, headline/subhead), services grid, expertise 3-column list, "why choose us" 2-column list, and contact section with `mailto:` + LinkedIn links and a portrait image
4. All content is static JSX — no props, no fetched data, no client state

### About Page Flow

1. Same layout/header wrapping as Home
2. `About` (`src/app/about/page.tsx`) renders a hero (name + bio + LinkedIn/GitHub links + portrait), then hard-coded "Professional Experience" timeline entries, "Skills & Expertise" cards, and "Education & Certifications" cards — all static content, no loop/data-driven rendering (each entry manually duplicated as JSX)

### Goals Page Flow (isolated, unlinked)

1. `src/app/goals/page.tsx` has no `Header` and is not referenced by any `Link` in the app — reachable only via direct URL `/goals`
2. Renders personal financial-goal figures and family photos (`public/family/*.jpg`) using raw `<img>` tags (bypassing `next/image` optimization pipeline, though `images.unoptimized: true` in config makes this moot for the static export)

**State Management:**
- None. No `useState`/`useEffect`/context/store anywhere in `src/`. All three pages are fully static server components with zero interactivity beyond CSS `:hover`/`transition` utility classes.

## Key Abstractions

**Section-as-inline-JSX:**
- Purpose: Each visual section of a page (hero, services, expertise, contact, etc.) is expressed as an inline `<section>` block directly inside the page component rather than being extracted to its own component
- Examples: `src/app/page.tsx` (hero at lines ~10-53, services ~56-83, expertise ~86-175, why-choose-us ~178-226, contact ~229-273), `src/app/about/page.tsx` (hero, experience, skills, education sections)
- Pattern: No componentization — sections are not reusable, not independently testable, and cannot be reordered/reused across routes without copy-paste. This is the primary structural constraint a WebGL/video redesign must address (see Anti-Patterns below).

**CSS variable theme tokens:**
- Purpose: Centralizes brand colors (`--primary`, `--primary-light`, `--primary-dark`, `--secondary`, `--accent`) with a dark-mode override block
- Examples: `src/app/globals.css`
- Pattern: Tailwind's `@theme inline` directive maps CSS vars to utility class names (e.g. `text-primary`, `bg-primary-dark`) consumed throughout JSX via className strings

## Entry Points

**Root layout:**
- Location: `src/app/layout.tsx`
- Triggers: Wraps every route in the App Router
- Responsibilities: Loads `Inter` font, sets page `<title>`/description/favicon metadata, applies global CSS import

**Home route:**
- Location: `src/app/page.tsx`
- Triggers: Request to `/`
- Responsibilities: Full landing page (hero, services, expertise, differentiators, contact)

**About route:**
- Location: `src/app/about/page.tsx`
- Triggers: Request to `/about`
- Responsibilities: Personal bio/resume-style page for Micah Forster

**Goals route (orphaned):**
- Location: `src/app/goals/page.tsx`
- Triggers: Direct navigation to `/goals` only (no nav link exists)
- Responsibilities: Personal financial-goal tracker with family photos; unrelated to the recruiting business content — likely a scratch/test page left in the repo

## Architectural Constraints

- **Static export only:** `next.config.js`/`next.config.ts` both set `output: 'export'` with `images: { unoptimized: true }`. This means no Next.js Image Optimization API, no server components with real server logic (data fetching, middleware, API routes), and no ISR/SSR at runtime — everything must be resolvable at `next build` time. Any WebGL/video redesign must load and initialize entirely client-side (`'use client'` components) since there is no server runtime in production.
- **Duplicate/conflicting Next config files:** Three config files coexist — `next.config.js` (active, no `basePath`), `next.config.ts` (sets `basePath: '/mvforster-talent-solutions'` and explicit `distDir: 'out'`), and `next.config.jsold` (also sets that `basePath`). Only one is actually read by Next (`.js` takes precedence over `.ts` in this Next version), so `basePath` is currently NOT applied in the active build — verify this is intentional given `CNAME` (`mvforster.com`) implies a custom-domain deployment (no basePath needed) rather than a GitHub Pages project-path deployment (which the old `basePath` config assumed).
- **Duplicate/stale page files:** `src/app/page.tsx.bak` and `src/app/page.tsx.new` sit alongside the active `src/app/page.tsx` with diverging content (different hero copy, different services grid, missing "Behavioral Health" expertise column in the `.new`/`.bak` variants). These are not imported by Next's router (wrong extension) but represent uncommitted/abandoned edits that a redesign should reconcile or delete.
- **No client-side interactivity today:** No `'use client'` directives, no hooks, no third-party UI/animation libraries (no Framer Motion, GSAP, Three.js, R3F) are installed (`package.json` deps are only `next`, `react`, `react-dom`). Introducing WebGL/video will require adding client component boundaries and new dependencies (e.g. `three`, `@react-three/fiber`, or raw WebGL/Canvas) from scratch.
- **Global state:** None present.
- **Circular imports:** None detected (import graph is a simple tree: `layout.tsx` → page files → `Header.tsx`).

## Anti-Patterns

### Monolithic page components instead of section components

**What happens:** Every page (`src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/goals/page.tsx`) inlines every visual section (hero, services, expertise, cards, timeline entries) directly as JSX in one file, with no extraction into `src/components/Hero.tsx`, `src/components/Services.tsx`, etc.
**Why it's wrong:** Makes it hard to isolate a hero rewrite (e.g., swapping the static `office-bg.jpg` hero for a WebGL/video hero) without touching a 277-line file that also contains unrelated sections; increases risk of regressions when editing; prevents reuse of a section (e.g., a "roles we place" list) across pages.
**Do this instead:** Extract each `<section>` into its own component under `src/components/sections/` (e.g., `Hero.tsx`, `ServicesGrid.tsx`, `ExpertiseGrid.tsx`, `ContactSection.tsx`) with typed props, so a hero redesign only requires swapping `Hero.tsx`.

### Commented-out dead JSX left in place

**What happens:** Large blocks of markup are commented out rather than deleted — e.g. the CTA button row in the hero (`src/app/page.tsx:32-49`) and a second services card (`src/app/page.tsx:67-73`) and a nav "Jobs" link (`src/components/Header.tsx:29-31`).
**Why it's wrong:** Obscures the actual current output, makes future edits error-prone (easy to un-comment stale/inconsistent markup), and adds noise when reasoning about layout changes for the redesign.
**Do this instead:** Delete dead markup; if intentionally deferred, track it in a TODO/issue instead of leaving commented JSX in the tree.

### Inconsistent image-loading strategy

**What happens:** `src/app/page.tsx` and `src/app/about/page.tsx` use Next's `Image` component; `src/app/goals/page.tsx` uses plain `<img>` tags for the same kind of content (photos).
**Why it's wrong:** Inconsistent optimization/loading behavior and inconsistent code patterns to follow when adding new imagery (e.g. video poster frames) during the redesign.
**Do this instead:** Standardize on `next/image` (already required to be `unoptimized` under static export) for all raster images; use `<video>`/canvas elements only for actual video/WebGL content.

## Error Handling

**Strategy:** None implemented — no error boundaries, no `error.tsx`/`not-found.tsx` files in `src/app/`, no try/catch anywhere (there is nothing that can throw at runtime since there's no data fetching).

**Patterns:**
- N/A — static content only.

## Cross-Cutting Concerns

**Logging:** None (no `console.log`/logging framework in `src/`).
**Validation:** None (no forms with input; the "contact" section is just `mailto:` and external links, not a form).
**Authentication:** None (public static site, no auth).

---

*Architecture analysis: 2026-09-29*

<!-- GSD:project-start source:PROJECT.md -->
## Project

**MVForster Talent Solutions — Modern Site Refresh**

MVForster Talent Solutions (mvforster.com) is a static Next.js marketing site for Micah Forster's recruiting business. It serves two audiences: **clients**, meaning employers such as healthcare, behavioral health, and healthcare-admin organizations, and **candidates** in roles like BCBA, RBT, and healthcare admin. This refresh gives the site a "calm, premium, human" feel. Visitors should see a WebGL hero and ambient stock or generated video, and every page should lead them to book an intro call through Calendly.

**Core Value:** **Every visitor, whether employer or candidate, can book an intro chat on Calendly in one click from anywhere on the site. The new visuals must make that booking more likely, not get in the way of it.**

If the WebGL or video fails, the page still loads fast, looks polished, and the booking CTA still works.

### Constraints

- **Hosting:** static export on GitHub Pages only. Everything, including WebGL, video, and Calendly, runs client-side.
- **Tech stack:** Next.js 14 App Router + TypeScript + Tailwind, with npm as the canonical package manager (CI uses `npm ci`).
- **Config:** keep the effective `next.config.js` with no `basePath`. The custom domain breaks if a basePath is added.
- **Performance:** mobile Lighthouse Performance ≥ 90 and LCP ≤ 2.5s on the home page. The WebGL/video JS must not block first paint.
- **Accessibility:** respect `prefers-reduced-motion`, meet WCAG AA contrast, and never put essential content inside video or canvas.
- **Assets:** video is self-hosted and compressed (WebM/MP4 with a poster image) or embedded from a CDN. Keep individual clips small, loaded only when visible.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript (strict mode) - App Router pages/components in `src/app/*.tsx`, `src/components/*.tsx` (`tsconfig.json`, `target: ES2017`)
- CSS - `src/app/globals.css` (Tailwind directives + custom globals)
- JavaScript (CommonJS) - duplicate/legacy config files (`next.config.js`, `tailwind.config.js`, `postcss.config.js`)
## Runtime
- Node.js 18 (pinned in CI via `actions/setup-node@v4` with `node-version: '18'` in `.github/workflows/nextjs.yml`)
- No `.nvmrc` or `engines` field in `package.json` — local dev Node version is not pinned/enforced.
- **Effective: npm.** CI (`.github/workflows/nextjs.yml`) runs `npm ci` then `npm run build`, so `package-lock.json` (committed, 216KB) is the lockfile that actually governs builds/deploys.
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` are present but **untracked** (`git status` shows `??`) and unused by CI — they reflect a local switch to pnpm that was never adopted for the deploy pipeline. Treat npm as canonical; do not assume pnpm scripts work in CI.
## Frameworks
- Next.js 14 (`package.json` declares `^14.0.1`; installed version per `node_modules/next/package.json` is `14.2.35`) - App Router (`src/app/`), static export mode
- React 18.2.0 / React DOM 18.2.0 - UI rendering
- Tailwind CSS 3.3.3 - utility-first styling, configured via `tailwind.config.ts`/`.js` + `postcss.config.mjs`/`.js`
- Not detected. No `jest.config.*`, `vitest.config.*`, `*.test.*`, or `*.spec.*` files found anywhere in `src/`.
- TypeScript 5.x - type checking (`noEmit: true`, checked separately from build)
- ESLint 8/9 via `eslint.config.mjs` (flat config, extends `next/core-web-vitals` and `next/typescript` through `FlatCompat`)
- Autoprefixer 10.4.16 + PostCSS 8.4.31 - CSS post-processing for Tailwind
## Key Dependencies
- `next` (^14.0.1 / installed 14.2.35) - framework, static export builder, `next/font/google` (Inter font) integration
- `react` / `react-dom` (^18.2.0) - component runtime
- None. This is a fully static marketing/portfolio site with zero backend dependencies (no database client, no ORM, no HTTP client library, no state management library).
## Configuration
| Purpose | Files present | Effective file | Why |
|---|---|---|---|
| Next.js config | `next.config.js`, `next.config.ts`, `next.config.jsold` | **`next.config.js`** | Next.js's config loader checks `next.config.js` before `.ts` variants; when both `.js` and `.ts` exist, `.js` wins silently. `next.config.jsold` has no recognized extension pattern Next.js loads (`.jsold` is not `.js`/`.mjs`/`.ts`) — it is dead/inert, kept only for reference. |
| Tailwind config | `tailwind.config.js`, `tailwind.config.ts` | **`tailwind.config.js`** (same JS-before-TS precedence used by the Tailwind/PostCSS toolchain) | Contents of both files are otherwise identical (same `content` globs, same `backgroundImage` extensions), so this duplication currently has no behavioral effect — but only one file should be kept. |
| PostCSS config | `postcss.config.js`, `postcss.config.mjs` | **`postcss.config.js`** (CommonJS resolved first by PostCSS/Next.js tooling) | Both configure the same `tailwindcss` + `autoprefixer` plugins with no differences. |
| Lockfile | `package-lock.json` (committed), `pnpm-lock.yaml` + `pnpm-workspace.yaml` (untracked) | **`package-lock.json`** | CI uses `npm ci`; pnpm files are local-only artifacts not used by the deploy pipeline. |
- No `.env*` files present in the repo.
- No environment variables are read anywhere in `src/` (confirmed via `process.env` grep — zero matches).
- No secrets, API keys, or runtime configuration needed to build or run this site.
- `next.config.js` sets `output: 'export'` (static HTML export) and `images: { unoptimized: true }` (required for static export, since Next's image optimization server is unavailable).
- Build produces a static `out/` directory (implied by GitHub Pages workflow uploading `./out`); `distDir` is not overridden in the effective `next.config.js` (default `.next` is used for the build cache, but `output: 'export'` still emits final static files to `out/`).
- `tsconfig.json`: `moduleResolution: "bundler"`, path alias `@/*` → `./src/*`, `jsx: "preserve"`, `strict: true`.
## Platform Requirements
- Node.js 18+ (matches CI; not enforced locally)
- npm (lockfile-compatible; pnpm lockfile exists but is not the source of truth)
- Static hosting only — no Node.js server, no serverless functions, no API routes exist anywhere in `src/app/`.
- Deployed to **GitHub Pages** via `.github/workflows/nextjs.yml`, triggered on push to `main`. Custom domain `mvforster.com` configured via root `CNAME` file.
- A second workflow file, `.github/workflows/.nextoldyml`, exists but is **not executed by GitHub Actions** — its filename lacks the required `.yml`/`.yaml` extension pattern (GitHub only recognizes files directly named `*.yml`/`*.yaml` inside `.github/workflows/`; `.nextoldyml` does not match), so it is dead/legacy content only. The active workflow is `nextjs.yml`.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Route pages use the Next.js App Router convention: `src/app/<route>/page.tsx` (e.g. `src/app/about/page.tsx`, `src/app/goals/page.tsx`).
- The root layout is `src/app/layout.tsx`.
- Shared components use PascalCase filenames matching their default export: `src/components/Header.tsx` exports `Header`.
- Stray/backup files exist alongside real source and are NOT part of the build but sit in the tree: `src/app/page.tsx.bak`, `src/app/page.tsx.new`. These are dead weight — do not treat them as reference implementations, and remove them if touching `src/app/page.tsx`.
- React components are default-exported functions named in PascalCase matching the route/purpose: `export default function Home()`, `export default function About()`, `export default function RootLayout()`, `export default function Header()`.
- No named (non-default) component exports observed anywhere in `src/`.
- Local consts use camelCase (e.g. `inter` in `src/app/layout.tsx` for the `next/font/google` instance).
- No hooks, no state variables, no custom variable-heavy logic exists yet — the codebase is presentational/static JSX only.
- Inline TypeScript types are used directly in function signatures rather than separate `type`/`interface` declarations, e.g. `src/app/layout.tsx`:
- No dedicated `types/` directory or shared type definition files exist. If adding shared types, there is no established convention to follow — establish one (e.g. `src/types/*.ts`) rather than inferring from precedent.
## Code Style
- No Prettier config file exists (no `.prettierrc*`). Formatting is whatever the author's editor produced — inconsistent indentation of nested JSX exists in places (e.g. `src/app/about/page.tsx` lines 9-11 have irregular indentation of nested `<div>` elements).
- 2-space indentation is the dominant style across all files.
- Double quotes are used for imports (`"next/image"` in `page.tsx`), but single quotes appear in `src/components/Header.tsx` (`'next/link'`, `'next/image'`). No enforced consistency — ESLint does not include a quote-style rule.
- ESLint config: `eslint.config.mjs` (flat config format).
- Extends `next/core-web-vitals` and `next/typescript` via `FlatCompat` from `@eslint/eslintrc`.
- Ignores: `node_modules/**`, `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.
- No custom rules added beyond the Next.js defaults. No `no-unused-vars`, import-order, or accessibility-specific overrides configured explicitly (these come only from whatever `next/core-web-vitals` bundles).
- Run via `npm run lint` (calls `eslint` directly — see `package.json`).
## Import Organization
- No enforced import order (no `eslint-plugin-import` or `simple-import-sort` configured). Observed pattern in existing files:
- `@/*` maps to `./src/*` (configured in `tsconfig.json` `compilerOptions.paths`).
- Usage is inconsistent: `src/app/page.tsx` imports `Header` via `import Header from "@/components/Header"`, but `src/app/about/page.tsx` imports the same component via a relative path `import Header from "../../components/Header"`. When adding new imports of internal modules, prefer the `@/` alias — it is the established path mapping even though not universally applied yet.
## Error Handling
- No error handling exists anywhere in the codebase. There are no `try`/`catch` blocks, no API routes, no form submissions, no data fetching, and no Next.js `error.tsx` or `not-found.tsx` files. The site is 100% static marketing content with no client-side or server-side logic beyond rendering JSX.
- If server actions, forms, or data fetching are introduced, there is no existing pattern to extend — establish conventional Next.js error boundaries (`error.tsx`) and typed error returns from the start.
## Logging
- Not applicable — no logging present anywhere in the codebase.
## Comments
- JSX section markers are the dominant comment style, used to label major page sections: `{/* Hero Section with Parallax */}`, `{/* Services Section */}`, `{/* Expertise Section */}`, `{/* Why Choose Us Section */}`, `{/* Contact Section */}` (all in `src/app/page.tsx`); `{/* Hero Section */}`, `{/* Experience Section */}`, `{/* Skills & Expertise Section */}`, `{/* Education Section */}` (all in `src/app/about/page.tsx`).
- Large blocks of commented-out JSX are left in place rather than deleted, e.g. a commented-out CTA button block in `src/app/page.tsx` (lines 32-49) and a commented-out "Talent Assessment" card (lines 67-73), and a commented-out "Jobs" nav link in `src/components/Header.tsx` (lines 29-31). When editing these files, either restore or delete dead commented blocks rather than adding more — the pattern of accumulating commented-out markup is a growing convention that should not be extended further.
- Not used anywhere. No function, component, or type in the codebase has a JSDoc/TSDoc block.
## Function Design
## Module Design
## Tailwind / Styling Conventions
- Tailwind CSS v3 (`tailwindcss@3.3.3` per `package.json`, with both `tailwind.config.js` and `tailwind.config.ts` present — duplicate configs exist; `tailwind.config.ts` should be treated as the source of truth for new work since `.ts` typically wins in Next.js tooling resolution, but verify which one Tailwind actually picks up before relying on custom theme values).
- Custom CSS variables for theming are defined in `src/app/globals.css` under `:root` and re-mapped through an `@theme inline` block (`--color-primary`, `--color-secondary`, `--color-accent`, etc.), with dark-mode overrides under `@media (prefers-color-scheme: dark)`.
- Utility classes are applied directly and verbosely inline on every element — no `clsx`/`cn()` helper, no extracted className constants, no CSS Modules. Repeated class strings (e.g. `"bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"`) are copy-pasted across many elements rather than factored into a shared component or utility.
- Dark mode is implemented via Tailwind's `dark:` variant classes applied ad hoc per element, driven by the `prefers-color-scheme` media query in `globals.css` rather than a `class`-based toggle.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| `RootLayout` | HTML shell, global font (`Inter` via `next/font/google`), page `<html>`/`<body>`, metadata (title/description/favicon) | `src/app/layout.tsx` |
| `Home` (default export) | Landing page: hero, services, expertise, "why choose us", contact — all in one file | `src/app/page.tsx` |
| `About` (default export) | Bio/resume page for Micah Forster: hero, experience timeline, skills, education | `src/app/about/page.tsx` |
| `Page` (goals route, default export) | Personal/private financial-goals page with family photos; not linked from nav | `src/app/goals/page.tsx` |
| `Header` | Fixed top navigation bar with logo + anchor links (`/about`, `/#services`, `/#expertise`, `/#contact`) | `src/components/Header.tsx` |
## Pattern Overview
- Every route is a monolithic single-file server component containing all markup for that page (no sub-components for sections like hero/services/expertise — they are inline `<section>` blocks within `page.tsx`)
- Only one reusable component exists in the entire codebase: `Header`
- Styling is 100% Tailwind utility classes inline in JSX; no CSS Modules, no styled-components, no CSS-in-JS
- Images use `next/image` (`Image` component) on Home/About but plain `<img>` tags on the Goals page — inconsistent image-handling pattern
- No routing logic beyond Next's file-based routing (3 routes total: `/`, `/about`, `/goals`)
- No tests, no API layer, no environment-driven config beyond `next.config`
## Layers
- Purpose: Defines the 3 pages of the site
- Location: `src/app/` (page.tsx per route directory)
- Contains: Page-level React Server Components; each is monolithic (hero + multiple content sections combined)
- Depends on: `src/components/Header.tsx`, `next/image`, `next/link`, static assets in `public/`
- Used by: Next.js App Router file-based routing
- Purpose: Cross-page chrome (navigation)
- Location: `src/components/`
- Contains: Only `Header.tsx` currently
- Depends on: `next/link`, `next/image`, `public/android-chrome-512x512.png` (used as the logo image)
- Used by: `src/app/page.tsx`, `src/app/about/page.tsx` (NOT used by `src/app/goals/page.tsx`, which has no header/nav)
- Purpose: CSS variables (light/dark theme tokens), Tailwind directives, base body styles
- Location: `src/app/globals.css`
- Contains: `:root` CSS custom properties (`--primary`, `--secondary`, `--background`, etc.), a `@theme inline` block mapping vars to Tailwind color tokens, a `prefers-color-scheme: dark` override block, and base `body` styles
- Depends on: Tailwind (`@tailwind base/components/utilities`)
- Used by: every page implicitly via `src/app/layout.tsx` import
- Purpose: All imagery for hero backgrounds, logos, favicons, and personal photos
- Location: `public/`
- Contains: Background/hero image (`office-bg.jpg`), portrait/profile images, logo variants, favicon set, placeholder SVGs (from create-next-app boilerplate: `next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg`), and a `family/` subfolder of personal photos used only on the (unlinked) Goals page
- Used by: `Image`/`img` tags across all three pages
## Data Flow
### Primary Request Path (Home page)
### About Page Flow
### Goals Page Flow (isolated, unlinked)
- None. No `useState`/`useEffect`/context/store anywhere in `src/`. All three pages are fully static server components with zero interactivity beyond CSS `:hover`/`transition` utility classes.
## Key Abstractions
- Purpose: Each visual section of a page (hero, services, expertise, contact, etc.) is expressed as an inline `<section>` block directly inside the page component rather than being extracted to its own component
- Examples: `src/app/page.tsx` (hero at lines ~10-53, services ~56-83, expertise ~86-175, why-choose-us ~178-226, contact ~229-273), `src/app/about/page.tsx` (hero, experience, skills, education sections)
- Pattern: No componentization — sections are not reusable, not independently testable, and cannot be reordered/reused across routes without copy-paste. This is the primary structural constraint a WebGL/video redesign must address (see Anti-Patterns below).
- Purpose: Centralizes brand colors (`--primary`, `--primary-light`, `--primary-dark`, `--secondary`, `--accent`) with a dark-mode override block
- Examples: `src/app/globals.css`
- Pattern: Tailwind's `@theme inline` directive maps CSS vars to utility class names (e.g. `text-primary`, `bg-primary-dark`) consumed throughout JSX via className strings
## Entry Points
- Location: `src/app/layout.tsx`
- Triggers: Wraps every route in the App Router
- Responsibilities: Loads `Inter` font, sets page `<title>`/description/favicon metadata, applies global CSS import
- Location: `src/app/page.tsx`
- Triggers: Request to `/`
- Responsibilities: Full landing page (hero, services, expertise, differentiators, contact)
- Location: `src/app/about/page.tsx`
- Triggers: Request to `/about`
- Responsibilities: Personal bio/resume-style page for Micah Forster
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
### Commented-out dead JSX left in place
### Inconsistent image-loading strategy
## Error Handling
- N/A — static content only.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

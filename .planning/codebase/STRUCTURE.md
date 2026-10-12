# Codebase Structure

**Analysis Date:** 2026-09-29

## Directory Layout

```
mvforster-talent-solutions/
├── .github/
│   └── workflows/
│       ├── nextjs.yml         # Active CI: builds via `npm ci && npm run build`, deploys `out/` to GitHub Pages
│       └── .nextoldyml        # Stale/renamed workflow file (not a valid .yml extension, inert)
├── .planning/                  # GSD planning artifacts (this map, phase plans, etc.)
├── public/                     # All static assets served at site root (see Special Directories)
│   └── family/                 # Personal family photos, used only by the unlinked /goals route
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── layout.tsx          # Root HTML shell, font + metadata
│   │   ├── page.tsx            # Home route ("/") — hero/services/expertise/contact
│   │   ├── page.tsx.bak        # Stale abandoned draft of page.tsx (not routed)
│   │   ├── page.tsx.new        # Stale abandoned draft of page.tsx (not routed)
│   │   ├── globals.css         # Tailwind directives + CSS variable theme tokens
│   │   ├── favicon.ico         # App-router-scoped favicon (separate from public/favicon.ico)
│   │   ├── about/
│   │   │   └── page.tsx        # About route ("/about") — bio/resume page
│   │   └── goals/
│   │       └── page.tsx        # Goals route ("/goals") — personal/unlinked page
│   └── components/
│       └── Header.tsx          # Sole shared component: fixed top nav used by Home + About
├── CNAME                        # Custom domain for GitHub Pages: mvforster.com
├── filing-llc.png                # Stray image at repo root (unrelated to public/ asset pipeline)
├── next.config.js               # ACTIVE config (Next reads .js first): output: 'export', unoptimized images
├── next.config.ts               # Inactive duplicate; also sets basePath (currently not applied)
├── next.config.jsold            # Inactive/backup duplicate of an older config
├── tailwind.config.js            # Duplicate of tailwind.config.ts (both present; .ts is TS-typed source of truth by convention)
├── tailwind.config.ts
├── postcss.config.js             # Duplicate of postcss.config.mjs
├── postcss.config.mjs
├── tsconfig.json                 # Path alias: `@/*` → `./src/*`
├── eslint.config.mjs             # Flat config extending next/core-web-vitals + next/typescript
├── package.json / package-lock.json / pnpm-lock.yaml / pnpm-workspace.yaml  # Mixed package manager artifacts (npm + pnpm both present)
└── README.md                    # Default create-next-app boilerplate readme (not project-specific)
```

## Directory Purposes

**`src/app/`:**
- Purpose: File-based routing root for the Next.js App Router
- Contains: One `page.tsx` per route directory, the shared `layout.tsx`, and `globals.css`
- Key files: `src/app/layout.tsx` (shell), `src/app/page.tsx` (home), `src/app/about/page.tsx`, `src/app/goals/page.tsx`

**`src/components/`:**
- Purpose: Cross-route reusable UI
- Contains: Currently only `Header.tsx` — no `Footer`, no section subcomponents, no UI primitives (buttons/cards) exist as separate components
- Key files: `src/components/Header.tsx`

**`public/`:**
- Purpose: Static assets served verbatim at the site root (required for `output: 'export'` + `images.unoptimized: true`)
- Contains: Favicons/app icons (`favicon*.png/ico`, `android-chrome-*.png`, `apple-touch-icon.png`), hero/background imagery (`office-bg.jpg`), profile/portrait photos (`micah-forster-recruitment.jpeg`, `micah-night-city.png`, `micah-night-city.jpg`, `micah-night-city_old.jpg`), logo variants (`mvforster-logo.jpg`, `mvforster-logo.png`), create-next-app boilerplate SVGs (`next.svg`, `vercel.svg`, `globe.svg`, `file.svg`, `window.svg` — used as decorative service icons on the home page, not brand-specific), and `family/` (personal photos for the orphaned goals page)
- Key files: `public/office-bg.jpg` (current hero background, 450KB JPEG — a WebGL/video redesign will likely replace or layer over this), `public/micah-night-city.png` (1.3MB — largest asset, used as the contact-section portrait)

**`.github/workflows/`:**
- Purpose: CI/CD — static export deploy to GitHub Pages
- Contains: `nextjs.yml` (active), `.nextoldyml` (dead file, invalid extension so GitHub Actions ignores it)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root shell wrapping every page (fonts, metadata, global CSS import)
- `src/app/page.tsx`: Home page — this is the primary target for hero/WebGL/video redesign work
- `src/app/about/page.tsx`: About/bio page
- `src/app/goals/page.tsx`: Unlinked personal page (not part of the public site information architecture)

**Configuration:**
- `next.config.js`: Active Next config — static export mode
- `next.config.ts`, `next.config.jsold`: Inactive duplicates (candidates for removal/consolidation)
- `tailwind.config.js` / `tailwind.config.ts`: Duplicate Tailwind config (content globs cover `src/pages`, `src/components`, `src/app` — note `src/pages` doesn't exist, dead glob)
- `postcss.config.js` / `postcss.config.mjs`: Duplicate PostCSS config
- `tsconfig.json`: TypeScript config with `@/*` → `src/*` path alias
- `eslint.config.mjs`: ESLint flat config (Next.js core-web-vitals + typescript rule sets)

**Core Logic:**
- N/A — no business logic, services, or utilities exist. All logic is presentational JSX/Tailwind markup inside `src/app/*/page.tsx`.

**Styling:**
- `src/app/globals.css`: Tailwind directives + CSS variable theme (`--primary`, `--secondary`, `--accent`, dark-mode override block via `@media (prefers-color-scheme: dark)`)

**Testing:**
- None present — no test files, no test runner config, no `__tests__` directories.

## Naming Conventions

**Files:**
- Route files follow Next.js convention: `page.tsx` (required filename per route directory), `layout.tsx` (required root layout filename)
- Components use PascalCase filenames matching the exported component: `Header.tsx` exports `Header`
- Config files follow tool-standard names (`next.config.js`, `tailwind.config.ts`, etc.) — but note duplication (both `.js`/`.ts` variants of the same config coexist; only one is authoritative per tool's resolution order)

**Directories:**
- Route segments are lowercase, matching the URL path: `about/` → `/about`, `goals/` → `/goals`
- `src/app/` and `src/components/` are the only two source directories — no `lib/`, `hooks/`, `utils/`, `types/`, or `styles/` directories exist yet

## Where to Add New Code

**New Section Component (e.g., WebGL hero, video background):**
- Create under `src/components/` (no existing subfolder convention — recommend `src/components/sections/Hero.tsx` or similar if introducing WebGL/video, since no such subdivision exists yet)
- Mark as `'use client'` since WebGL/Canvas/video APIs require client-side execution and no client components currently exist in the codebase
- Import into `src/app/page.tsx` in place of the current inline hero `<section>` (lines ~10-53)

**New Route/Page:**
- Add `src/app/<route-name>/page.tsx`
- Wrap with `<Header />` (imported from `@/components/Header` via the `@/*` path alias) for nav consistency, unless intentionally standalone like `/goals`

**Shared UI (buttons, cards, nav):**
- No existing convention beyond `src/components/Header.tsx`; a redesign introducing more reusable components should place them flat in `src/components/` or introduce a `src/components/ui/` subfolder

**Static Assets (new hero video/textures/models for WebGL):**
- Place in `public/` at root (flat, matching current convention) or introduce a subfolder (e.g. `public/video/`, `public/models/`) — no existing subfolder pattern besides `public/family/`
- Remember `images.unoptimized: true` is set — Next's image optimization pipeline does not run; large source assets should be pre-optimized/compressed before adding, since `office-bg.jpg` (450KB) and `micah-night-city.png` (1.3MB) are already shipped unoptimized to the client

**Global styles/theme tokens:**
- Add or modify CSS variables in `src/app/globals.css` inside the `:root` block and the `@theme inline` mapping block; dark-mode-specific overrides go in the existing `@media (prefers-color-scheme: dark)` block

## Special Directories

**`public/`:**
- Purpose: Static asset root, served at site URL root
- Generated: No
- Committed: Yes
- Note: Contains several apparently corrupted/placeholder files — `public/micah-night-city.jpg`, `public/micah-night-city_old.jpg`, `public/mvforster-logo.jpg`, `public/mvforster-logo.png` are all ~39-41 bytes (too small to be real images; likely broken exports or Git artifacts) — verify before reusing in a redesign.

**`public/family/`:**
- Purpose: Personal photos for the orphaned `/goals` route
- Generated: No
- Committed: Yes (large files: ~3MB each, unoptimized JPEGs)

**`.next/` (build output, present locally):**
- Purpose: Next.js build cache/output
- Generated: Yes
- Committed: No (present in working tree but should be gitignored — verify `.gitignore` excludes it)

**`out/` (referenced by CI, not present until build runs):**
- Purpose: Static export output deployed to GitHub Pages by `.github/workflows/nextjs.yml`
- Generated: Yes
- Committed: No

**Stray/duplicate files at repo root and in `src/app/`:**
- `src/app/page.tsx.bak`, `src/app/page.tsx.new`: Abandoned draft edits of the home page with different copy/layout (not routed by Next since the extension isn't `.tsx` exactly — `page.tsx.bak`/`page.tsx.new` are ignored by the router)
- `filing-llc.png`: Image file sitting at repo root outside `public/`, unrelated to any import in `src/`
- `next.config.jsold`, `.github/workflows/.nextoldyml`: Both stale renamed config/workflow files kept in the tree

---

*Structure analysis: 2026-09-29*

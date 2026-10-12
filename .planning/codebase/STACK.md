# Technology Stack

**Analysis Date:** 2026-09-29

## Languages

**Primary:**
- TypeScript (strict mode) - App Router pages/components in `src/app/*.tsx`, `src/components/*.tsx` (`tsconfig.json`, `target: ES2017`)

**Secondary:**
- CSS - `src/app/globals.css` (Tailwind directives + custom globals)
- JavaScript (CommonJS) - duplicate/legacy config files (`next.config.js`, `tailwind.config.js`, `postcss.config.js`)

## Runtime

**Environment:**
- Node.js 18 (pinned in CI via `actions/setup-node@v4` with `node-version: '18'` in `.github/workflows/nextjs.yml`)
- No `.nvmrc` or `engines` field in `package.json` — local dev Node version is not pinned/enforced.

**Package Manager:**
- **Effective: npm.** CI (`.github/workflows/nextjs.yml`) runs `npm ci` then `npm run build`, so `package-lock.json` (committed, 216KB) is the lockfile that actually governs builds/deploys.
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` are present but **untracked** (`git status` shows `??`) and unused by CI — they reflect a local switch to pnpm that was never adopted for the deploy pipeline. Treat npm as canonical; do not assume pnpm scripts work in CI.

## Frameworks

**Core:**
- Next.js 14 (`package.json` declares `^14.0.1`; installed version per `node_modules/next/package.json` is `14.2.35`) - App Router (`src/app/`), static export mode
- React 18.2.0 / React DOM 18.2.0 - UI rendering
- Tailwind CSS 3.3.3 - utility-first styling, configured via `tailwind.config.ts`/`.js` + `postcss.config.mjs`/`.js`

**Testing:**
- Not detected. No `jest.config.*`, `vitest.config.*`, `*.test.*`, or `*.spec.*` files found anywhere in `src/`.

**Build/Dev:**
- TypeScript 5.x - type checking (`noEmit: true`, checked separately from build)
- ESLint 8/9 via `eslint.config.mjs` (flat config, extends `next/core-web-vitals` and `next/typescript` through `FlatCompat`)
- Autoprefixer 10.4.16 + PostCSS 8.4.31 - CSS post-processing for Tailwind

## Key Dependencies

**Critical:**
- `next` (^14.0.1 / installed 14.2.35) - framework, static export builder, `next/font/google` (Inter font) integration
- `react` / `react-dom` (^18.2.0) - component runtime

**Infrastructure:**
- None. This is a fully static marketing/portfolio site with zero backend dependencies (no database client, no ORM, no HTTP client library, no state management library).

## Configuration

**Duplicate/conflicting config files present — only one of each pair is actually effective:**

| Purpose | Files present | Effective file | Why |
|---|---|---|---|
| Next.js config | `next.config.js`, `next.config.ts`, `next.config.jsold` | **`next.config.js`** | Next.js's config loader checks `next.config.js` before `.ts` variants; when both `.js` and `.ts` exist, `.js` wins silently. `next.config.jsold` has no recognized extension pattern Next.js loads (`.jsold` is not `.js`/`.mjs`/`.ts`) — it is dead/inert, kept only for reference. |
| Tailwind config | `tailwind.config.js`, `tailwind.config.ts` | **`tailwind.config.js`** (same JS-before-TS precedence used by the Tailwind/PostCSS toolchain) | Contents of both files are otherwise identical (same `content` globs, same `backgroundImage` extensions), so this duplication currently has no behavioral effect — but only one file should be kept. |
| PostCSS config | `postcss.config.js`, `postcss.config.mjs` | **`postcss.config.js`** (CommonJS resolved first by PostCSS/Next.js tooling) | Both configure the same `tailwindcss` + `autoprefixer` plugins with no differences. |
| Lockfile | `package-lock.json` (committed), `pnpm-lock.yaml` + `pnpm-workspace.yaml` (untracked) | **`package-lock.json`** | CI uses `npm ci`; pnpm files are local-only artifacts not used by the deploy pipeline. |

**Important divergence in `next.config.js` vs `next.config.ts`/`next.config.jsold`:** the currently-effective `next.config.js` does **not** set `basePath`, while both non-effective `.ts`/`.jsold` variants set `basePath: '/mvforster-talent-solutions'`. Since the site deploys to a custom domain via `CNAME` (`mvforster.com`) rather than a `github.io/<repo>` subpath, the effective no-`basePath` config is correct for the current deployment target — but this is easy to break if someone "cleans up" by deleting `next.config.js` and keeping `next.config.ts` instead, which would silently break all asset/routing paths in production.

**Environment:**
- No `.env*` files present in the repo.
- No environment variables are read anywhere in `src/` (confirmed via `process.env` grep — zero matches).
- No secrets, API keys, or runtime configuration needed to build or run this site.

**Build:**
- `next.config.js` sets `output: 'export'` (static HTML export) and `images: { unoptimized: true }` (required for static export, since Next's image optimization server is unavailable).
- Build produces a static `out/` directory (implied by GitHub Pages workflow uploading `./out`); `distDir` is not overridden in the effective `next.config.js` (default `.next` is used for the build cache, but `output: 'export'` still emits final static files to `out/`).
- `tsconfig.json`: `moduleResolution: "bundler"`, path alias `@/*` → `./src/*`, `jsx: "preserve"`, `strict: true`.

## Platform Requirements

**Development:**
- Node.js 18+ (matches CI; not enforced locally)
- npm (lockfile-compatible; pnpm lockfile exists but is not the source of truth)

**Production:**
- Static hosting only — no Node.js server, no serverless functions, no API routes exist anywhere in `src/app/`.
- Deployed to **GitHub Pages** via `.github/workflows/nextjs.yml`, triggered on push to `main`. Custom domain `mvforster.com` configured via root `CNAME` file.
- A second workflow file, `.github/workflows/.nextoldyml`, exists but is **not executed by GitHub Actions** — its filename lacks the required `.yml`/`.yaml` extension pattern (GitHub only recognizes files directly named `*.yml`/`*.yaml` inside `.github/workflows/`; `.nextoldyml` does not match), so it is dead/legacy content only. The active workflow is `nextjs.yml`.

---

*Stack analysis: 2026-09-29*

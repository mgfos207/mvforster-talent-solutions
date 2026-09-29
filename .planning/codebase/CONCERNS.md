# Codebase Concerns

**Analysis Date:** 2026-09-29

This is a small static-export Next.js 14 marketing/portfolio site (single owner, `src/app` + `src/components`, ~1,200 lines of TSX total). Concerns below are prioritized with the owner's stated plan to add **WebGL and video** in mind — several existing issues will compound once heavier assets and client-side rendering are introduced.

## Tech Debt

**Duplicate/dead config files create silent drift risk (`next.config.*`):**
- Issue: Three Next config files exist: `next.config.js`, `next.config.ts`, `next.config.jsold`. Next.js 14.2.35's config loader (`node_modules/next/dist/shared/lib/constants.js:319`) only looks for `next.config.js` or `next.config.mjs` via findup (`node_modules/next/dist/server/config.js:684-800`). This means **`next.config.ts` and `next.config.jsold` are 100% dead code** — silently ignored, never thrown as errors because `next.config.js` exists and short-circuits the lookup.
- Files: `next.config.js` (active), `next.config.ts` (dead), `next.config.jsold` (dead)
- Impact: `next.config.ts` sets `basePath: '/mvforster-talent-solutions'` and `distDir: 'out'`; `next.config.jsold` also sets that basePath plus a duplicate/invalid `experimental.images.unoptimized`. The **live** `next.config.js` has no `basePath`. A future editor (or an AI agent) is likely to edit `next.config.ts` (it's the "modern" TS file, most recently looking canonical) believing it controls the build, and be confused when nothing changes. This directly risks breaking the WebGL/video work if someone adds `experimental` flags (e.g. for WASM, workers, or asset handling) to the wrong file.
- Fix approach: Delete `next.config.jsold` and `next.config.ts`. Keep a single `next.config.js` (or migrate cleanly to `next.config.mjs` if ESM is desired) as the sole source of truth. Verify `basePath` requirement against actual deployment target before deleting (see Deploy Pipeline section — the live custom domain via `CNAME` means no `basePath` is correct, matching the currently-active `next.config.js`).

**Duplicate Tailwind and PostCSS config files:**
- Issue: Both `tailwind.config.js` and `tailwind.config.ts` exist with near-identical content; both `postcss.config.js` and `postcss.config.mjs` exist with identical content. Only one pair is actually loaded (JS resolves first in most tool resolution chains), the other is dead weight.
- Files: `tailwind.config.js`, `tailwind.config.ts`, `postcss.config.js`, `postcss.config.mjs`
- Impact: Same class of risk as the Next config duplication — a future edit (e.g. adding a `content` glob for new WebGL/canvas components, or adding a Tailwind plugin) could land in the file that isn't loaded, producing "changes that don't do anything" confusion.
- Fix approach: Delete `tailwind.config.js` and `postcss.config.js` OR their `.ts`/`.mjs` counterparts — keep exactly one of each. Confirm which is active via `npx tailwindcss -i ./src/app/globals.css -o /tmp/out.css` before deleting.

**Confirmed dead/broken Tailwind color utilities (`text-primary`, `bg-primary`, `text-secondary`, etc. render as no-ops):**
- Issue: `src/app/globals.css` defines CSS custom properties (`--primary`, `--secondary`, `--primary-light`, etc.) inside a `@theme inline { ... }` block. `@theme inline` is a **Tailwind CSS v4** construct. The installed/locked Tailwind version in both `package-lock.json` and `pnpm-lock.yaml` is **v3.3.3**, which does not understand `@theme inline` and does not read those custom properties into its color palette. Neither `tailwind.config.js` nor `tailwind.config.ts` extends `theme.colors` with `primary`/`secondary` — only `backgroundImage` is extended. Verified by compiling the actual stylesheet with the installed Tailwind CLI (`npx tailwindcss -i ./src/app/globals.css -o /tmp/out.css --content './src/**/*.{ts,tsx}'`): the output CSS contains **zero** rules for `.text-primary`, `.bg-primary`, `.text-secondary`, `.text-primary-light`, `.dark:text-primary-light`, etc.
- Files: `src/app/globals.css:19-29` (dead `@theme inline` block), `tailwind.config.js`, `tailwind.config.ts` (missing `colors` extension), `src/app/page.tsx`, `src/app/about/page.tsx`, `src/components/Header.tsx` (all use `text-primary`, `bg-primary`, `text-secondary`, `dark:text-primary-light` extensively — dozens of occurrences)
- Impact: Every heading, link-hover state, and brand-color accent across the homepage, about page, and header that uses `text-primary`/`bg-primary`/`text-secondary`/`*-primary-light` is currently rendering with **no color styling applied** (falls back to inherited black/default text color). The brand's green/navy palette defined in `:root` is effectively decorative dead code today.
- Fix approach: Either (a) upgrade to Tailwind v4 and adopt CSS-first `@theme` properly (bigger change, touches `postcss.config`, `tailwind.config` removal), or (b) the faster fix: add `colors: { primary: { DEFAULT: 'var(--primary)', light: 'var(--primary-light)', dark: 'var(--primary-dark)' }, secondary: 'var(--secondary)' }` to `theme.extend` in whichever `tailwind.config.*` is active, and delete the non-functional `@theme inline` block. Re-verify with the Tailwind CLI compile check above before shipping.

**Stray backup/scratch files committed to the repo:**
- Issue: `src/app/page.tsx.bak` (169 lines) and `src/app/page.tsx.new` (232 lines) are full alternate copies of the homepage, committed alongside the real `src/app/page.tsx` (276 lines). Next.js's app router only picks up `page.tsx` so these are inert at build time, but they are dead weight in the repo, get linted/typechecked risk if ever renamed, and confuse anyone (human or agent) trying to find "the" homepage.
- Files: `src/app/page.tsx.bak`, `src/app/page.tsx.new`
- Impact: Low functional risk (not included in the Next.js route build), but real risk of someone accidentally editing the wrong file or an AI agent picking up stale content as ground truth.
- Fix approach: Delete both files (`git rm src/app/page.tsx.bak src/app/page.tsx.new`); the current `src/app/page.tsx` is already a superset of their content per diff.

**Root-level stray asset file (`filing-llc.png`) outside `public/`:**
- Issue: `filing-llc.png` (228KB) sits at the repo root, not in `public/`. It is not referenced anywhere in `src/` (confirmed via grep across `.tsx`/`.ts`/`.md`).
- Files: `filing-llc.png`
- Impact: Unused binary bloats the repo/clone size; being at root (not `public/`) means it isn't even servable by the app if it were needed.
- Fix approach: Delete if truly unused, or move into `public/` if it's meant to be referenced (e.g., LLC filing document for a footer link).

**Inconsistent import style for shared components:**
- Issue: `src/app/page.tsx` imports `Header` via the path alias (`@/components/Header`), while `src/app/about/page.tsx` uses a relative path (`../../components/Header`).
- Files: `src/app/page.tsx:2`, `src/app/about/page.tsx:2`
- Impact: Minor; makes refactors (e.g. moving `Header` when adding new WebGL/video components) more error-prone since some references won't be caught by simple path-based search.
- Fix approach: Standardize on the `@/*` alias already configured in `tsconfig.json:21-23`.

**Mixed `next/image` and raw `<img>` usage:**
- Issue: `src/app/page.tsx`, `src/app/about/page.tsx`, and `src/components/Header.tsx` all use `next/image`; `src/app/goals/page.tsx` uses plain `<img>` tags for three large family photos.
- Files: `src/app/goals/page.tsx:17-21,57-61,68-72`
- Impact: Bypasses whatever benefit `next/image` still provides under static export (lazy loading via native `loading` attribute is absent here; also no `width`/`height` attributes, so these images can cause layout shift). Combined with the file sizes below, this page is a real performance outlier.
- Fix approach: Either delete the page (see Security/Privacy below) or, if kept, convert to `next/image` with explicit dimensions and compress the source photos.

## Known Bugs

**Hero CTA buttons are commented out — no calls to action on the homepage:**
- Symptoms: The homepage hero section has no visible buttons; a fully-built "Hire Talent" / "Find Jobs" button pair exists in JSX but is wrapped in a comment block.
- Files: `src/app/page.tsx:32-49`
- Trigger: Always — this is static markup, not conditional.
- Workaround: None currently; visually the hero just shows heading + paragraph, then jumps to the gradient fade.

**"Talent Assessment" service card commented out mid-grid:**
- Symptoms: The Services section grid (`grid md:grid-cols-2`) has a middle card commented out, leaving 2 visible cards instead of what looks like an originally-intended 3-card layout; the surviving 2 cards happen to fit the 2-column grid, but this is fragile if a third card is ever re-enabled without also updating the grid column count.
- Files: `src/app/page.tsx:67-73`
- Trigger: Always present as dead JSX comment.
- Workaround: N/A — cosmetic/content decision, not a runtime error.

## Security Considerations

**Personal financial-goals page is publicly deployed with no access control (`/goals`):**
- Risk: `src/app/goals/page.tsx` renders the site owner's personal income targets ("Monthly Target $10,000", "Annual Income Goal $150,000", "My Journey to Freedom") alongside personal family photos (`public/family/family1.jpg`, `family2.jpg`, `family3.jpg`). This route is not linked from `Header.tsx` navigation, but under `output: 'export'` every page in `src/app` is compiled to a static HTML file and served at its path (`/goals/index.html`) — there is no auth gate, `noindex`, or `robots.txt` exclusion found anywhere in the repo. Since the domain has a `CNAME` (`mvforster.com`) and is deployed via GitHub Pages (see Deploy Pipeline), this personal financial/family content is live and crawlable on the public internet today.
- Files: `src/app/goals/page.tsx`, `public/family/*.jpg`
- Current mitigation: None (no `robots.txt`, no `noindex` meta tag, no auth).
- Recommendations: Remove the route entirely from the deployed build (delete `src/app/goals/`), or if it must exist, exclude it from static export and/or add `robots.txt`/`noindex` plus move it off the public domain. This should be resolved before doing further public-facing work (WebGL/video) that will draw more attention/traffic to the site.

**No Content-Security-Policy or security headers:**
- Risk: Static export via GitHub Pages (`output: 'export'`) means no custom HTTP headers can be set at the Next.js layer (no `next.config.js` `headers()` support under static export). Adding WebGL (often loading third-party shader/asset libraries) or video (potentially embedding third-party players) increases the attack surface for XSS/content-injection if any user-generated or third-party script content is later introduced.
- Files: `next.config.js` (no `headers()` — and wouldn't work under static export anyway)
- Current mitigation: None; acceptable for a fully static, no-backend, no-third-party-embed site today.
- Recommendations: If video is embedded via third-party iframe (YouTube/Vimeo) or WebGL pulls remote assets, consider moving hosting to a platform that supports custom headers (Vercel, Cloudflare Pages) so CSP/`Permissions-Policy` (important for camera/GPU-adjacent APIs WebGL may prompt) can be set.

## Performance Bottlenecks

**Hero LCP image is a large, non-next-gen, unoptimized JPEG (relevant to planned WebGL/video hero):**
- Problem: `public/office-bg.jpg` (440KB) is used as the full-screen hero background (`fill`, `priority`) in `src/app/page.tsx:12-19`. Because `next.config.js:4-6` sets `images: { unoptimized: true }` (required for `output: 'export'`), Next.js's `<Image>` component does **not** resize, compress, or convert this to AVIF/WebP — it is served as-is at full 440KB regardless of viewport. This is the current Largest Contentful Paint element.
- Files: `public/office-bg.jpg`, `next.config.js:4-6`, `src/app/page.tsx:12-19`
- Cause: Static export disables Next's image optimization pipeline entirely; there is no build step compressing/resizing images in this repo (no `sharp`, no image pipeline in `package.json`).
- Improvement path: If the hero is being replaced by a WebGL canvas or video element, budget for this now — a WebGL scene or `<video>` poster/first-frame will need to be smaller than 440KB to avoid regressing LCP further, and should be pre-compressed (AVIF/WebP for stills, H.264/VP9 with a poster frame for video) before commit, since the build pipeline will not do this automatically under `output: 'export'`.

**`/goals` page ships ~9.7MB of uncompressed photos via plain `<img>`:**
- Problem: `public/family/family1.jpg` (3.7MB), `family2.jpg` (3.1MB), `family3.jpg` (3.3MB) are loaded via raw `<img>` tags with no lazy-loading attribute, no responsive `srcset`, and no `next/image` optimization.
- Files: `src/app/goals/page.tsx:17-21,57-61,68-72`, `public/family/*.jpg`
- Cause: Photos taken directly from a phone/camera and dropped into `public/family/` without any compression pass.
- Improvement path: If the page is kept, compress to <300KB each and convert to `next/image` (or at minimum add `loading="lazy"` and explicit `width`/`height`). Preferably remove this page from the deployed build (see Security section) — it's the single heaviest set of assets in the entire `public/` directory (9.7MB vs. ~1.9MB for everything else combined).

**No code-splitting/lazy-loading pattern established for heavy client components:**
- Problem: The codebase currently has zero client components (`"use client"` directive does not appear anywhere in `src/`) — every page is a server component with static JSX. There is no existing pattern for `next/dynamic` imports, `Suspense` boundaries, or lazy-mounting a heavy library.
- Files: N/A (absence of pattern) — checked via `grep -rn "use client" src/` (no matches) and `grep -rn "next/dynamic" src/` (no matches)
- Cause: Site has been purely static/presentational to date.
- Improvement path: When introducing WebGL (e.g. three.js/react-three-fiber) or a video player, these will necessarily be client components (`"use client"`) and should be lazy-loaded via `next/dynamic({ ssr: false })` so the WebGL/video runtime JS doesn't block or bloat the initial HTML/JS the static export ships for every route. Establish this pattern deliberately rather than ad hoc, since there's no precedent in the codebase to follow.

**Fixed/backdrop-blur header re-renders over full-bleed hero on every page:**
- Problem: `src/components/Header.tsx:6` uses `fixed` positioning with `backdrop-blur-sm` over a `bg-gray-800` and `bg-background/90` combination (two conflicting background declarations on the same element — `bg-gray-800` and `bg-background/90` both apply; the later one in class order wins in Tailwind's cascade, but this is likely unintentional given both are present).
- Files: `src/components/Header.tsx:6`
- Cause: Leftover class from an earlier styling iteration (probably related to the same `bg-primary`/color-token confusion described above).
- Improvement path: `backdrop-blur` triggers GPU compositing on every scroll frame; combined with an upcoming WebGL canvas potentially also using the GPU compositor, verify there's no jank when both are active simultaneously. Low priority unless profiling shows an issue.

## Fragile Areas

**Three parallel Next.js config files with divergent `basePath`/`distDir` settings:**
- Files: `next.config.js`, `next.config.ts`, `next.config.jsold`
- Why fragile: As detailed in Tech Debt above, only `next.config.js` is live, but the other two look equally (or more) authoritative to a human/AI reader, especially `next.config.ts` which matches the project's TypeScript-first conventions elsewhere (`tsconfig.json`, `.tsx` components). Any WebGL/video work that needs new `next.config` settings (e.g., `webpack()` customization for `.glb`/`.gltf`/`.wasm` asset loaders, or `experimental.turbo` rules) is at high risk of being added to a dead file.
- Safe modification: Before adding any Next config for WebGL assets, run a build (`npm run build`) and confirm the change takes effect; better yet, delete the dead files first (see Fix approach above).
- Test coverage: None (no config-loading test exists; this is a static site with no test suite at all — see Test Coverage Gaps).

**Mixed npm and pnpm lockfiles/package managers:**
- Files: `package-lock.json` (tracked, 216KB), `pnpm-lock.yaml` (untracked/new, 125KB), `pnpm-workspace.yaml` (untracked/new)
- Why fragile: The repo has historically used npm (`package-lock.json` is committed, and both GitHub Actions workflows — `.github/workflows/nextjs.yml` and `.github/workflows/.nextoldyml` — run `npm ci` / `npm run build`). A `pnpm-lock.yaml` and `pnpm-workspace.yaml` now exist locally (per git status, both untracked) alongside a stray `pnpm-workspace.yaml` config (`allowBuilds: { unrs-resolver: false }`) that references a package (`unrs-resolver`) not found anywhere else in the dependency tree — likely an artifact of running `pnpm install` once locally without ever adopting pnpm as the project's package manager. If these get committed, future contributors (or CI, which still runs `npm ci`) could end up with two divergent dependency resolutions — `package-lock.json` currently resolves `next@14.2.35`, and any drift between the two lockfiles' resolutions (e.g., transitive dep versions of `postcss`/`autoprefixer`/`tailwindcss`) could cause "works on my machine" bugs, especially once heavier dependencies (three.js, video libraries) are added and only one lockfile gets updated.
- Safe modification: Pick one package manager (npm, matching CI) and delete the other lockfile/workspace file before it gets committed. Do not run `pnpm install` again in this repo unless the team is deliberately migrating CI too.
- Test coverage: N/A — this is a repo-hygiene/CI-correctness issue, not something a test suite would catch.

**Two near-duplicate, partially-overlapping GitHub Actions workflows:**
- Files: `.github/workflows/nextjs.yml` (active — standard `.yml` extension), `.github/workflows/.nextoldyml` (dotfile with no extension, so GitHub Actions does not trigger it, but it remains in the repo as a near-full duplicate using older action versions: `actions/checkout@v3` vs `@v4`, `actions/setup-node@v3` vs `@v4`, `actions/deploy-pages@v3` vs `@v4`)
- Why fragile: `.nextoldyml` is inert today (GitHub Actions only picks up `*.yml`/`*.yaml` files in `.github/workflows/`), but its presence is confusing — same class of "dead file that looks live" risk as the config duplicates above. It also includes a `Restore cache` step keyed on `package-lock.json` hash that the active workflow dropped, meaning the active workflow (`nextjs.yml`) does a full `npm ci` with no `.next/cache` restoration on every run.
- Safe modification: Delete `.nextoldyml`. If the caching step from the old workflow was intentionally dropped (e.g., cache invalidation bugs), leave it out; if it was accidental, port the `actions/cache@v4` step into `nextjs.yml` to speed up CI once the build starts including larger WebGL/video assets (bigger `node_modules` and `.next/cache` will make cache restoration matter more).
- Test coverage: No CI step runs lint (`npm run lint`) or a type-check (`tsc --noEmit`) before build — `nextjs.yml` only runs `npm ci` then `npm run build`. Type errors or lint failures would only surface as a build failure (if severe enough) or ship silently to production.

**Node version pinned only in CI, not locally:**
- Files: `.github/workflows/nextjs.yml:19` (`node-version: '18'`), no `.nvmrc`/`.node-version`/`engines` field in `package.json`
- Why fragile: CI builds on Node 18, but the local dev environment (verified via `node -v`) is running Node 22. `next@14.2.35`'s `engines` field requires `>=18.17.0`, so both work, but any future dependency (WebGL libs, video processing tooling) with a stricter Node floor could pass locally on Node 22 and behave differently — or fail outright — on CI's Node 18.
- Safe modification: Add an `.nvmrc` (or `engines` in `package.json`) matching the CI Node version, or bump CI to Node 20/22 to match local development.
- Test coverage: None.

## Scaling Limits

**No test suite, no type-checking gate, no lint gate in CI:**
- Current capacity: Zero automated verification beyond `next build` succeeding. `npm run lint` exists as a script (`package.json:9`) but is never invoked in either GitHub Actions workflow.
- Limit: As WebGL/video code is added — inherently more complex, more stateful (canvas lifecycle, video playback state, resize/orientation handling) than the current static-JSX pages — regressions will only be caught by manual visual inspection. There is currently no `.test.`/`.spec.` file anywhere in `src/` (confirmed via `find . -name "*.test.*" -o -name "*.spec.*"`, excluding `node_modules`).
- Scaling path: At minimum, add `npm run lint` and `npx tsc --noEmit` as required steps in `.github/workflows/nextjs.yml` before `npm run build`, so type errors in new WebGL/video component props (a common source of runtime canvas errors) are caught pre-merge. Consider a minimal Playwright smoke test (the repo already has a stray `.playwright-mcp/` directory, suggesting Playwright tooling has been explored) asserting the new WebGL canvas/video element actually mounts without throwing.

## Dependencies at Risk

**`next@^14.0.1` declared, `next@14.2.35` actually installed — one major version behind current Next.js:**
- Risk: `package.json:12` pins `"next": "^14.0.1"`; the installed version (per both lockfiles) is `14.2.35`, the last Next 14.x release line. Next.js 15 (and its React 19 support, improved Turbopack, and native `next.config.ts` support) is not adopted.
- Impact: React is pinned to `^18.2.0` (`package.json:13-14`); any React-based WebGL wrapper library (react-three-fiber, drei) will need to target React 18 APIs, not React 19. This is a real constraint on library selection for the WebGL work, not a defect, but should inform dependency choices.
- Migration plan: Not urgent given the site's static/simple nature, but if the WebGL/video work grows in scope, evaluate a Next 15 + React 19 upgrade first (would also make `next.config.ts` actually functional, eliminating the dead-file issue described above natively).

## Missing Critical Features

**No `robots.txt` or sitemap:**
- Problem: `public/` contains no `robots.txt` or `sitemap.xml`, and no `src/app/robots.ts`/`sitemap.ts` route handlers exist.
- Blocks: Cannot selectively exclude `/goals` from search indexing (compounds the privacy issue above) and gives no SEO sitemap for the marketing pages that do want indexing.

**No `alt`/dimension consistency audit for images used as decorative vs. content:**
- Problem: Most images have reasonable `alt` text, but `Header.tsx`'s logo `Image` (`android-chrome-512x512.png`, a 512x512 PWA icon reused as the nav logo) is being scaled down to `h-10 w-auto` from a 512x512 source — works, but is not the semantically correct asset (a dedicated logo file `mvforster-logo.png`/`mvforster-logo.jpg` exists in `public/` at only 39 bytes, i.e., empty/corrupt placeholder files, unused).
- Blocks: `public/mvforster-logo.png` and `public/mvforster-logo.jpg` are both 39-byte stub files (essentially empty) — if anyone ever swaps the header logo to use these files expecting a real logo, it will silently break/render nothing.

## Test Coverage Gaps

**Zero automated tests anywhere in the repository:**
- What's not tested: Everything — no unit, integration, or E2E tests exist (`find . -name "*.test.*" -o -name "*.spec.*"` excluding `node_modules`/`.next` returns nothing). No test runner (Jest/Vitest/Playwright test) is declared as a dependency in `package.json`.
- Files: N/A (repo-wide absence)
- Risk: Introducing WebGL (canvas context creation, shader compilation, resize handling) and video (autoplay policies, mobile Safari quirks, poster/fallback handling) without any smoke test means regressions ship straight to the public custom domain (`mvforster.com`) with no safety net beyond manual QA.
- Priority: High before or during the WebGL/video phase — at minimum a Playwright smoke test that loads each route and asserts no console errors and that the canvas/video element mounts would catch the most common class of "works in dev, breaks in static export" bugs (e.g., `window`/`document` access during SSR in a component missing `"use client"`).

---

*Concerns audit: 2026-09-29*

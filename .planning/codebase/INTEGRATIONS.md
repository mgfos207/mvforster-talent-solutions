# External Integrations

**Analysis Date:** 2026-09-29

## APIs & External Services

**None.** This is a fully static marketing/portfolio site (Next.js `output: 'export'`). There are no API routes (`src/app/api/` does not exist), no server actions, no third-party SDK imports, and no `fetch()` calls anywhere in `src/`.

**Fonts:**
- Google Fonts (`Inter`) - loaded at build time via `next/font/google` in `src/app/layout.tsx:2,5-8`. This is fetched and self-hosted at build time by Next.js, not a runtime API dependency.

## Data Storage

**Databases:**
- None. No database client, ORM, or connection string exists anywhere in the codebase.

**File Storage:**
- Local filesystem only. All images are static assets checked into `public/` (e.g. `public/mvforster-logo.png`, `public/office-bg.jpg`, `public/family/family1.jpg`) and referenced directly by Next.js's static `<Image>`/`<img>` usage.

**Caching:**
- None (build-time only; no runtime cache layer).

## Authentication & Identity

**Auth Provider:**
- None. No login, session, or identity code exists. The site is entirely public/unauthenticated content.

## Monitoring & Observability

**Error Tracking:**
- None. No Sentry, Bugsnag, or similar SDK detected.

**Logs:**
- None (static site; no runtime logging).

## CI/CD & Deployment

**Hosting:**
- GitHub Pages, using a custom apex domain: `mvforster.com` (declared in root `CNAME` file, published as part of the static export).

**CI Pipeline:**
- GitHub Actions - `.github/workflows/nextjs.yml` ("Deploy Next.js site to Pages")
  - Trigger: push to `main`, or manual `workflow_dispatch`
  - Steps: checkout → `actions/setup-node@v4` (Node 18) → `npm ci` → `npm run build` → `actions/upload-pages-artifact@v4` (uploads `./out`) → `actions/deploy-pages@v4`
  - Permissions: `contents: read`, `pages: write`, `id-token: write`
- A second file, `.github/workflows/.nextoldyml`, contains an older/more elaborate version of the same pipeline (adds `actions/cache@v3` for `.next/cache`, uses `actions/checkout@v3` / `setup-node@v3` / `configure-pages@v3` / `upload-pages-artifact@v3` / `deploy-pages@v3`). Because its filename does not end in `.yml`/`.yaml`, **GitHub Actions does not register or run it** — it is inert legacy content, not a second active pipeline. No workflow conflict occurs in practice, but it should be deleted or renamed to avoid confusion about which pipeline is authoritative.

## Environment Configuration

**Required env vars:**
- None. No `.env*` files exist and no code reads `process.env`.

**Secrets location:**
- Not applicable — no secrets are used. The GitHub Actions workflow requires only the default `GITHUB_TOKEN`-derived OIDC permissions (`id-token: write`, `pages: write`) for Pages deployment, no custom secrets configured.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None. The only outbound references are plain `<a>` links to external profiles: LinkedIn (`src/app/page.tsx:250`, `src/app/about/page.tsx:23`) and GitHub (`src/app/about/page.tsx:34`), plus a `mailto:micah@mvforster.com` link (`src/app/page.tsx:241`). These are static hyperlinks, not API integrations.

---

*Integration audit: 2026-09-29*

---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, tailwindcss, postcss, nodejs, ci, design-tokens]

# Dependency graph
requires: []
provides:
  - "CI pinned to Node 22 via a single .nvmrc read by actions/setup-node"
  - "Tailwind v4 pipeline (tailwindcss@4.3.3 + @tailwindcss/postcss@4.3.3) compiling real CSS"
  - "Semantic navy/teal/coral design tokens in globals.css @theme (surface, surface-muted, ink, ink-muted, brand, brand-strong, accent, cta, on-brand, on-brand-muted, on-cta, border)"
  - "Working Inter font wiring (--font-inter resolves through font-sans)"
  - "Single canonical PostCSS config; zero tailwind.config.* files; no pnpm artifacts; no dead workflow file"
affects: ["01-02", "01-03", "01-04", "01-05", "01-06"]

# Tech tracking
tech-stack:
  added: ["tailwindcss@4.3.3", "@tailwindcss/postcss@4.3.3"]
  patterns:
    - "CSS-first Tailwind v4 config (@import \"tailwindcss\" + @theme) instead of JS/TS tailwind.config.*"
    - "Semantic color tokens only (bg-surface, text-ink, bg-cta, etc.) — raw Tailwind palette classes (bg-gray-800, text-primary) still exist in page.tsx/Header.tsx pending 01-03/01-04 token-rename plans"
    - "--font-inter defined on <html>, consumed via font-sans utility (@theme inline) rather than hardcoded on <body>"

key-files:
  created:
    - .nvmrc
  modified:
    - .github/workflows/nextjs.yml
    - package.json
    - package-lock.json
    - postcss.config.mjs
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/components/Header.tsx

key-decisions:
  - "Node 22 (Maintenance LTS to Apr 2027) chosen over Node 24 — matches local dev runtime exactly (v22.23.2), eliminating a local/CI version mismatch for the rest of the milestone. Both satisfy Next 16's >=20.9.0 floor."
  - "Manual Tailwind v3->v4 rewrite instead of running npx @tailwindcss/upgrade — this project's actual class usage had only 2 v3-only names in live source (bg-gradient-to-t, backdrop-blur-sm), so a manual edit was faster and more auditable than an extra npx package fetch for a ~3-file Tailwind surface."
  - "Pinned tailwindcss/@tailwindcss/postcss/postcss to exact versions (no caret ranges) per the plan's threat model (T-01-SC) — npm install's default caret ranges were tightened to exact pins in package.json before regenerating the lockfile."

patterns-established:
  - "Semantic design tokens defined once in globals.css @theme, consumed via utility classes (bg-surface, text-ink-muted, bg-cta) — later phases retune shades without renaming classes"
  - "Each Tailwind/Node/Next upgrade step is verified independently with its own npm ci && npm run build + targeted grep checks against the actual CSS (not just build success) before moving to the next step"

requirements-completed: [FOUND-01, FOUND-03, FOUND-04]

# Metrics
duration: 10min
completed: 2026-10-03
---

# Phase 1 Plan 1: Node 22 + Tailwind v4 Foundation Summary

**CI moved to Node 22 via `.nvmrc`, and Tailwind v4.3.3 now compiles a real semantic navy/teal/coral token palette (12 `@theme` colors) with dark mode removed and Inter font wiring fixed.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-10-02T19:55:00-05:00 (approx)
- **Completed:** 2026-10-02T19:58:57-05:00
- **Tasks:** 2
- **Files modified:** 11 (3 created/deleted config files, 8 modified)

## Accomplishments
- CI builds on Node 22 (`.nvmrc` + `node-version-file`), with `engines.node: ">=22"` added to `package.json` so local dev matches CI
- Removed the dead `.github/workflows/.nextoldyml` workflow and the untracked `pnpm-lock.yaml`/`pnpm-workspace.yaml` files — npm stays canonical
- Tailwind v4.3.3 + `@tailwindcss/postcss@4.3.3` installed (exact pins); `autoprefixer` removed since v4 prefixes internally
- `globals.css` rewritten to v4 syntax (`@import "tailwindcss"`) with a 12-token semantic `@theme` (navy/teal/coral palette, all contrast-checked against WCAG AA in `01-01-PLAN.md`) and the `prefers-color-scheme: dark` block fully removed
- Fixed the Inter font bug: `--font-inter` is now defined on `<html>` and resolved through the `font-sans` utility instead of pointing at nonexistent Geist variables with an Arial fallback
- Deleted `postcss.config.js`, `tailwind.config.js`, `tailwind.config.ts` — exactly one `postcss.config.mjs` remains, referencing `@tailwindcss/postcss`
- Two mechanical v4 class renames applied: `bg-gradient-to-t` -> `bg-linear-to-t` (`page.tsx`), `backdrop-blur-sm` -> `backdrop-blur-xs` (`Header.tsx`)
- Verified `npm ci && npm run build` passes after each of the two upgrade steps, with the second step's emitted CSS inspected directly (`--color-surface`, `--color-ink`, `.text-center`, `.grid`, `--font-inter` all present; zero `@tailwind` directives remain)

## Task Commits

Each task was committed atomically:

1. **Task 1: Upgrade step 1 — Node 22 in CI, single .nvmrc, remove dead workflow and pnpm files** - `6da9f86` (chore)
2. **Task 2: Upgrade step 2 — Tailwind v4 with semantic palette @theme, no dark mode, working Inter font** - `83155d3` (feat)

## Files Created/Modified
- `.nvmrc` - Pins Node 22 for local dev and CI
- `.github/workflows/nextjs.yml` - `node-version-file: '.nvmrc'` instead of hardcoded `node-version: '18'`
- `package.json` - Added `engines.node: ">=22"`; swapped `tailwindcss@3.3.3`/`autoprefixer` for `tailwindcss@4.3.3`/`@tailwindcss/postcss@4.3.3`
- `package-lock.json` - Regenerated for the Tailwind v4 dependency swap
- `postcss.config.mjs` - Now the sole PostCSS config, referencing `@tailwindcss/postcss`
- `src/app/globals.css` - Full v4 rewrite: `@import "tailwindcss"`, 12-token semantic `@theme`, `@theme inline` for `--font-sans`, `@layer base` body rule; dark-mode block and dead Geist vars removed
- `src/app/layout.tsx` - Moved `inter.variable` to `<html>`, body now uses `font-sans antialiased`
- `src/app/page.tsx` - `bg-gradient-to-t` -> `bg-linear-to-t` (line 52 only)
- `src/components/Header.tsx` - `backdrop-blur-sm` -> `backdrop-blur-xs` (line 6 only)

**Deleted:** `.github/workflows/.nextoldyml`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `postcss.config.js`, `tailwind.config.js`, `tailwind.config.ts`

## Decisions Made
- **Node 22 over Node 24:** matches the already-installed local dev runtime (v22.23.2), avoiding a local/CI mismatch for the rest of the milestone. Documented in plan as Claude's discretion per CONTEXT.md.
- **Manual Tailwind v3->v4 rewrite instead of the official `@tailwindcss/upgrade` codemod:** only 2 v3-only class names existed in live source; a manual edit was faster and fully auditable for this small surface.
- **Exact version pins (no `^` ranges)** for `tailwindcss`, `@tailwindcss/postcss`, and `postcss` in `package.json`/`package-lock.json`, per the plan's threat model (T-01-SC) requiring pinned, lockfile-verified installs of new build-tooling dependencies.

### Final Palette (D-01/D-03/D-04)

| Token | Hex | Role |
|---|---|---|
| `surface` | `#FFFFFF` | Page/card background |
| `surface-muted` | `#F4F6F9` | Alternating section background |
| `ink` | `#0F1B2D` | Default body text |
| `ink-muted` | `#4A5568` | Secondary text |
| `brand` | `#0B2545` | Navy — headings, buttons, header bar |
| `brand-strong` | `#071A33` | Deep navy — hover states, hero overlay |
| `accent` | `#0F766E` | Teal — sub-headings |
| `cta` | `#E76F51` | Coral — booking CTA background (first consumer in Phase 3) |
| `on-brand` | `#FFFFFF` | Text on brand/ink/brand-strong backgrounds |
| `on-brand-muted` | `#C9D4E0` | Nav-link text on navy header |
| `on-cta` | `#0B2545` | Text on coral CTA |
| `border` | `#DCE3EA` | Card borders, header rule (decorative) |

All pairs used pass WCAG AA per the contrast table in `01-01-PLAN.md` (contents moved verbatim into `globals.css`'s `@theme` block; see plan for the full ratio table).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Pinned exact dependency versions instead of npm's default caret ranges**
- **Found during:** Task 2 (Tailwind v4 install)
- **Issue:** `npm install -D tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 postcss@^8.5.16` wrote caret-prefixed ranges (`^4.3.3`, `^8.5.28`) into `package.json`, which conflicts with the plan's acceptance criteria (`grep -q '"tailwindcss": "4.3.3"'`, exact match) and the plan's own threat model (T-01-SC: "Install exact versions (`4.3.3`)").
- **Fix:** Edited `package.json` to use exact version strings (no `^`) for `tailwindcss`, `@tailwindcss/postcss`, and `postcss`, then ran `npm install` again to regenerate `package-lock.json` against the pinned versions.
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `grep -q '"tailwindcss": "4.3.3"' package.json` passes; `npm ci && npm run build` still succeeds with the pinned versions.
- **Committed in:** `83155d3` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical: exact version pinning)
**Impact on plan:** Necessary for the plan's own stated threat mitigation and acceptance criteria. No scope creep.

## Issues Encountered
None beyond the version-pinning deviation above.

## User Setup Required
None - no external service configuration required. No `.env` files, no secrets.

## Next Phase Readiness
- Plan 01-02 (Next.js 16 upgrade + prefetch smoke test) can proceed — Node 22 and Tailwind v4 are both verified working with the unchanged Next 14 app.
- Plans 01-03/01-04 (section extraction) now have real semantic utility classes (`bg-surface`, `text-brand`, etc.) to apply when renaming `page.tsx`/`about/page.tsx`/`Header.tsx`'s old `text-primary`/`bg-gray-*`/`dark:` classes — those renames are explicitly out of scope for this plan and still present in source today (expected, per plan's Note).
- No blockers identified.

---
*Phase: 01-foundation*
*Completed: 2026-10-03*

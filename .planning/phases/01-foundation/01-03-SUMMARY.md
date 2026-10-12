---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [nextjs, tailwindcss, react, server-components]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Tailwind v4 semantic design tokens (01-01), Next.js 16 static export verified (01-02)"
provides:
  - "Five Home section server components under src/components/sections/ (Hero, Services, Expertise, WhyChooseUs, Contact)"
  - "Composition-only src/app/page.tsx (17 lines)"
  - "Tokenized Header.tsx (single bg-brand/95 header, text-on-brand-muted nav links)"
  - "Stale page.tsx.bak/.new and unused boilerplate SVGs (window.svg, next.svg, vercel.svg) removed"
affects: ["01-04", "01-05", "01-06", "phase 2 (WebGL hero swap)", "phase 3 (video sections)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Section components under src/components/sections/ are plain server components (no 'use client', no props)"
    - "Semantic Tailwind utilities only (bg-surface, text-brand, text-accent, text-ink-muted, border-border, text-on-brand, bg-brand-strong/65) — no raw palette or dark: classes"
    - "Route page.tsx files are composition-only: import sections, render them in fixed order inside <main>"

key-files:
  created:
    - src/components/sections/Hero.tsx
    - src/components/sections/Services.tsx
    - src/components/sections/Expertise.tsx
    - src/components/sections/WhyChooseUs.tsx
    - src/components/sections/Contact.tsx
  modified:
    - src/app/page.tsx
    - src/components/Header.tsx
  deleted:
    - src/app/page.tsx.bak
    - src/app/page.tsx.new
    - public/window.svg
    - public/next.svg
    - public/vercel.svg

key-decisions:
  - "Flat src/components/sections/ folder (not sections/home/*) — matches FOUND-05 wording literally and avoids an extra nesting level since About's sections (01-04) use distinct names (AboutHero, etc.) with no collision risk"
  - "Kept bg-brand-strong/65 for the hero overlay and bg-brand/95 for the header exactly as specified in the plan's contrast-checked mapping table — no further tuning needed"

patterns-established:
  - "Each Home section is independently swappable — Phase 2/3 can replace Hero.tsx with a WebGL version or add video to Services/Contact without touching page.tsx beyond the import"
  - "Commented-out dead JSX is deleted on sight during refactors, not preserved (D-06), stopping the prior growing anti-pattern"

requirements-completed: [FOUND-05, FOUND-03, FOUND-04]

# Metrics
duration: 35min
completed: 2026-10-12
---

# Phase 1 Plan 3: Home Section Extraction Summary

**Split the monolithic 277-line Home page.tsx into five tokenized server-component sections (Hero, Services, Expertise, WhyChooseUs, Contact), reduced page.tsx to a 17-line composition, tokenized Header.tsx to a single navy header background, and deleted stale page.tsx.bak/.new plus three unused boilerplate SVGs.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-10-12T00:50:00Z (approx)
- **Completed:** 2026-10-12T01:23:41Z
- **Tasks:** 2
- **Files modified:** 12 (5 created, 2 modified, 5 deleted)

## Accomplishments
- Extracted Hero, Services, Expertise, WhyChooseUs, and Contact into `src/components/sections/*.tsx`, each a server component with no props and no `'use client'`
- Deleted the commented-out hero CTA block (old lines 32-49) and the commented "Talent Assessment" card (old lines 67-73) entirely — not moved, not restored (D-06)
- Removed every `dark:` class across the five sections and `Header.tsx` (D-02); remapped old `text-primary`/`text-secondary`/`text-gray-700`/`bg-white`/`bg-gray-50`/`border-gray-100`/`text-white`/`bg-black/50`/`from-background` classes to the semantic tokens established in 01-01 (`text-brand`, `text-accent`, `text-ink-muted`, `bg-surface`, `bg-surface-muted`, `border-border`, `text-on-brand`, `bg-brand-strong/65`, `from-surface`)
- Rewrote `src/app/page.tsx` to only compose `<Header />` + the five sections inside `<main>`, in the original order (D-08) — 17 lines, no `next/image` import, no inline `<section>`
- Tokenized `Header.tsx`: collapsed the pre-existing double-background bug (`bg-gray-800` + `bg-background/90`) into a single `bg-brand/95`, remapped nav links to `text-on-brand-muted hover:text-on-brand`, deleted the commented "Jobs" link (D-06)
- Deleted `src/app/page.tsx.bak`, `src/app/page.tsx.new`, and the now-fully-unused boilerplate SVGs `public/window.svg`, `public/next.svg`, `public/vercel.svg` (FOUND-04) — confirmed via grep that no remaining source file references them; kept `public/globe.svg` and `public/file.svg` since `Services.tsx` still uses them
- Verified `npm run build` produces `out/index.html` with "Our Services", "Our Expertise", "Why Choose MVForster Talent Solutions", and "Get in Touch" in original order, and the emitted CSS contains `.text-brand`, `.bg-surface-muted`, `.text-accent`, `.text-on-brand-muted`, and `--color-brand`
- `npx tsc --noEmit` and `npm run lint` both exit 0 (lint shows only 3 pre-existing warnings in the untouched, out-of-scope `src/app/goals/page.tsx`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract the five Home sections with semantic tokens and no dead JSX** - `81977fb` (feat)
2. **Task 2: Compose Home from sections, tokenize Header, delete stale page and SVG files** - `2bed77c` (refactor)

## Files Created/Modified
- `src/components/sections/Hero.tsx` - Home hero section; `bg-brand-strong/65` overlay, `text-on-brand` text container, hero CTA comment block deleted
- `src/components/sections/Services.tsx` - Home services section; "Talent Assessment" commented card deleted, `window.svg` reference gone with it
- `src/components/sections/Expertise.tsx` - Home expertise section; 17 `<li>` items preserved verbatim (5 Technology + 5 Behavioral Health + 7 Roles)
- `src/components/sections/WhyChooseUs.tsx` - Home why-choose-us section; 8 `<li>` items preserved verbatim (4 Companies + 4 Candidates)
- `src/components/sections/Contact.tsx` - Home contact section; mailto and LinkedIn (`target="_blank" rel="noopener noreferrer"`) links preserved verbatim
- `src/app/page.tsx` - Reduced from 277 to 17 lines; composes `Header` + five sections only
- `src/components/Header.tsx` - Single `bg-brand/95` header background, `text-on-brand-muted hover:text-on-brand` nav links (×4), commented Jobs link deleted, imports switched to double quotes

**Deleted:** `src/app/page.tsx.bak`, `src/app/page.tsx.new`, `public/window.svg`, `public/next.svg`, `public/vercel.svg`

## Decisions Made
- Flat `src/components/sections/` layout chosen over `sections/home/*` nesting — the About page's sections (01-04, parallel plan) use distinct names (`AboutHero`, `Experience`, etc.) so there's no naming collision risk, and the flat layout matches FOUND-05's literal wording.
- No additional token or layout changes beyond the plan's explicit class-mapping table — followed D-05 (same content/order/layout) exactly.

## Deviations from Plan

None - plan executed exactly as written. All class mappings, deletions, and file removals matched the plan's interfaces block and class mapping table without needing any Rule 1-4 adjustments.

## Issues Encountered

None. Both tasks' automated verification commands passed on the first attempt, including the `npm run build`/`npm run lint` gate and the built-CSS content checks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Home is fully section-ized and ready for Phase 2 to swap `Hero.tsx` for a WebGL version without touching `page.tsx` beyond the import, and for Phase 3 to add ambient video to `Services.tsx`/`Contact.tsx` independently.
- `Header.tsx` now uses only semantic tokens; Phase 3's "Book an intro chat" CTA addition has a clean, single-background header to build on.
- This plan ran in parallel with 01-04 (About page sections) and 01-05 (capabilities provider) in separate worktrees — only files in this plan's `files_modified` list were touched (verified via `git diff --stat` against the shared base commit).
- No blockers identified.

## Self-Check: PASSED

- FOUND: src/components/sections/Hero.tsx
- FOUND: src/components/sections/Services.tsx
- FOUND: src/components/sections/Expertise.tsx
- FOUND: src/components/sections/WhyChooseUs.tsx
- FOUND: src/components/sections/Contact.tsx
- FOUND: commit 81977fb
- FOUND: commit 2bed77c

---
*Phase: 01-foundation*
*Completed: 2026-10-12*

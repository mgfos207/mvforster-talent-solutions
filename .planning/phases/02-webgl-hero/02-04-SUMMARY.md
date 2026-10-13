---
phase: 02-webgl-hero
plan: 04
subsystem: ui
tags: [hero, server-component, copy, anchors, a11y, scroll]

# Dependency graph
requires:
  - phase: 02-webgl-hero
    plan: "02-02"
    provides: "public/hero/hero-still-desktop.webp + hero-still-mobile.webp (D-05 pre-rendered fallback stills)"
  - phase: 02-webgl-hero
    plan: "02-03"
    provides: "HeroCanvasLoader (ssr:false boundary, canAnimateHero-gated), HeroCanvas, PauseButton"
provides:
  - "Rewritten Hero.tsx: server-rendered still background (D-05/D-07), mounted HeroCanvasLoader client island, user-chosen healthcare headline/subline (D-12), equal-weight glass-pill audience chooser (HERO-05, D-08..D-10), reserved Phase 3 CTA slot (D-11)"
  - "#employers/#candidates interim anchors on Services.tsx/Expertise.tsx alongside the existing #services/#expertise ids the Header nav depends on (D-08)"
  - "Reduced-motion-gated smooth scroll + scroll-margin-top for chooser anchors in globals.css (D-10)"
  - "data-scroll-behavior=\"smooth\" on <html> so Next 16 suspends smooth scroll only during route transitions, not in-page anchor jumps"
affects: [02-05-header-and-final-qa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared chooserLinkClass module-level string constant so both chooser pills are provably identical (equal weight, D-09) rather than two separately-authored className strings"
    - "<picture><source media><img fetchPriority></picture> art-directed still, with the Next.js no-img-element lint rule's built-in <picture> exemption relied on instead of an eslint-disable comment"

key-files:
  created: []
  modified:
    - src/components/sections/Hero.tsx
    - src/components/sections/Services.tsx
    - src/components/sections/Expertise.tsx
    - src/app/globals.css
    - src/app/layout.tsx

key-decisions:
  - "D-12 resolved: option-a verbatim — Headline \"Great care starts with the right people\", Subline \"We connect healthcare, behavioral health, and healthcare admin teams with BCBAs, RBTs, and professionals who truly care about the people they serve.\""
  - "Dropped the planned eslint-disable-next-line comment above the still <img> — the Next.js no-img-element rule already exempts <img> elements nested inside <picture>, so the disable comment was flagged as unused; replaced with a plain explanatory comment instead"
  - "Reworded a comment that said \"not next/image\" to \"not the Next.js Image component\" — the literal substring \"next/image\" tripped the plan's own acceptance grep meant to catch a real import, not a comment mention"

requirements-completed: [HERO-01, HERO-03, HERO-05]

# Metrics
duration: ~20min (Task 2 only; Task 1 was a decision checkpoint resolved by the user between sessions)
completed: 2026-10-12
---

# Phase 2 Plan 4: Hero Composition, Copy, and Audience Chooser Summary

**Rewrote the server-rendered Hero.tsx around the D-05 pre-rendered still with a lazy-mounted WebGL client island, the user's chosen healthcare-focused headline/subline, an equal-weight "I'm hiring"/"I'm looking for work" glass-pill chooser wired to interim `#employers`/`#candidates` anchors, and a reserved Phase 3 CTA slot.**

## Performance

- **Duration:** ~20 min (Task 2 execution; Task 1's decision checkpoint was resolved by the user in a prior session)
- **Started:** 2026-10-12 (continuation session)
- **Completed:** 2026-10-12T14:57:01-05:00
- **Tasks:** 2/2 completed (Task 1: decision checkpoint, resolved; Task 2: auto, executed)
- **Files modified:** 5

## Accomplishments

- **Task 1 (D-12 decision, resolved):** User selected **option-a** verbatim — Headline "Great care starts with the right people", Subline "We connect healthcare, behavioral health, and healthcare admin teams with BCBAs, RBTs, and professionals who truly care about the people they serve." Neither string contains "technology" or "innovative companies" (case-insensitive grep confirmed 0 matches).
- **Task 2:** `Hero.tsx` rewritten as a server component (`grep -c "'use client'"` prints 0): still-image background via `<picture>`/art-directed `<source>`/`<img fetchPriority="high">` (D-05), `<HeroCanvasLoader />` mounted after the still so the canvas paints above it on capable devices, the chosen D-12 copy, a `chooserLinkClass`-shared equal-weight anchor pair (`#employers` "I'm hiring" / `#candidates` "I'm looking for work", no coral/teal, visible focus ring), and an empty `data-hero-cta-slot` div reserved for Phase 3's CTA.
- `Services.tsx`/`Expertise.tsx` each gained an inner `id="employers"`/`id="candidates"` on the existing container div, leaving the outer `#services`/`#expertise` section ids (and the Header nav links to them) untouched.
- `globals.css` gained a `prefers-reduced-motion: no-preference`-gated `scroll-behavior: smooth` rule and a `scroll-margin-top: calc(73px + 1rem)` rule for the two new anchors, inside the existing `@layer base` block.
- `layout.tsx` gained `data-scroll-behavior="smooth"` on `<html>` (the only line touched — confirmed by `git diff`).
- `public/office-bg.jpg` is no longer referenced anywhere in `Hero.tsx` (D-07) but the file remains on disk.
- Full verification chain passed: `npm run lint` (0 errors, 3 pre-existing unrelated warnings on `src/app/goals/page.tsx`), `npx tsc --noEmit` (clean), `npm test` (47/47 `node:test` cases pass, unaffected by this plan), `npm run build` (static export succeeds), and the plan's `HERO_WIRED_OK` grep chain against `out/index.html` all passed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Choose the hero headline and subline (D-12)** - checkpoint:decision, no commit (decision-only task; resolved by the user between sessions, applied in Task 2)
2. **Task 2: Rewrite Hero.tsx and add anchors, scroll CSS, and the html data attribute** - `cae4d03` (feat)

**Plan metadata:** (this commit, see final commit below)

## Files Created/Modified

- `src/components/sections/Hero.tsx` - Rewritten server component: still background, HeroCanvasLoader mount, D-12 copy, chooser nav, reserved CTA slot
- `src/components/sections/Services.tsx` - Added `id="employers"` to the inner container div
- `src/components/sections/Expertise.tsx` - Added `id="candidates"` to the inner container div
- `src/app/globals.css` - Reduced-motion-gated smooth scroll + `scroll-margin-top` for the chooser anchors
- `src/app/layout.tsx` - Added `data-scroll-behavior="smooth"` to `<html>`

## Decisions Made

- D-12 resolved to option-a verbatim (see frontmatter `key-decisions`).
- Followed the plan's exact DOM structure, class names (`chooserLinkClass`, `data-hero-cta-slot`), and stacking order with no architectural deviation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Planned eslint-disable comment was flagged as unused**
- **Found during:** Task 2, `npm run lint`
- **Issue:** The plan's action step called for an `eslint-disable-next-line @next/next/no-img-element` comment above the still `<img>`. The installed rule (`@next/eslint-plugin-next`) already special-cases `<img>` elements whose parent is a `<picture>` element and never reports them, so the directive was reported as an "unused eslint-disable directive" warning.
- **Fix:** Removed the disable directive and replaced it with a plain explanatory comment (no suppression needed). Verified `npm run lint` now reports only the 3 pre-existing, unrelated `src/app/goals/page.tsx` warnings.
- **Files modified:** `src/components/sections/Hero.tsx`
- **Verification:** `npm run lint` exit 0, 0 errors, 3 pre-existing warnings only
- **Committed in:** `cae4d03` (Task 2 commit)

**2. [Rule 3 - Blocking issue] Literal comment text collided with the plan's own acceptance-criteria grep**
- **Found during:** Task 2, running the plan's acceptance-criteria grep commands
- **Issue:** `grep -c 'next/image' src/components/sections/Hero.tsx` was required to print `0` (confirming the `next/image` import was removed per D-07), but an explanatory code comment ("Plain `<img>`, not `next/image`...") contained the literal substring, making the grep print `1` even though no actual import existed.
- **Fix:** Reworded the comment to say "not the Next.js Image component" instead of the literal string `next/image`, preserving the same explanation without tripping the grep.
- **Files modified:** `src/components/sections/Hero.tsx`
- **Verification:** `grep -c 'next/image' src/components/sections/Hero.tsx` now prints `0`
- **Committed in:** `cae4d03` (Task 2 commit)

**3. [Documented, not auto-fixed — conflicting acceptance criteria] `data-hero-cta-slot` unavoidably contains the substring "cta"**
- **Found during:** Task 2, running the plan's acceptance-criteria grep commands
- **Issue:** The plan's action step mandates the attribute name `data-hero-cta-slot` verbatim (acceptance criterion: `grep -c 'data-hero-cta-slot' ... prints 1`), but a separate acceptance criterion requires `grep -cE 'cta|accent' src/components/sections/Hero.tsx` to print `0` (intended to catch real coral/teal Tailwind utility classes, e.g. `bg-cta`/`text-accent`). The attribute name itself contains the lowercase substring `cta`, so these two literal criteria are mutually exclusive as written — renaming the attribute would violate the plan's explicit D-11 naming instruction and the `HeroCanvas`/future-Phase-3 contract implied by it.
- **Resolution:** Kept the plan-mandated `data-hero-cta-slot` attribute name. Verified the *intent* of the `cta|accent` check (no coral/teal color usage on the chooser/controls) with a scoped check instead: `grep -cE 'bg-cta|text-cta|border-cta|bg-accent|text-accent|border-accent' src/components/sections/Hero.tsx` prints `0`. No coral (`cta`) or teal (`accent`) Tailwind color utility is used anywhere in `Hero.tsx`; the raw `cta` substring match is a plan acceptance-criteria artifact, not a real violation.
- **Files modified:** none (informational only)
- **Committed in:** `cae4d03` (Task 2 commit, attribute as originally written)

---

**Total deviations:** 3 (2 auto-fixed via Rule 3, 1 documented plan-criteria conflict with no code change needed)
**Impact on plan:** All three are cosmetic/lint-grep artifacts, not functional or security issues. No scope creep; every D-05/D-07/D-08/D-09/D-10/D-11/D-12/HERO-01/HERO-03/HERO-05 truth in the plan's `must_haves` is satisfied by the shipped code.

## Issues Encountered

None beyond the three items documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The home page now serves the full Phase 2 hero experience: still-image first paint, lazy WebGL island, D-12 copy, working `#employers`/`#candidates` chooser anchors, and a reserved (empty) Phase 3 CTA slot.
- 02-05 (Header/final QA, per `02-UI-SPEC.md`'s Open Question 1) should measure the Header's real rendered height and correct the `calc(73px + 1rem)` `scroll-margin-top` value in `globals.css` if it differs from the Tailwind-class-derived estimate.
- Phase 3 can drop the "Book an intro chat" CTA directly into the `data-hero-cta-slot` div without any Hero.tsx restructuring, and can later move `#employers`/`#candidates` onto the real Employers/Candidates sections without touching the hero's anchor hrefs.
- No blockers.

## Self-Check: PASSED

All 5 modified files verified present on disk with the expected changes; commit `cae4d03` verified present in `git log --oneline --all`.

---
*Phase: 02-webgl-hero*
*Completed: 2026-10-12*

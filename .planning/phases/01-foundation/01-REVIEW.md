---
phase: 01-foundation
reviewed: 2026-10-11T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - .github/workflows/nextjs.yml
  - .nvmrc
  - eslint.config.mjs
  - package.json
  - postcss.config.mjs
  - scripts/capabilities.test.mjs
  - src/app/about/page.tsx
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/components/Header.tsx
  - src/components/sections/AboutHero.tsx
  - src/components/sections/Contact.tsx
  - src/components/sections/Education.tsx
  - src/components/sections/Experience.tsx
  - src/components/sections/Expertise.tsx
  - src/components/sections/Hero.tsx
  - src/components/sections/Services.tsx
  - src/components/sections/SkillsExpertise.tsx
  - src/components/sections/WhyChooseUs.tsx
  - src/hooks/useCapabilitySignals.ts
  - src/lib/capabilities.ts
  - src/providers/CapabilitiesProvider.tsx
  - src/types/capabilities.ts
  - tsconfig.json
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-11T00:00:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Phase 1 is a foundation refactor: it (a) extracts monolithic `page.tsx`/`about/page.tsx` markup into single-purpose section components with semantic Tailwind v4 design tokens, and (b) introduces a new capability-detection subsystem (`useCapabilitySignals` → `capabilities.ts` → `CapabilitiesProvider`) that Phase 2's WebGL hero/video will consume.

I read every listed file, cross-checked the capability-detection logic against its unit tests, ran `npm run build`, `npm run lint`, and `npm test` to verify claims empirically, and inspected the actual static HTML/CSS output in `out/` to confirm rendering behavior rather than assuming it from source alone.

**What's solid:**
- `deriveVerdicts`/`readSignals` in `src/lib/capabilities.ts` are pure, environment-injected, and match all 14 test cases in `scripts/capabilities.test.mjs` exactly (verified by running the suite — all pass).
- The fail-static design (`useCapabilities()` returns `STATIC_VERDICTS` outside a provider; `getServerSnapshot` returns `SSR_DEFAULT_SIGNALS`) correctly implements the "page works even if detection fails" core value.
- The WebGL context-limit concern is explicitly handled (`loseContext()` after probing, module-level memoization) — a good sign the authors thought about Phase 2 interop.
- Dead commented-out JSX blocks that existed pre-refactor (commented Hero CTAs, commented "Talent Assessment" card, commented "Jobs" nav link) were deleted rather than carried forward, and duplicate config files (`next.config.ts`, `next.config.jsold`, `tailwind.config.{js,ts}`, `postcss.config.js`, unused boilerplate SVGs) were removed. Both were known pre-existing anti-patterns that this phase actually fixed.
- `npm run build`, `npm run lint`, and `npm test` all pass cleanly against the reviewed file set.

**What needs attention:** one real (pre-existing, but still live) visual rendering bug in the header logo, and a gap between the new test suite and the CI pipeline that runs it. Neither is a correctness/security blocker, but both should be fixed before they're forgotten. See Warnings below for full detail, and Info for smaller quality nits (mostly in the newly extracted section components).

## Warnings

### WR-01: Header logo is stretched 3:1 against its actual 1:1 source image

**File:** `src/components/Header.tsx:10-17`
**Issue:** The `<Image>` for the logo declares `width={150} height={50}` (3:1 aspect ratio) but `public/android-chrome-512x512.png` is a 512×512 (1:1) square. I confirmed the actual built output (`out/index.html`) emits `<img width="150" height="50" class="h-10 w-auto" ...>` with no `object-fit`/`aspect-ratio` override. Modern browsers set `aspect-ratio: attr(width) / attr(height)` from these HTML attributes when CSS leaves one dimension `auto`; with `h-10` (40px) fixed and `w-auto`, the computed box is 40×120px — the square logo is stretched horizontally into a 3:1 rectangle, visibly distorting the brand mark in the header on every page.
This line is unchanged from before the refactor (pre-existing), but it's in a file this phase touched (className/color updates), is part of the requested review scope, and directly undermines the "calm, premium" visual goal stated in the project brief, so it's worth fixing now rather than carrying it into Phase 2.
**Fix:**
```tsx
<Image
  src="/android-chrome-512x512.png"
  alt="MVForster Talent Solutions"
  width={150}
  height={150}
  className="h-10 w-10"
  priority
/>
```
(or use a non-square logo asset if a wordmark/horizontal lockup is intended, and set `width`/`height` to match that asset's real aspect ratio).

### WR-02: New capability-detection test suite is not run in CI

**File:** `package.json:13`, `.github/workflows/nextjs.yml:16-21`
**Issue:** This phase adds `scripts/capabilities.test.mjs` (14 tests) covering `deriveVerdicts`/`readSignals` — logic explicitly called out in comments as "the ONLY place that maps raw signals to feature verdicts" that Phase 2's hero/video/scroll consumers must rely on rather than reimplement. The GitHub Actions workflow that gates deploys (`.github/workflows/nextjs.yml`) only runs `npm ci` and `npm run build`; it never runs `npm test`. A future change to `deriveVerdicts` that breaks a threshold rule (e.g. the `deviceMemory <= 2` or `effectiveType === "2g"` checks) would pass CI and deploy to production undetected, even though a test exists specifically to catch it.
**Fix:**
```yaml
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Info

### IN-01: Brand-color class on externally-referenced SVG `<Image>` icons has no effect

**File:** `src/components/sections/Services.tsx:11,18`
**Issue:** `<Image src="/globe.svg" ... className="text-brand" />` and the `file.svg` equivalent apply a Tailwind text-color utility to icons loaded via `next/image`, which renders them as `<img src="...">`. CSS `color`/`text-*` cannot reach into an externally-referenced SVG's fill unless the SVG itself is inlined and uses `fill="currentColor"` — and both `public/globe.svg` and `public/file.svg` hardcode `fill="#666"`. The class is dead code; the icons render in flat gray regardless of the brand theme. This existed before the refactor (carried forward verbatim), but since the theme was just rebuilt around semantic brand colors, it's a good time to fix.
**Fix:** Either inline the SVGs as JSX (so `fill="currentColor"` + `text-brand` works, matching the pattern already used for the LinkedIn/GitHub icons in `AboutHero.tsx`/`Contact.tsx`), or drop the dead `className` and recolor the source SVG files directly.

### IN-02: Inconsistent import alias usage in the new capabilities module

**File:** `src/lib/capabilities.ts:1-5`
**Issue:** `capabilities.ts` imports its types via a relative path (`"../types/capabilities"`), while the sibling files added in the same phase (`src/hooks/useCapabilitySignals.ts:5`, `src/providers/CapabilitiesProvider.tsx:6`) use the `@/` alias (`"@/types/capabilities"`). CLAUDE.md explicitly recommends preferring `@/` for new internal imports. Minor, but it's an avoidable inconsistency introduced within a single cohesive feature rather than inherited from old code.
**Fix:**
```ts
import type {
  CapabilityEnv,
  CapabilitySignals,
  CapabilityVerdicts,
} from "@/types/capabilities";
```

### IN-03: Repeated bullet-list markup duplicated across five new section components

**File:** `src/components/sections/Experience.tsx`, `SkillsExpertise.tsx`, `Education.tsx`, `Expertise.tsx`, `WhyChooseUs.tsx`
**Issue:** The `<li className="flex items-start gap-3"><span className="text-brand mt-1.5">•</span>...</li>` pattern (and its `text-xl`/no-`mt` variants) is copy-pasted dozens of times across these five newly-extracted files. This mirrors a pre-existing pattern (verbatim content was intentionally preserved per phase scope), but because this phase's whole purpose was componentization, extracting a shared `<BulletList>`/`<BulletItem>` component here would have been a natural, low-risk opportunity to also reduce duplication, and it's worth doing before more sections are added in later phases.
**Fix:** Introduce a small shared component, e.g. `src/components/ui/BulletList.tsx`, and replace the repeated `<ul>`/`<li>` blocks with it.

### IN-04: Duplicated inline LinkedIn icon SVG

**File:** `src/components/sections/AboutHero.tsx:24-26`, `src/components/sections/Contact.tsx:31-33`
**Issue:** The identical LinkedIn icon `<svg>`/`<path>` markup (same `d` attribute, ~900 characters) is duplicated verbatim in two separate new section components.
**Fix:** Extract to `src/components/icons/LinkedInIcon.tsx` (and similarly for the GitHub icon already duplicated-in-spirit if more social links are added later).

### IN-05: `useCapabilities()` has no consumers yet

**File:** `src/providers/CapabilitiesProvider.tsx:24-27`
**Issue:** `useCapabilities()` is exported but not imported anywhere else in the current `src/` tree. This appears to be intentional scaffolding for Phase 2 (the hero/video/scroll-animation consumers referenced in comments throughout `capabilities.ts` and `useCapabilitySignals.ts`), not dead code — flagging only so the phase-2 reviewer can confirm it actually gets wired up rather than quietly staying unused.
**Fix:** No action needed now; verify in Phase 2 review that `useCapabilities()` is actually consumed by the hero/video components it was built for.

---

_Reviewed: 2026-10-11T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

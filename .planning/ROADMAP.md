# Roadmap: MVForster Talent Solutions — Modern Site Refresh

## Overview

This milestone takes the site from a monolithic, EOL-stack static export with broken brand colors into a "calm, premium, human" marketing site that funnels every visitor toward booking an intro chat on Calendly. Work moves foundation-first: upgrade the stack and break the page into swappable sections with one shared capability check (Phase 1), then layer the highest-differentiation feature — the WebGL mesh-gradient hero — on that stable base (Phase 2), then build out the audience-split ambient video, "how it works" content, and the site-wide Calendly CTA that is the actual business goal (Phase 3), and finally apply the full visual system, scroll motion, and verify performance/accessibility/SEO targets are met (Phase 4).

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Upgrade the stack, fix broken design tokens, remove dead config, split the page into section components, and build the shared capability check (completed 2026-10-12)
- [ ] **Phase 2: WebGL Hero** - Replace the static hero with a mesh-gradient + connected-nodes WebGL background with graceful fallback and controls
- [ ] **Phase 3: Booking, Ambient Video & How It Works** - Site-wide Calendly CTA, audience-split ambient video, and 3-step "how it works" content
- [ ] **Phase 4: Visual System, Motion & Quality Validation** - Apply the new visual system and scroll motion sitewide, and verify performance, accessibility, and SEO

## Phase Details

### Phase 1: Foundation

**Goal**: The site runs on current tooling with working design tokens, a clean config surface, componentized sections, and one shared capability signal that every later feature reads.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, CAP-01
**Success Criteria** (what must be TRUE):

  1. CI builds and deploys the site from Node ≥ 20 to mvforster.com (no `basePath`) using Next.js 16 static export, and `/` and `/about` load and navigate correctly on the deployed site
  2. Brand color tokens (`text-primary`, `bg-primary`, etc.) render visibly on every page under Tailwind v4
  3. Only one canonical config file of each kind remains — no dead or duplicate config/page files (`next.config.jsold`, `page.tsx.bak`/`.new`, duplicate Tailwind/PostCSS configs, stray pnpm files)
  4. Each home-page section lives in its own component under `src/components/sections/`, with `page.tsx` only composing them
  5. A single shared capability check (WebGL support, `prefers-reduced-motion`, data-saver/low-power) exists and is ready for the hero, video, and motion features to consume

**Plans**: 6 plans in 4 waves
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Node 22 CI + Tailwind v4 with semantic navy/teal/coral tokens, no dark mode, Inter fix, dead Tailwind/PostCSS/pnpm/workflow files removed

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Next.js 16.3.8 + ESLint 9, dead next configs removed, D-11 prefetch smoke test (checkpoint)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Home split into 5 section components + tokenized Header, stale page/SVG files removed
- [x] 01-04-PLAN.md — About split into 4 section components with semantic tokens
- [x] 01-05-PLAN.md — CapabilitiesProvider (pure tested rules + live-subscribing hook) mounted in root layout

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-06-PLAN.md — Phase gate, palette/preview approval (checkpoint), merge to main + live mvforster.com verification

**UI hint**: yes
**Research flag**: Next.js 16's static-export nested-route prefetch behavior is single-source and unverified on this project's CI — run a smoke test on `/` and `/about` immediately after the upgrade, before relying on it in later phases; keep Next 15.x as a documented fallback if it reproduces.

### Phase 2: WebGL Hero

**Goal**: Visitors see a distinctive, calm, cursor-reactive WebGL hero that never blocks first paint, degrades gracefully on any device, and meets accessibility requirements.
**Depends on**: Phase 1
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06
**Success Criteria** (what must be TRUE):

  1. A visitor on the home page sees a slow, flowing WebGL mesh-gradient background in the navy/teal/coral palette, with a subtle connected-nodes network that responds gently to cursor or touch movement
  2. A visitor whose device can't or shouldn't run WebGL (no WebGL, reduced motion, low-power/data-saver) sees a static poster or gradient instead, with no layout shift and no blank area
  3. A visitor can pause and resume hero motion with a visible, keyboard-accessible control (WCAG 2.2.2)
  4. A visitor can pick "I'm hiring" or "I'm looking for work" in the hero and jump to the matching audience section
  5. The hero stops rendering when scrolled off-screen or the tab is hidden, and recovers from WebGL context loss by showing the fallback

**Plans:** 4/5 plans executed
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — ogl spike: pinned install, heroConfig, gradient shader, createHeroScene contract, headless-Chrome harness with palette/contrast checks

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Connected-nodes network (pure tested sim + ogl lines/points) and pre-rendered WebP stills of the real scene
- [x] 02-03-PLAN.md — Client island: capability-gated lazy loader, render-loop gating (offscreen/hidden/pause/context-loss), passive pointer/touch, crossfade, accessible pause button

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-04-PLAN.md — Healthcare copy decision + server-rendered Hero.tsx with still, chooser anchors, CTA slot, smooth-scroll CSS

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 02-05-PLAN.md — Built-site smoke test (capable / reduced-motion / no-JS / lazy-bundle) and human UAT

**UI hint**: yes
**Research flag**: `ogl`'s mesh-gradient shader implementation and its tree-shaking behavior are community-reported, not independently verified — spike a small reference adaptation (Whatamesh/gradient-stripe pattern) before committing to the full render-loop build.

### Phase 3: Booking, Ambient Video & How It Works

**Goal**: Every page drives visitors to book an intro chat, ambient video reinforces which audience each section addresses, and each audience can see in three steps how the process works.
**Depends on**: Phase 1
**Requirements**: VID-01, VID-02, VID-03, VID-04, VID-05, BOOK-01, BOOK-02, BOOK-03, BOOK-04, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):

  1. A visitor can click "Book an intro chat" in the header on any page and at the end of every major home-page section, opening the Calendly popup without leaving the site, with the Calendly script loading only on first interaction
  2. If the Calendly script fails to load, clicking the CTA opens the Calendly page in a new tab instead
  3. A visitor sees a muted, looping ambient video in both the "For Employers" and "For Candidates" sections, loading only near the viewport with a poster frame first, and playing inline on iOS Safari
  4. A visitor can pause the ambient videos, they show only the poster when reduced motion or data-saver is on, and each clip's license/source is recorded in the repo within its agreed size budget
  5. An employer sees a 3-step "How it works" ending in the booking CTA, and a candidate sees their own matching 3-step version

**Plans**: TBD
**UI hint**: yes
**Research flag**: Ambient video needs a real-device iOS (Safari, including Low Power Mode) autoplay QA pass, plus a concrete stock-footage sourcing/licensing decision (Coverr/Pexels/Mixkit vs. a paid generated-video tier with documented commercial terms) before implementation.

### Phase 4: Visual System, Motion & Quality Validation

**Goal**: The whole site reflects the new calm/premium visual system with accessible scroll motion, and performance, accessibility, and SEO targets are verified, not assumed.
**Depends on**: Phase 2, Phase 3
**Requirements**: CONT-01, MOT-01, QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):

  1. A visitor sees the new visual system — navy/teal/coral palette, large display typography, frosted-glass cards — applied consistently across the home and about pages
  2. A visitor sees sections fade or slide in as they scroll, and nothing animates when reduced motion is on
  3. The home page scores ≥ 90 on mobile Lighthouse Performance, with LCP ≤ 2.5s and CLS < 0.1, and the WebGL/video JavaScript doesn't block first paint
  4. All text over motion or video meets WCAG AA contrast, all CTAs and controls are keyboard-reachable with visible focus, and decorative canvas/video are hidden from assistive tech
  5. Key content stays in server-rendered HTML, and pages have correct title, description, Open Graph image, sitemap, and robots

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 6/6 | Complete   | 2026-10-12 |
| 2. WebGL Hero | 4/5 | In Progress|  |
| 3. Booking, Ambient Video & How It Works | 0/TBD | Not started | - |
| 4. Visual System, Motion & Quality Validation | 0/TBD | Not started | - |

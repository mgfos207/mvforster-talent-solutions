# Requirements: MVForster Talent Solutions — Modern Site Refresh

**Defined:** 2026-09-29
**Core Value:** Every visitor, whether employer or candidate, can book an intro chat on Calendly in one click from anywhere on the site. The new visuals must make that booking more likely, not get in the way of it.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: The site builds and deploys from CI on Node ≥ 20, still to the custom domain mvforster.com with no `basePath`
- [x] **FOUND-02**: The site runs on Next.js 16 with static export, and `/` and `/about` load and navigate correctly on the deployed site
- [x] **FOUND-03**: The site runs on Tailwind v4, and brand color tokens (`text-primary`, `bg-primary`, etc.) render visibly on every page
- [x] **FOUND-04**: Dead config and page files (`next.config.ts`, `next.config.jsold`, duplicate tailwind/postcss configs, `page.tsx.bak`/`.new`, `.nextoldyml`, stray pnpm files) are removed, so a single config file of each kind is in effect
- [x] **FOUND-05**: Each home-page section is its own component under `src/components/sections/`, and `page.tsx` only composes them

### Capabilities

- [x] **CAP-01**: A visitor whose device lacks WebGL, has reduced motion on, or has data-saver on gets the static fallbacks, all decided by one shared capability check that the hero, video, and motion features read

### Hero

- [x] **HERO-01**: A visitor on the home page sees a slow, flowing WebGL mesh-gradient background in the navy/teal/coral palette
- [ ] **HERO-02**: A visitor sees a subtle connected-nodes network over the gradient that responds gently to cursor or touch movement
- [ ] **HERO-03**: A visitor whose device can't or shouldn't run WebGL sees a static poster or gradient instead, with no layout shift and no blank area
- [ ] **HERO-04**: A visitor can pause and resume hero motion with a visible, keyboard-accessible control (WCAG 2.2.2)
- [ ] **HERO-05**: A visitor can pick "I'm hiring" or "I'm looking for work" in the hero and jump to the matching audience section
- [ ] **HERO-06**: The hero stops rendering when it's scrolled off-screen or the tab is hidden, and recovers from WebGL context loss by showing the fallback

### Video

- [ ] **VID-01**: A visitor sees a muted, looping ambient video (stock or generated) in the "For Employers" section
- [ ] **VID-02**: A visitor sees a muted, looping ambient video (stock or generated) in the "For Candidates" section
- [ ] **VID-03**: Videos load only when they're near the viewport, show a poster frame first, and play inline on iOS Safari (`muted playsinline autoplay`)
- [ ] **VID-04**: A visitor can pause the ambient videos, and they show only the poster when reduced motion or data-saver is on
- [ ] **VID-05**: The license and source for each video clip are recorded in the repo, and each clip stays within the agreed size budget

### Booking

- [ ] **BOOK-01**: A visitor can click "Book an intro chat" in the header on any page
- [ ] **BOOK-02**: A visitor can click "Book an intro chat" at the end of each major home-page section (hero, For Employers, For Candidates, How it works, contact)
- [ ] **BOOK-03**: Clicking any booking CTA opens the Calendly popup for https://calendly.com/micah-mvforster/introductory-chat without leaving the site. The Calendly script loads on first interaction, not on page load.
- [ ] **BOOK-04**: If the Calendly script fails to load, clicking the CTA opens the Calendly page in a new tab instead

### Content & Visual

- [ ] **CONT-01**: A visitor sees a new visual system across the home and about pages: navy/teal/coral palette, large display typography, frosted-glass cards
- [ ] **CONT-02**: An employer sees a 3-step "How it works" for employers that ends in the booking CTA
- [ ] **CONT-03**: A candidate sees a 3-step "How it works" for candidates that ends in the booking CTA

### Motion

- [ ] **MOT-01**: A visitor sees sections fade or slide in as they scroll, and nothing animates when reduced motion is on

### Quality

- [ ] **QUAL-01**: The home page scores ≥ 90 on mobile Lighthouse Performance, with LCP ≤ 2.5s and CLS < 0.1. The WebGL and video JavaScript doesn't block first paint.
- [ ] **QUAL-02**: All text over motion or video meets WCAG AA contrast, all CTAs and controls are keyboard-reachable with visible focus, and decorative canvas and video are hidden from assistive tech
- [ ] **QUAL-03**: Key content stays in server-rendered HTML, and pages have correct title, description, Open Graph image, sitemap, and robots

## v2 Requirements

Deferred. Tracked but not in the current roadmap.

### Trust

- **TRUST-01**: Founder-led trust section on the home page (photo, short bio, credentials)
- **TRUST-02**: Honest quantified stats (years recruiting, roles placed, specialties). Needs real numbers from Micah.
- **TRUST-03**: Real client and candidate testimonials or case studies

### Conversion

- **CONV-01**: Sticky mobile bottom CTA bar (add if mobile data shows visitors miss the CTAs)
- **CONV-02**: Inline Calendly embed near the final CTA (add if popup drop-off is high)

### Media

- **MEDIA-01**: Custom-filmed video (intro from Micah, testimonials) replacing stock footage

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changes to `/goals` page or `public/family/` | User chose to keep them as they are (2026-09-29) |
| Git history rewrite / making the repo private | Not needed, since `/goals` is being kept |
| Job board, listings, applicant tracking | Calendly is the single conversion path, and static hosting can't support it |
| Backend, CMS, server-processed forms, auth | GitHub Pages static hosting |
| Heavy 3D (three.js worlds, GLTF models, R3F) | Bundle and performance cost, doesn't fit the calm tone, and R3F v9 needs React 19 |
| Paid video hosting (Mux, Cloudflare Stream) | A couple of small, self-hosted loops is enough |
| Fabricated testimonials or stats | Reputational and compliance risk in healthcare |
| Moving off GitHub Pages | The current deploy works, so it's a separate decision |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| CAP-01 | Phase 1 | Complete |
| HERO-01 | Phase 2 | Complete |
| HERO-02 | Phase 2 | Pending |
| HERO-03 | Phase 2 | Pending |
| HERO-04 | Phase 2 | Pending |
| HERO-05 | Phase 2 | Pending |
| HERO-06 | Phase 2 | Pending |
| VID-01 | Phase 3 | Pending |
| VID-02 | Phase 3 | Pending |
| VID-03 | Phase 3 | Pending |
| VID-04 | Phase 3 | Pending |
| VID-05 | Phase 3 | Pending |
| BOOK-01 | Phase 3 | Pending |
| BOOK-02 | Phase 3 | Pending |
| BOOK-03 | Phase 3 | Pending |
| BOOK-04 | Phase 3 | Pending |
| CONT-02 | Phase 3 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-01 | Phase 4 | Pending |
| MOT-01 | Phase 4 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-29*
*Last updated: 2026-09-29 after roadmap creation*

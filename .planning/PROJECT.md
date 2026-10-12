# MVForster Talent Solutions — Modern Site Refresh

## What This Is

MVForster Talent Solutions (mvforster.com) is a static Next.js marketing site for Micah Forster's recruiting business. It serves two audiences: **clients**, meaning employers such as healthcare, behavioral health, and healthcare-admin organizations, and **candidates** in roles like BCBA, RBT, and healthcare admin. This refresh gives the site a "calm, premium, human" feel. Visitors should see a WebGL hero and ambient stock or generated video, and every page should lead them to book an intro call through Calendly.

## Core Value

**Every visitor, whether employer or candidate, can book an intro chat on Calendly in one click from anywhere on the site. The new visuals must make that booking more likely, not get in the way of it.**

If the WebGL or video fails, the page still loads fast, looks polished, and the booking CTA still works.

## Requirements

### Validated

<!-- Existing capabilities inferred from the codebase (.planning/codebase/) -->

- ✓ Static-exported Next.js 14 App Router site deployed to GitHub Pages at the custom domain mvforster.com (`output: 'export'`, `CNAME`, `.github/workflows/nextjs.yml`). Existing.
- ✓ Home page with hero, services, expertise (behavioral health including BCBA/RBT, healthcare admin roles), "why choose us", and contact sections (`src/app/page.tsx`). Existing.
- ✓ About page with Micah's bio, experience timeline, skills, education, and LinkedIn/GitHub links (`src/app/about/page.tsx`). Existing.
- ✓ Shared fixed header nav (`src/components/Header.tsx`). Existing.
- ✓ Contact via `mailto:` and LinkedIn links. Existing.

### Active

- [ ] Fix the broken brand color tokens (Tailwind v4 `@theme inline` syntax running on v3.3.3, so `text-primary` and similar classes currently output nothing)
- [ ] Clean up duplicate and dead config and page files (next.config.ts/.jsold, tailwind/postcss duplicates, page.tsx.bak/.new, .nextoldyml, stray pnpm files), keeping the no-`basePath` config the custom domain needs
- [ ] Split monolithic pages into section components (`src/components/sections/*`) so the hero and other sections can be swapped independently
- [ ] Apply a new visual system: deep navy, teal, and warm coral palette; large display typography; frosted-glass cards; scroll-reveal motion
- [ ] Replace the static hero with a WebGL hero: a flowing mesh-gradient shader with a subtle connected-nodes "network" that responds to the cursor
- [ ] Add ambient, muted, looping stock or generated video to separate "For Employers" and "For Candidates" sections
- [ ] Add a "Book an intro chat" CTA site-wide that opens the Calendly popup (https://calendly.com/micah-mvforster/introductory-chat)
- [ ] Show a static poster or gradient instead of the animation when the visitor prefers reduced motion, the device has no WebGL, or the device is low-power or on data-saver
- [ ] Load WebGL and video lazily and client-side only, without hurting LCP or CLS (performance budget set during research)
- [ ] Keep or improve SEO and accessibility: semantic HTML, alt text, captions or `aria-hidden` for decorative video, keyboard-reachable CTAs, and contrast that passes WCAG AA

### Out of Scope

- Custom-filmed video production. Using stock or generated footage for now; Micah can swap in real testimonials later.
- Job board, job listings, or applicant tracking. Calendly is the only conversion path for now.
- Backend, CMS, forms with server processing, or auth. GitHub Pages static hosting has no server.
- Changes to `/goals` and `public/family/`. The user chose to keep them as they are (2026-09-29), even though the repo is public.
- Founder trust section and quantified stats. Deferred to v2, pending real numbers from Micah.
- Moving hosting off GitHub Pages. The current deploy works; changing it is a separate decision.
- Heavy 3D scenes or models (full three.js worlds, GLTF characters). They cost too much performance for a brochure site and don't fit the calm tone.

## Context

- **Business:** a solo recruiting practice focused on healthcare, behavioral health (ABA: BCBA/RBT), and healthcare administration. Most visitors will probably come from LinkedIn or referrals, often on mobile.
- **Visual direction** (Claude chose this and the user approved it): Stripe's animated mesh-gradient homepage plus Linear's crisp typography, warmed up for healthcare. It should feel calm, trustworthy, and human, not techy or flashy.
- **Codebase state** (see `.planning/codebase/`): the whole page is in one file, there are no client components, the only dependencies are next, react, and react-dom, there are no tests, and the 440KB unoptimized hero JPG is the current LCP element.
- **Deploy:** pushing to `main` builds with `npm ci && npm run build` on Node 18 and publishes `./out` to GitHub Pages. This work happens on `feature/modern-webgl-video`.

## Constraints

- **Hosting:** static export on GitHub Pages only. Everything, including WebGL, video, and Calendly, runs client-side.
- **Tech stack:** Next.js 14 App Router + TypeScript + Tailwind, with npm as the canonical package manager (CI uses `npm ci`).
- **Config:** keep the effective `next.config.js` with no `basePath`. The custom domain breaks if a basePath is added.
- **Performance:** mobile Lighthouse Performance ≥ 90 and LCP ≤ 2.5s on the home page. The WebGL/video JS must not block first paint.
- **Accessibility:** respect `prefers-reduced-motion`, meet WCAG AA contrast, and never put essential content inside video or canvas.
- **Assets:** video is self-hosted and compressed (WebM/MP4 with a poster image) or embedded from a CDN. Keep individual clips small, loaded only when visible.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Visual direction: "calm, premium, human" (Stripe gradient + Linear type, healthcare-warm palette) | The user delegated the choice. This fits trust-driven healthcare recruiting better than flashy 3D. | — Pending |
| Single conversion path: Calendly popup embed | The user wants every visitor to book an intro chat. A popup keeps them on-site. | — Pending |
| Stock or generated video instead of custom footage | No existing footage. Keeps v1 unblocked. | — Pending |
| Keep `/goals` and family photos as they are | User decision after being told the repo is public and that removal wouldn't clear git history | — Pending |
| Upgrade to Node ≥ 20, Next 16, Tailwind v4 before visual work | Next 14 is EOL, and the CSS already uses v4 `@theme` syntax (brand colors broken on v3) | — Pending |
| `ogl` for the WebGL hero, `motion` for scroll reveal, official Calendly script loaded on click | Smallest bundles that meet the perf budget, and R3F would force React 19 | — Pending |
| WebGL for an ambient hero only, with graceful fallbacks | Maximum "modern" impact for the least perf and accessibility risk. | — Pending |
| Map the codebase before planning (brownfield) | Surfaced broken theme tokens, privacy exposure, and config footguns before redesign work. | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-29 after initialization*

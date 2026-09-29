# Feature Research

**Domain:** Healthcare / behavioral-health (ABA, BCBA/RBT) recruiting agency marketing site — solo-founder, dual-audience (employers + candidates), single conversion goal (Calendly intro chat)
**Researched:** 2026-09-29
**Confidence:** MEDIUM-HIGH (niche competitor sites verified directly; motion/WebGL/CTA patterns verified against multiple current sources; no access to real analytics/A-B data for this specific niche)

## Feature Landscape

### Table Stakes (Users Expect These)

Features visitors assume exist. Missing these makes the site feel incomplete, untrustworthy, or hard to use for either audience.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dual-audience split reachable in one click from the hero ("For Employers" / "For Candidates") | Every niche competitor checked (recruitaba.com, careerconnections.io, TYGES) leads with a paired hero CTA or nav split because employers and candidates have opposite intents and bounce if forced to read past their audience's content | LOW–MEDIUM | Single scrolling page with two anchor-linked sections is sufficient — competitors in this niche do NOT use separate site trees/portals, they use a split hero + two mid-page sections. Matches current one-page architecture. |
| One obvious primary CTA repeated at consistent intervals ("Book an intro chat") | Recruiting sites in this space converge on "Book a Call" as the single ask, not resumes/forms, when the agency is small and relationship-led | LOW | Same CTA label/destination everywhere avoids "recognition, not a fresh decision" cost — repeating identical copy performs better than varying it per section |
| Calendly booking flow reachable without leaving the page | Calendly is the explicitly chosen single conversion path (PROJECT.md); friction here is the #1 failure mode | LOW–MEDIUM | See Differentiators/Dependencies below for popup vs inline choice — this row is just "it must work everywhere," not the specific embed type |
| Fast load / good Core Web Vitals even with hero animation | Visitors from LinkedIn/referrals are often on mobile; a slow or janky hero reads as "this recruiter doesn't know what they're doing" in a trust-sensitive vertical | MEDIUM–HIGH | PROJECT.md already sets LCP ≤2.5s and Lighthouse ≥90 as hard constraints — this is the highest-risk table stake given the WebGL/video ask |
| Static fallback for motion (reduced motion, no WebGL, low-power/data-saver) | `prefers-reduced-motion` and low-power/battery-saver modes are honored by browsers/OS today; users on these settings still need a usable, non-blank hero | LOW–MEDIUM | MEDIUM confidence this is now closer to a hard requirement than a nice-to-have: mobile Low Power Mode commonly disables background video and cannot be overridden by the site — so the fallback path is not optional, it *will* trigger for real visitors |
| Credentials / specialty proof without customer testimonials | No real testimonials exist yet (explicitly out of scope for now); competitors substitute quantified stats ("90% fill rate", "545 BCBAs placed in 12 months"), named specialties (BCBA, RBT, healthcare admin), and founder credentials | LOW | This is the single most important substitute-trust-signal pattern found — see Differentiators for how MVForster should adapt it honestly (no fabricated stats) |
| Founder-led About/bio section with real photo | Solo-practice recruiting sites lean hard on founder identity as the trust anchor when there's no brand/company history; every niche competitor featured a named founder photo + narrative | LOW | Already exists (About page) — needs surfacing on the home page too, not buried on a separate route, per competitor pattern |
| Mobile-first CTA reachability (thumb zone) | Most traffic is mobile (LinkedIn/referral); CTAs stranded above the fold or requiring scroll-back cost conversions | LOW–MEDIUM | Sticky bottom CTA bar is the standard mobile pattern (see Differentiators) but even without it, every section needs its own CTA within thumb reach |
| Semantic, accessible structure (alt text, keyboard-reachable CTA, captions/aria-hidden on decorative video, WCAG AA contrast) | Already a stated constraint; also increasingly expected baseline, not a bonus, for professional/healthcare-adjacent sites | LOW–MEDIUM | Decorative WebGL canvas and ambient video must be `aria-hidden` with no essential content inside them (already a stated constraint) |
| Clear list of roles/specialties served (BCBA, RBT, healthcare admin, behavioral health) | Both employers and candidates need to self-qualify fast — "do they work in my space?" | LOW | Already exists in some form (expertise section) — carries forward, just needs re-skinning |
| Nav/CTA parity between hero and header (CTA always visible in header, not just hero) | Standard SaaS/marketing pattern (Stripe/Linear reference direction) — visitors who scroll past hero without clicking still need the CTA on screen | LOW | Fixed header already exists; just needs the CTA button added |

### Differentiators (Competitive Advantage)

Not required, but where this specific redesign can outperform typical solo-recruiter sites (which are usually generic WordPress templates with stock photos and no motion).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| WebGL mesh-gradient hero with cursor-reactive connected-nodes network | Signals "modern, technically credible, calm" — differentiates from the generic stock-photo-hero look dominant in this niche (every competitor site checked used static images, zero WebGL/animation) | MEDIUM–HIGH | A live mesh-gradient shader costs roughly 2–5% GPU on modern hardware (comparable to background video) *if* lazily initialized, DPR-capped, and client-only — matches the static-export constraint. Real risk is scope creep into "heavy 3D," which is explicitly out of scope. |
| Separate ambient muted video for "For Employers" vs "For Candidates" sections | Reinforces the dual-audience split visually (different tone: calmer/clinical b-roll for employers, warmer human b-roll for candidates) rather than one generic hero video reused everywhere | MEDIUM | Keep clips short (5–15s), ≤ a few MB each, H.264 MP4 + WebM, with `autoplay muted loop playsinline` + poster frame. Must lazy-load only when the section is visible (IntersectionObserver) so it doesn't compete with hero LCP. |
| Quantified, honest proxy-trust stats instead of fabricated testimonials | Competitors use hard numbers ("90% fill rate," "545 placed in 12 months") as testimonial substitutes — MVForster can do the same with real, verifiable numbers (years in healthcare recruiting, roles specialized in, certifications held) rather than inventing quotes | LOW | Must stay honest — no fake testimonial quotes or invented stats (this is a reputational risk in a compliance-sensitive vertical, not just a UX one) |
| Sticky/persistent mobile CTA bar | Sticky bottom CTAs lift conversions ~15–25% on long-form pages in published A/B data; none of the ABA-niche competitors checked used one — clear differentiation opportunity | LOW–MEDIUM | Needs a dismiss affordance and must not obscure content; should not duplicate/compete with an already-visible header CTA (only show once hero CTA scrolls out of view) |
| Light scroll-reveal storytelling (staged section reveals, not full scroll-scrubbed scenes) | Stripe/Linear-style progressive disclosure feels premium without the cost/risk of true scrollytelling (pinned/scroll-scrubbed WebGL scenes) | LOW–MEDIUM | Recommend the "staged reveal" pattern only (fade/slide sections into view on scroll) — avoid "sticky figure + stepped text" or "scroll-scrubbed sequence" patterns, which are high-complexity and a poor fit for a brochure site with this budget |
| Inline Calendly widget on a dedicated intent moment + popup everywhere else | Published A/B data shows inline embeds outconvert popup buttons by ~30–40% when the visitor already has booking intent, while popups are better for "catch them anywhere" clicks | LOW–MEDIUM | Recommend: popup CTA is the site-wide default (as PROJECT.md specifies), but consider one inline Calendly embed directly under/near the final CTA section for visitors who've already decided — captures the intent-driven segment without abandoning the popup-everywhere strategy |
| Clear "How it works" 3-step process, split per audience | Both niche competitors and generic staffing-agency guidance converge on a simple step framework (Employers: understand need → source/vet → intro call; Candidates: share goals → matched to roles → intro call) — reduces "what happens after I click book?" anxiety, which matters more when there's no self-serve job board to browse first | LOW | Directly supports the single-CTA funnel: this section's own CTA is still "Book an intro chat," it just answers the "what happens next" objection immediately before asking |

### Anti-Features (Commonly Requested, Often Problematic)

Things that look appealing for this project but would hurt performance, timeline, or trust given the constraints (solo founder, static export, no backend, no real testimonials yet).

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Full 3D scene / GLTF characters / immersive WebGL "experience" | "Modern" WebGL sites often show off full 3D worlds; tempting to go further than a mesh gradient | Already explicitly out of scope in PROJECT.md; costs far more GPU/JS budget, risks LCP/Lighthouse targets, and reads as "flashy" rather than "calm, trustworthy" for a healthcare-adjacent audience | Keep WebGL to an ambient 2D/2.5D shader background only (mesh gradient + node network), never a full 3D scene |
| Fabricated or "coming soon" testimonials / stock-photo "employee" quotes | Fills the visible trust gap fast | Fake social proof in a healthcare/compliance-adjacent vertical is a real reputational and legal risk if ever discovered; also violates the "human, not techy" tone goal | Use honest quantified stats, credentials, and founder narrative now; add a placeholder-free layout that can slot in real testimonials later without a redesign |
| Job board / job listings / apply flow / applicant tracking | Feels like "what a real recruiting site has" | Explicitly out of scope — no backend, no forms with server processing, GitHub Pages static hosting can't support this; also dilutes the single-conversion-path strategy the whole redesign is built around | Calendly intro chat remains the only conversion path; "roles we place" stays a static descriptive list, not a searchable board |
| Autoplaying video with sound, or video that must be manually started | Some stock/marketing video comes with audio by default | Autoplay-with-sound is a well-documented UX and accessibility anti-pattern, and mobile browsers block it outright in many cases; a "click to play" ambient hero defeats the point of ambient background video | Always `autoplay muted loop playsinline` with a poster image fallback; never require a user gesture for background/ambient video |
| Full scroll-scrubbed/pinned "scrollytelling" scene (sticky figure + stepped narrative driven by scroll position) | Looks impressive in inspiration galleries (Awwwards-style sites) | High implementation complexity, high risk of jank on mid-tier mobile devices, and a poor fit for a small brochure site whose real job is to get visitors to a Calendly link fast, not hold attention for a long narrative | Use lightweight "staged reveal" (fade/slide on scroll) instead — narrative pacing without scroll-scrubbed complexity |
| Separate marketing "portals" or fully separate site sections/subdomains for employers vs candidates | Larger staffing agencies (e.g., some general staffing sites) do this | Overkill for a solo-founder site with modest traffic; doubles the content/maintenance burden and fragments the single CTA funnel; none of the direct ABA/behavioral-health niche competitors checked do this — they use one page with a split hero and two sections | One-page site with an audience-split hero and two anchor-linked sections (current architecture direction already supports this) |
| Chat widget / AI chatbot for lead qualification | Feels like a modern conversion tool | Adds a third conversion path (competes with the single Calendly CTA), needs ongoing monitoring a solo founder likely won't do consistently, and isn't asked for anywhere in PROJECT.md | Single CTA discipline: Calendly popup/inline only |
| Autoplaying video across every section (hero + employer + candidate + testimonial area, etc.) | "More video = more modern/engaging" | Multiple autoplaying videos compound bandwidth/battery cost, especially on mobile/data-saver, and risk violating the LCP/Lighthouse budget; also visually noisy against a "calm" design goal | Two ambient videos max (Employers section, Candidates section), lazy-loaded on visibility, hero stays WebGL/gradient only (no hero video) |

## Feature Dependencies

```
WebGL hero (mesh gradient + node network)
    └──requires──> Reduced-motion / no-WebGL / low-power static fallback
                       └──requires──> Feature-detection logic (WebGL support check, prefers-reduced-motion, Save-Data/connection check)

Ambient section video (Employers / Candidates)
    └──requires──> Lazy client-side loading (IntersectionObserver)
    └──requires──> Poster image fallback (same fallback path as WebGL, for consistency)

Dual-audience hero split (For Employers / For Candidates)
    └──enhances──> Section-level ambient video (video reinforces which audience a section is for)
    └──enhances──> "How it works" 3-step process (can be split per audience, reusing the same split)

Site-wide "Book an intro chat" CTA (Calendly popup)
    └──requires──> Section componentization (src/components/sections/*) so CTA can be a shared component, not copy-pasted per page
    └──enhances──> Sticky mobile CTA bar (same Calendly trigger, different presentation)

Inline Calendly embed near final CTA
    └──conflicts──> Popup-everywhere-only strategy (not a hard conflict — they can coexist, but adding inline changes the "single embed type" simplicity assumption in PROJECT.md and should be a deliberate decision, not default)

Quantified trust stats / credentials section
    └──requires──> Real, verifiable numbers from Micah (years practicing, roles placed, certifications) — a content/data dependency, not a code dependency

Founder photo/bio on home page
    └──requires──> Existing About page content (reuse, don't duplicate-author)
```

### Dependency Notes

- **WebGL hero requires the fallback system, not the other way around:** build the static/reduced-motion fallback path first (or in lockstep), since it's also reused by the ambient section videos — one shared "can this device handle rich motion?" check should gate both features.
- **Ambient section video enhances the dual-audience hero split:** the video is not standalone — it's only valuable because it reinforces which half of the page (employer vs candidate) the visitor is in. Building video before the audience split exists would waste the differentiation value.
- **Site-wide CTA requires section componentization:** PROJECT.md's Active requirements already call out splitting the monolithic page into `src/components/sections/*`. The CTA button should be built as one shared component consumed by every section, not hand-copied — otherwise "site-wide CTA" becomes N slightly-different CTAs to maintain.
- **Inline Calendly embed conflicts (softly) with the popup-only decision in PROJECT.md's Key Decisions table:** flag this as a decision to revisit, not a silent addition — the current project decision is "Single conversion path: Calendly popup embed." Adding one inline instance is a scope change, even if small, and should be called out explicitly rather than implemented as a default.
- **Quantified stats depend on real data from the business owner, not research or code:** this is a content-gathering dependency that should be scheduled early (it blocks the "Table Stakes" trust section) — cannot be fabricated per the Anti-Features list.

## MVP Definition

### Launch With (v1)

Minimum viable product for this redesign — validates the "calm, premium, human, WebGL-and-video-enhanced, single-CTA" concept without overbuilding.

- [ ] Dual-audience hero (For Employers / For Candidates split) with WebGL mesh-gradient + node-network background — validates the core "modern but calm" visual bet
- [ ] Static/reduced-motion/no-WebGL fallback (poster or gradient image) — required for the WebGL hero to be safe to ship at all
- [ ] Site-wide "Book an intro chat" Calendly popup CTA (header + every major section) — this is the entire business goal of the redesign
- [ ] One ambient muted looping video per audience section (Employers, Candidates) with poster fallback and lazy loading — the other half of the "modern, human" visual bet
- [ ] Founder-led trust section on the home page (photo + short bio + credentials/specialties), reusing existing About content
- [ ] Honest quantified trust stats (years in healthcare recruiting, specialties, roles placed if verifiable) replacing the need for testimonials
- [ ] "How it works" 3-step section, split per audience, ending in the same CTA
- [ ] Section componentization (`src/components/sections/*`) — structural prerequisite for the CTA and video features above, not a visual feature itself but required scope

### Add After Validation (v1.x)

Add once the core redesign ships and real usage/Lighthouse data comes back.

- [ ] Sticky mobile bottom CTA bar — add once real mobile bounce/scroll data shows visitors aren't reaching the header/section CTAs
- [ ] Inline Calendly embed near the final CTA (in addition to popup) — add if popup-click-through data suggests high-intent visitors are dropping off before opening the popup
- [ ] Light scroll-reveal staging on more sections (beyond hero) — add incrementally per section once base performance budget is proven safe with the WebGL hero + two videos already in place

### Future Consideration (v2+)

Defer until there's more content, more traffic data, or a business-model change.

- [ ] Real testimonials/case studies (replacing the quantified-stats substitute) — defer until Micah has real client/candidate testimonials to add; explicitly out of scope for now per PROJECT.md
- [ ] Custom-filmed video (replacing stock/generated ambient video) — defer until there's budget/footage; PROJECT.md explicitly defers this
- [ ] Any form of job board, listings, or applicant tracking — defer indefinitely unless the business model changes to require self-serve job browsing; conflicts with static hosting and the single-CTA strategy

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Site-wide Calendly CTA (popup) | HIGH | LOW | P1 |
| Section componentization (structural) | HIGH (enables everything else) | MEDIUM | P1 |
| WebGL mesh-gradient hero + fallback | HIGH | MEDIUM–HIGH | P1 |
| Dual-audience hero split | HIGH | LOW–MEDIUM | P1 |
| Ambient section video (Employers/Candidates) | MEDIUM–HIGH | MEDIUM | P1 |
| Founder-led trust section on home page | MEDIUM–HIGH | LOW | P1 |
| Quantified trust stats (no fake testimonials) | MEDIUM–HIGH | LOW (content-dependent) | P1 |
| "How it works" 3-step section | MEDIUM | LOW | P1 |
| Sticky mobile CTA bar | MEDIUM | LOW–MEDIUM | P2 |
| Inline Calendly embed (secondary) | LOW–MEDIUM | LOW–MEDIUM | P2 |
| Broader scroll-reveal staging | LOW–MEDIUM | LOW–MEDIUM | P2 |
| Real testimonials/case studies | HIGH (once available) | LOW (content-dependent) | P3 |
| Custom-filmed video | MEDIUM | HIGH | P3 |
| Job board/ATS features | N/A — explicitly excluded | N/A | Excluded |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Recruit ABA (recruitaba.com) | Career Connections (careerconnections.io) | Our Approach |
|---------|-------------------------------|----------------------------------------------|--------------|
| Hero pattern | Tagline ("Bridging the gap between companies and candidates") + static professional-workplace imagery, no video/animation | Dual-audience tagline ("ABA is personal. So is our search.") with parallel CTAs ("Discuss your hiring needs" / "Find my next role") | WebGL mesh-gradient + node-network background (differentiator — neither competitor uses any motion), same dual-audience paired-CTA hero structure |
| Dual-audience routing | Explicit Employers vs BCBAs/Job Seekers segmentation with distinct CTAs per audience | Explicit Providers vs Candidates segmentation, color-differentiated CTAs | Same pattern (audience split in hero + two sections), reinforced with per-audience ambient video instead of just color coding |
| Primary CTA | "Book a Call" (Calendly-based discovery call) repeated across the page | "Discuss your hiring needs" / "Find my next role" / "Let's connect" — repeated in hero, mid-page, footer | Single consistent CTA copy ("Book an intro chat") everywhere, same Calendly destination — even more consistency than either competitor, which vary CTA copy per instance |
| Trust signals w/o full testimonial base | "90% fill rate" stat, founder BCBA credentials, "ethical standards" language, some named testimonials already exist | "545 BCBAs hired for one national ABA provider in 12 months" quantified stat, founder photo + narrative, one testimonial quote already exists | Match the quantified-stat + founder-narrative pattern; skip fabricated testimonials since none exist yet (both competitors already have some) — lean harder on credentials/specialties as the substitute |
| Video/motion usage | None found | None found | Clear differentiation opportunity: neither direct competitor uses WebGL or ambient video — this is where the redesign can stand out visually in a fairly generic-looking niche |
| Conversion funnel | Multiple "Book a Call" CTAs + contact form + resume upload (multiple conversion paths) | Layered CTAs + contact form, multiple paths | Deliberately narrower: Calendly is the *only* conversion path (no resume upload, no contact form) — simpler funnel than either competitor, consistent with PROJECT.md's single-CTA mandate |

## Sources

- [HubSpot — 20 recruitment website design examples](https://blog.hubspot.com/website/recruitment-websites-design) — MEDIUM confidence, general recruitment site patterns
- [Azuro Digital — 10 Best Recruitment Website Designs of 2026](https://azurodigital.com/recruitment-website-examples/) — MEDIUM confidence
- [Made by Evoke — Web Design for Recruitment Agencies](https://madebyevoke.com/blog/web-design-for-recruitment-agencies) — MEDIUM confidence, dual-audience navigation guidance
- [Haley Marketing — Best Staffing Agency Websites](https://www.haleymarketing.com/2025/05/28/best-staffing-agency-websites/) — MEDIUM confidence
- [WANDR — Medical Staffing Website Designers That Convert](https://www.wandr.studio/blog/medical-staffing-website-design) — MEDIUM confidence, healthcare-specific conversion guidance
- [Conway Marketing Group — User-Centered Design for Healthcare Staffing](https://www.conwaymarketinggroup.com/why-user-centered-design-is-the-future-of-healthcare-staffing-websites/) — MEDIUM confidence
- [Calendly Help — Embed options overview](https://calendly.com/help/embed-options-overview) — HIGH confidence, official docs
- [Zeeg — How to Embed Calendly](https://zeeg.me/en/blog/post/calendly-embed) — MEDIUM confidence (cites inline vs popup A/B conversion data)
- [UXie Design — Calendly Popup Modal in Webflow](https://www.uxie.design/blog/how-to-embed-a-calendly-popup-modal-in-webflow-without-losin-bbfc3) — MEDIUM confidence
- [Vanta Supply — Animated backgrounds for websites: 6 approaches compared](https://vanta.supply/articles/animated-backgrounds) — MEDIUM confidence, performance figures for WebGL/gradient/video hero costs
- [MDN — WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) — HIGH confidence, official docs
- [Utsubo — 100 Three.js Tips That Actually Improve Performance](https://www.utsubo.com/blog/threejs-best-practices-100-tips) — MEDIUM confidence
- [Instant Gradient — Animated Gradient Backgrounds: When to Use Them](https://instantgradient.com/blog/animated-gradient-backgrounds) — MEDIUM confidence
- [Verlua — Website Trust Signals: 9-Point Conversion Checklist](https://www.verlua.com/blog/website-trust-signals-convert-visitors) — MEDIUM confidence
- [siift — Building Trust Online: 2026 Guide for Founders](https://siift.ai/blog/building-trust-online-a-2026-guide-for-founders) — MEDIUM confidence
- [Mux — Use videos in your website design](https://www.mux.com/docs/examples/use-videos-in-your-website-design) — MEDIUM-HIGH confidence, technical video-in-web guidance
- [New Media Campaigns — Examples of Ambient Video on Websites](https://www.newmediacampaigns.com/blog/ten-examples-of-ambient-video-on-websites) — MEDIUM confidence
- [Lovable — Scrolling Designs: 8 Patterns and When to Use Each](https://lovable.dev/guides/scrolling-designs-patterns-when-to-use) — MEDIUM confidence, scroll pattern taxonomy (staged reveal vs scroll-scrubbed vs pinned figure)
- [scrollytelling.ai — Scrollytelling Design Patterns: A Practitioner's Reference](https://scrollytelling.ai/scrollytelling-design-patterns/) — MEDIUM confidence
- [StickyCTAs — Engineering Conversion: Sticky and Persistent CTA Optimization](https://www.stickyctas.com/articles/engineering-conversion) — LOW-MEDIUM confidence (vendor content, but conversion-lift figures are consistent with other independent sources), cross-referenced with [Content That Sales — Sticky CTA Service Page Guide](https://contentthatsales.com/sticky-cta-service-page/)
- **Direct competitor site analysis (fetched live 2026-09-29):**
  - [Recruit ABA](https://recruitaba.com/) — HIGH confidence (direct site fetch), ABA/BCBA-focused agency, dual-audience CTA structure, quantified fill-rate stat
  - [Career Connections](https://www.careerconnections.io/) — HIGH confidence (direct site fetch), ABA/BCBA/RBT-focused agency, dual-audience hero with parallel CTAs, founder-led trust narrative
  - [TYGES — Behavioral Health & ABA Recruiting](https://tyges.com/behavioral-health-recruiting/) — MEDIUM confidence (search-result summary only, not directly fetched)
- [thoughtbot — Can Auto-Playing Videos be Accessible?](https://thoughtbot.com/blog/can-auto-playing-videos-be-accessible) — MEDIUM-HIGH confidence, accessibility guidance for autoplay video

---
*Feature research for: healthcare/behavioral-health recruiting agency marketing site (solo founder, dual-audience, WebGL + video redesign, single Calendly CTA)*
*Researched: 2026-09-29*

# Pitfalls Research

**Domain:** WebGL hero + ambient background video + heavy motion + Calendly booking embed, added to a static-exported Next.js marketing site on GitHub Pages, for a trust-driven healthcare recruiting brand
**Researched:** 2026-09-29
**Confidence:** HIGH (Core Web Vitals, WCAG, iOS Safari autoplay, GitHub Pages limits, Tailwind v4 migration verified against official docs/MDN/W3C/webkit.org); MEDIUM (Calendly-specific CSP/consent behavior, stock footage authenticity — verified via community/vendor sources, not a spec)

## Critical Pitfalls

### Pitfall 1: The WebGL canvas (or video) becomes the LCP element and stays empty for seconds

**What goes wrong:**
Browsers count a `<canvas>` or `<video>` as a candidate for Largest Contentful Paint if it's the largest visible element in the viewport. A Three.js/shader hero that takes even 1-2 seconds to compile shaders, load textures, and render its first frame pushes LCP past that delay — often blowing well past the project's 2.5s budget. The same applies to a full-bleed background `<video>`: if the poster image is missing or the video element itself is measured (not the poster), LCP tracks whenever the video's first frame paints, not when the page "looks done."

**Why it happens:**
Teams build the WebGL/video hero first, get it working, then discover in Lighthouse/CrUX that LCP is 3-4s. The natural instinct — "make the canvas render faster" — is the wrong fix; the real fix is making sure the LCP element is never the canvas/video in the first place.

**How to avoid:**
- Render a real, fast-loading LCP candidate underneath/before the canvas: a headline (`<h1>`) or a small compressed poster image, sized and positioned so it — not the canvas — is the largest visible paint.
- If a poster image is used for the video, mark it `fetchpriority="high"` and do NOT lazy-load it; the canvas/video itself should mount after first paint via `next/dynamic({ ssr: false })`.
- Keep the shader's first-frame render trivial (solid gradient, no expensive texture loads) and defer the "network of nodes" cursor-interaction layer to mount after `requestIdleCallback` or on `visibilitychange`.
- Test with Chrome DevTools Performance panel's LCP marker, not just the Lighthouse score, to see which element is actually selected as LCP.

**Warning signs:**
- Lighthouse reports LCP element as `<canvas>` or `<video>` instead of `<h1>`/text.
- LCP timing correlates with WebGL init logs, not with initial HTML parse.
- Mobile Lighthouse score drops sharply only after the hero component is added, even though "the page looks the same speed."

**Phase to address:**
Hero implementation phase (WebGL) and video-embed phase. Verify with a dedicated Lighthouse/CrUX check before merging either feature, not just at final QA.

---

### Pitfall 2: Client-side hydration cost from a heavy WebGL library blocks INP and delays interactivity

**What goes wrong:**
This codebase currently has zero client components — everything is a server-rendered static page. Introducing react-three-fiber/three.js (or even a hand-rolled WebGL canvas) as a large client bundle means the browser must download, parse, and execute significant JS before the page is interactive. On mobile mid-tier hardware, this shows up as poor INP (Interaction to Next Paint) — CTA buttons and the Calendly trigger feel sluggish for the first second or two even though the page "looks" loaded.

**Why it happens:**
Because there's no existing lazy-loading pattern in the repo (`grep` for `next/dynamic` returns nothing today per CONCERNS.md), the natural path of least resistance is to import three.js/r3f directly at the top of `page.tsx`, shipping the whole runtime in the initial JS bundle for every route — including `/about`, which has no WebGL at all.

**How to avoid:**
- Isolate WebGL and video into dedicated client components (`"use client"`) loaded via `next/dynamic(() => import(...), { ssr: false })`, mounted only on the routes that need them (the home page hero, not `/about`).
- Choose a lean library. Prefer raw WebGL/lightweight shader approach (e.g., ogl, or a hand-written GLSL mesh-gradient) over pulling in the full three.js + react-three-fiber + drei stack for a single ambient effect — the "Out of Scope" note already rules out heavy 3D scenes, so the dependency choice should match that scope.
- Mount the canvas after the main thread is idle (`requestIdleCallback`, or on `IntersectionObserver` when the hero scrolls into view) rather than synchronously on load.
- Set a JS bundle budget per route (e.g., home page route JS ≤ 150-200KB gzipped for the hero feature) and check it in CI or manually before merging.

**Warning signs:**
- Lighthouse "Total Blocking Time" or INP field data regresses after adding the hero.
- `next build` output shows a large chunk shared across all routes instead of scoped to the home page.
- Buttons/links feel delayed to tap on a mid-tier Android device in manual testing.

**Phase to address:**
Hero implementation phase — establish the `next/dynamic` + code-splitting pattern as the very first WebGL commit, since there's no existing precedent to follow (per CONCERNS.md "No code-splitting/lazy-loading pattern established").

---

### Pitfall 3: WebGL context loss crashes the hero with no recovery, especially on mobile

**What goes wrong:**
Mobile GPUs (and even desktop browsers under memory pressure) can fire a `webglcontextlost` event — triggered by tab switching, backgrounding the browser, plugging in an external monitor, or the OS reclaiming GPU memory. If the app doesn't listen for this event, the canvas silently goes black/frozen, and if no `webglcontextrestored` handler re-initializes buffers/textures/shaders, the hero stays dead until a full page reload. On mobile Safari, backgrounding the tab and returning is a very common trigger.

**Why it happens:**
Context loss is easy to forget because it never happens in a quick desktop dev-server test. It shows up in the field on real mobile devices weeks after "it works on my machine."

**How to avoid:**
- Add `canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(id); })` and a `webglcontextrestored` handler that reinitializes GL resources (shaders, buffers, textures) — treat restoration as a fresh init, not a resume.
- As a pragmatic fallback for a "calm" marketing site: if context loss occurs, swap the canvas for the static poster/gradient fallback (the same one used for reduced-motion/no-WebGL) rather than trying to always perfectly recover — this is far less risky than a partial recovery bug.
- Test with the `WEBGL_lose_context` extension in dev tools to force context loss and confirm graceful fallback, since this can't be reliably triggered otherwise.

**Warning signs:**
- Users report "the animation just froze" or "went black" after switching apps on mobile, with no console errors visible without remote debugging.
- No `webglcontextlost`/`webglcontextrestored` listeners exist anywhere in the WebGL component.

**Phase to address:**
Hero implementation phase — build the fallback path (same code used for `prefers-reduced-motion`/no-WebGL) so context-loss recovery reuses it instead of being a separate, easily-skipped feature.

---

### Pitfall 4: Autoplay background video silently fails on iOS Safari because of missing `muted`/`playsinline`

**What goes wrong:**
iOS Safari (and Safari on iPadOS) only allows a `<video>` to autoplay without a user gesture if it has no audio track OR the `muted` attribute/property is set, AND it must have `playsinline` or Safari will force fullscreen (or refuse to autoplay inline at all). Missing any of `autoplay muted playsinline` on the `<video>` tag — or setting `muted` only via JS after mount instead of as an HTML attribute — causes the ambient video to just not play on iPhones, which is a large share of this site's mobile-heavy healthcare-recruiting traffic.

**Why it happens:**
Desktop Chrome is forgiving and autoplays almost anything; the bug only appears when testing on an actual iPhone, which is often skipped during development.

**How to avoid:**
- Always set `muted`, `autoplay`, `playsinline`, and `loop` as literal HTML attributes on the `<video>` element (not only via a `.muted = true` JS call after the element exists — Safari checks the attribute at play-attempt time in some versions).
- Always provide a `poster` image so there's a correct visual even if autoplay is blocked (e.g., Low Power Mode on iOS can block autoplay entirely regardless of `muted`).
- Call `.play()` defensively and catch/ignore the rejected promise (autoplay can still be blocked by Low Power Mode, Reduce Motion, or per-site Safari settings) — never let an unhandled promise rejection surface as a console error or broken UI.
- Test on a real iPhone in both normal and Low Power Mode, and with iOS "Reduce Motion" accessibility setting on.

**Warning signs:**
- Video works in every desktop browser and Android Chrome, but shows only a static poster (or nothing) on iPhone during QA.
- Console shows unhandled promise rejection from `.play()`.

**Phase to address:**
Video-embed phase. Add an iPhone (or real-device cloud testing) pass to the QA checklist for this phase specifically — this is not catchable from desktop testing alone.

---

### Pitfall 5: Decorative autoplay video/animation violates WCAG 2.2.2 (Pause, Stop, Hide) — a Level A failure

**What goes wrong:**
WCAG 2.2.2 requires that any moving, auto-starting content lasting more than 5 seconds and running in parallel with other content have a mechanism for the user to pause, stop, or hide it — unless the motion is essential. A muted looping ambient video or a continuously-animating WebGL mesh gradient behind hero text is exactly this class of content. Shipping it with no pause control is a Level A accessibility failure, not just a nice-to-have — this is more strict than just respecting `prefers-reduced-motion` (that covers users with the OS setting on; 2.2.2 requires an on-page control for everyone).

**Why it happens:**
Teams often treat `prefers-reduced-motion` as "accessibility handled" and stop there. But WCAG 2.2.2 is a separate, independent requirement: even users who haven't set the OS-level reduced-motion preference are entitled to a visible way to stop the motion if it's decorative and continuous.

**How to avoid:**
- Respect `prefers-reduced-motion: reduce` as the default *and* separately provide a visible/discoverable pause control (e.g., a small "pause animation" icon button near the hero) for users who haven't set that OS preference but still want to stop it.
- Cap any single loop/animation cycle understanding: if the motion is genuinely continuous (loops forever), the "more than 5 seconds" clock never resets, so the control is mandatory — this is not a "just make loops short" workaround.
- The `aria-hidden` treatment planned for decorative video (per PROJECT.md) removes it from the accessibility tree for screen readers, but does NOT satisfy 2.2.2 — visual pause/stop is still required for sighted users experiencing vestibular or attention issues.

**Warning signs:**
- No pause/stop/hide control anywhere in the hero or video sections.
- Accessibility audit (axe, WAVE) flags "no mechanism to pause moving content" — note automated tools often miss this criterion since it requires manual/contextual judgment; do a manual check specifically for it.

**Phase to address:**
Hero/video phase — build the pause control as part of the same component, not as an accessibility "polish pass" afterward. Verify explicitly against WCAG 2.2.2 text, since automated a11y scanners frequently miss this one.

---

### Pitfall 6: Text/CTA contrast fails over a moving gradient or video background

**What goes wrong:**
A shifting mesh-gradient or video background means text contrast against the background is not a single static value — it changes as the animation plays. A color combination that passes WCAG AA contrast (4.5:1 for body text, 3:1 for large text) against one frame of the gradient can fail against a lighter or busier frame a second later. This is worse over video, where footage may include bright skies, white coats, or reflective surfaces that spike luminance under the CTA text.

**Why it happens:**
Contrast is usually checked once, against a screenshot, not across the animation's full range — and against a single representative video frame rather than the brightest/busiest frame.

**How to avoid:**
- Never place body text or CTA labels directly on raw animated background; use a fixed-opacity scrim/overlay (a solid or gradient dark panel, e.g. navy at 40-60% opacity) between the animation and the text, so contrast is governed by the scrim color, not the moving content underneath.
- Check contrast against the darkest AND lightest points the gradient/video reaches, not just a "typical" frame.
- For frosted-glass cards (per PROJECT.md's visual direction), verify `backdrop-filter` blur still leaves enough underlying-color consistency for the text sitting on the glass to hit AA contrast in both light and dark sections of the animation.

**Warning signs:**
- Contrast checker passes on a screenshot but a stakeholder viewing the live animated site says text is "hard to read for a second" as the gradient shifts.
- Video B-roll includes bright/reflective moments (window light, lab coats) directly behind hero text.

**Phase to address:**
Visual system phase (palette/typography) and hero/video phase jointly — establish the scrim/overlay pattern as a reusable component before either the WebGL hero or the ambient video sections are built, so both inherit the same safe-contrast approach.

---

### Pitfall 7: GitHub Pages hosting can't set cache-control/range headers, breaking video seeking and long-term caching

**What goes wrong:**
GitHub Pages serves all static assets with fixed, non-configurable caching behavior (short/near-zero cache lifetimes for HTML, and no ability to set custom `Cache-Control`, `Content-Type`, or confirm robust HTTP Range request support that a `<video>` scrubber depends on for smooth seeking). Because `output: 'export'` under Next.js also disables the `headers()` config option entirely (already flagged in CONCERNS.md), there is no path to fix this at the app layer while staying on GitHub Pages.

**Why it happens:**
Teams assume "it's just a static file host, of course it supports range requests and caching like any CDN" — GitHub Pages is fronted by Fastly and does support byte-range requests for video in practice, but there's no control over cache headers or bandwidth throttling behavior, and the soft 100GB/month bandwidth limit and recommended ~1GB total site size are easy to blow through with even a few uncompressed video clips.

**How to avoid:**
- Keep every video clip small (single-digit MB, ideally under 3-5MB per clip after compression) and prefer looping short clips (5-15s) over long ones.
- Do not treat GitHub Pages as a general video CDN; if video weight grows (multiple sections, higher resolution, testimonials later), plan to move video hosting to a real video CDN or object storage with proper cache headers (Cloudflare Stream, Bunny CDN, S3+CloudFront) rather than pushing more raw MP4/WebM into the `public/` folder and the git repository itself.
- Remember every video file lives in the git repository history forever once committed — large binary churn (swapping video versions) bloats repo size over time in a way that's hard to undo without history rewriting.

**Warning signs:**
- Repository or published site approaches the ~1GB GitHub Pages soft limit.
- Video scrubbing/seeking behaves oddly or stalls (though this is a Fastly-level unknown, not guaranteed to reproduce — treat it as reason for caution, not certainty).
- Monthly bandwidth approaches 100GB — for a solo recruiting business this is unlikely early on, but any content going viral or heavy ambient video autoplaying on every visit compounds usage quickly.

**Phase to address:**
Video-embed phase — set and enforce a per-clip file-size budget up front (as PROJECT.md's constraints already gesture at: "Keep individual clips small, loaded only when visible").

---

### Pitfall 8: Moving `/goals` and family photos out of the deployed site doesn't remove them from public exposure — they remain in git history

**What goes wrong:**
Simply deleting `src/app/goals/` and `public/family/*.jpg` in a new commit removes them from the *current* working tree and the next deployed build, but every prior commit containing those files remains fully readable in the repository's git history — anyone with read access to the GitHub repo (and this is likely a public repo, since GitHub Pages custom-domain sites are commonly on public repos) can check out an old commit or browse history and see the personal financial goals and family photos that were supposedly removed for privacy.

**Why it happens:**
"Delete the file" reads as "the problem is fixed" — but git's entire design is to retain history, and a plain `git rm` + commit is not a security control, only a UI-level hide from the current tree.

**How to avoid:**
- If the repository is public (or could become public), rewriting history with `git filter-repo` (preferred, faster/safer than legacy `filter-branch`) or BFG Repo-Cleaner is required to actually purge the file blobs from all historical commits, not just delete-and-commit.
- Rewriting history changes commit SHAs for the entire repository going forward — coordinate this as a deliberate one-time operation (force-push to a rewritten history), not an incidental side effect of a feature branch merge; do it before or independent of the WebGL/video work, since it affects the whole repo's history, not just this branch.
- After rewriting, treat any content that existed in the file (the specific dollar figures, family member names/faces in photos) as still potentially cached by GitHub's own systems, search engine caches, or anyone who already cloned/forked the repo — history rewriting reduces but does not guarantee zero exposure for content that was ever public.
- Confirm current repo visibility (public vs private) first — if this is currently a private repo, the urgency changes (the current risk is only "if made public later" or "if collaborators have wider access than assumed"), but the plan to publish more content and drive more traffic (per CONCERNS.md's explicit recommendation) makes this worth resolving before the WebGL/video work draws more eyes to the repo.

**Warning signs:**
- Repository visibility is public and `git log --all --oneline -- src/app/goals` (or similar) still returns commits after a "removal" commit.
- No history-rewrite step appears anywhere in the plan for handling `/goals`.

**Phase to address:**
Should be resolved as its own early phase/step, before or in parallel with the WebGL/video work — this is a repo-hygiene and privacy fix independent of the visual refresh, and CONCERNS.md already flags it as something to resolve "before doing further public-facing work that will draw more attention/traffic to the site."

---

### Pitfall 9: Calendly's embed script and cookie/GDPR banner degrade performance and mobile UX if added carelessly

**What goes wrong:**
Calendly's widget JS (`assets.calendly.com/assets/external/widget.js`) is a third-party script that, loaded naively on every page for a site-wide "Book an intro chat" CTA, adds render-blocking or main-thread cost on every route even when the visitor never opens the popup. Separately, Calendly shows its own cookie/GDPR consent banner inside the embed by default; on mobile this banner can take over the entire embed viewport and make it difficult to reach the actual booking form, directly working against the project's core value ("every visitor can book an intro chat in one click").

**Why it happens:**
The naive integration path is to drop Calendly's official embed snippet in a shared layout/header component so it's "available everywhere," which loads the full widget script on first paint of every page rather than only when a visitor actually triggers the popup.

**How to avoid:**
- Load the Calendly widget script lazily: only inject/execute `widget.js` on first user interaction with the "Book an intro chat" CTA (e.g., on click, dynamically append the script tag if not already present), not eagerly on every page load. Calendly's own popup snippet pattern supports this — the click handler can check if the script is loaded and inject it on demand.
- Decide deliberately on the GDPR banner: either accept Calendly's default banner (simplest, most compliant out of the box) or use `hide_gdpr_banner=1` only if the site's own privacy policy/consent handling explicitly covers Calendly's cookies — hiding the banner shifts consent responsibility onto this site, which is a real legal decision, not just a UX tweak. Given this is a simple recruiting brochure site with likely no existing cookie consent infrastructure, keeping Calendly's default banner (rather than suppressing it and taking on that compliance burden) is the lower-risk default.
- Test the popup specifically on mobile Safari/Chrome to confirm the banner doesn't block the booking form; if it does, that's a strong signal to not hide the banner but instead reduce friction elsewhere (e.g., a clear "tap to continue" affordance).
- Since GitHub Pages/static export has no way to set a Content-Security-Policy header (per CONCERNS.md), if a CSP is ever added later via a `<meta>` tag, it must explicitly allow `assets.calendly.com` and `calendly.com` in `script-src`/`frame-src`/`connect-src`, or the embed will silently fail to load with no visible error beyond the console.

**Warning signs:**
- Lighthouse flags a large third-party script cost on pages where the visitor never opened Calendly.
- Mobile QA shows the booking popup's cookie banner covering the date/time picker.

**Phase to address:**
Calendly integration phase — build the lazy-load-on-interaction pattern as the default implementation, not an optimization to revisit later.

---

### Pitfall 10: SEO regression when hero/marketing copy moves into client components that render nothing without JS

**What goes wrong:**
The current site is 100% server-rendered static JSX with no client components — search engines and any JS-disabled fetch see full content immediately. If, during the redesign, headline copy, service descriptions, or key marketing text get pulled *inside* the new WebGL/video client component (rather than staying as plain server-rendered text layered visually on top of it), that content becomes dependent on client-side JS execution to appear in the DOM at all. Under `output: 'export'`, this is especially risky because there's no server to fall back to — the static HTML shipped to crawlers/slow connections is whatever was captured at build/export time.

**Why it happens:**
It's tempting to keep hero heading + CTA together with the WebGL canvas in one "HeroSection" client component for convenience, since they're visually coupled. That conflates "this needs client JS" (the canvas) with "this needs client JS" (the text), when only the former is actually true.

**How to avoid:**
- Keep all real content (headings, paragraphs, CTA link text, service copy) in server components (no `"use client"`) rendered directly into the static HTML export.
- The WebGL canvas and video elements should be siblings/backgrounds positioned via CSS (absolute/fixed, z-index behind content), not wrappers around the text — the text's presence in the DOM should never depend on the canvas component mounting or executing.
- Since this is a static export (not using Next's dynamic per-request rendering), there's no SSR-vs-CSR runtime distinction to worry about beyond build time — but the discipline of "text lives in server components, motion lives in client components" is what prevents this from becoming a problem when component boundaries are drawn.

**Warning signs:**
- Viewing the exported static HTML (`out/index.html`) with JS disabled shows missing headline/CTA text that's visible with JS on.
- `curl` on the deployed page or "View Page Source" doesn't show marketing copy that a Lighthouse/crawler-simulating tool does see.

**Phase to address:**
Component-splitting phase (splitting the monolithic page into `src/components/sections/*`, already an Active requirement in PROJECT.md) — establish the client/server component boundary correctly at that point, before the WebGL/video content is layered in.

---

### Pitfall 11: Tailwind v3→v4 migration (or continuing to run broken v4 syntax on v3) breaks brand colors silently, with no build error

**What goes wrong:**
CONCERNS.md already confirms `globals.css` uses Tailwind v4's `@theme inline` syntax while the installed/locked version is v3.3.3 — this means `text-primary`, `bg-primary`, `text-secondary`, etc. compile to *zero* CSS rules today, with no build error, because Tailwind v3 just doesn't understand `@theme` and silently ignores the block. If the team either (a) leaves this broken while building new WebGL/video components with the same "will add colors later" assumption, or (b) attempts a real v4 upgrade without following the full migration path, further silent color/utility breakage is likely across the new components.

**Why it happens:**
Tailwind v3's PostCSS pipeline doesn't error on unrecognized `@theme` blocks — it just produces no output for those classes, so the failure mode is invisible without explicitly compiling and inspecting output CSS (as CONCERNS.md's audit did).

**How to avoid:**
- Decide explicitly, as a dedicated early step, whether to (a) fix the immediate bug within v3 by adding `theme.extend.colors` mappings pointing at the existing CSS custom properties (fast, unblocks new component work immediately), or (b) do a full, deliberate Tailwind v4 upgrade (moves config into CSS via documented `--color-*`/`--font-*`/`--spacing-*` namespaces, requires the `@tailwindcss/upgrade` codemod, and requires Safari 16.4+/Chrome 111+/Firefox 128+ browser support — verify this doesn't regress support for any real visitor browsers before committing to it).
- If choosing the v4 upgrade path: run the automated codemod first, then manually verify every custom property name follows the correct namespace (e.g. `--font-*` not `--font-family-*`) since a wrong namespace silently produces no utility, exactly the same class of bug as today's issue — budget real time for manual verification, not just trusting the codemod's ~80% automation.
- Either way, add a CI or pre-commit check that actually compiles Tailwind and greps the output CSS for the expected brand utility classes (`.text-primary`, `.bg-primary`, etc.) so this class of silent breakage can never ship undetected again — this is the same verification technique CONCERNS.md used manually; automate it.

**Warning signs:**
- Any new component (hero, video section) written using `text-primary`/`bg-primary`/etc. renders in default black/inherited color with no visual error, no console warning, no build failure.
- `npx tailwindcss -i ./src/app/globals.css -o /tmp/out.css` output doesn't contain a given utility class that source code uses.

**Phase to address:**
Should be resolved before or at the very start of the visual-system phase (new palette/typography), since every subsequent phase (hero, video sections, Calendly CTA styling) will use these same color utilities — fixing it after building on top of broken colors means restyling everything twice.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Ship stock footage as a placeholder for the "For Employers"/"For Candidates" video sections | Unblocks v1 launch without waiting on real footage/production | Generic stock video reads as impersonal/inauthentic for a trust-driven healthcare brand; visitors (especially BCBA/RBT candidates evaluating a recruiter) may subconsciously discount credibility if footage looks like generic "diverse people in an office" b-roll | Acceptable short-term per PROJECT.md's explicit scope decision ("Custom-filmed video production" is out of scope, "Micah can swap in real testimonials later") — but flag it as a known compromise, choose footage carefully (avoid the most obviously staged/generic clips), and plan the swap-to-real-footage path explicitly rather than letting stock video become permanent by default |
| Hide Calendly's GDPR cookie banner via `hide_gdpr_banner=1` to reduce visual clutter | Cleaner-looking popup, less friction-feeling UI | Shifts legal consent responsibility for Calendly's cookies onto the site owner without any consent infrastructure in place | Never acceptable without adding equivalent consent handling elsewhere on the site first |
| Use `next/image` with `unoptimized: true` (already required for static export) and skip any manual image compression pass for new hero/video poster assets | Simple, no extra build tooling needed | Every image ships at full source size/dimensions exactly as committed — the existing 440KB office-bg.jpg LCP problem repeats itself for any new poster/fallback image unless manually compressed before commit | Never acceptable for the LCP-critical hero poster; only tolerable for below-the-fold decorative images that don't affect Core Web Vitals |
| Keep both `next.config.js`/`next.config.ts`/`next.config.jsold` (and duplicate Tailwind/PostCSS configs) around "for now" while adding WebGL webpack/asset-loader config | Avoids a cleanup detour before feature work starts | High chance a future config change (e.g. `.glsl`/`.wasm` loader rules) lands in a dead file, producing silent no-op changes that waste debugging time | Never acceptable — this is explicitly flagged in CONCERNS.md as high risk once WebGL config is added; delete dead config files before or during the hero phase |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|-------------------|
| Calendly popup embed | Loading `widget.js` eagerly in a shared layout/header so it runs on every page load regardless of whether the visitor clicks the CTA | Inject the script on first click/interaction with the "Book an intro chat" CTA; check `window.Calendly` before re-injecting |
| Calendly popup embed | Assuming the popup opens identically on mobile Safari as desktop, without testing the cookie banner's mobile layout | Manually test the popup flow on a real iPhone in Safari; consider whether `hide_gdpr_banner` plus site-level consent is warranted vs. accepting the default banner |
| GitHub Pages static hosting | Assuming `next.config.js` `headers()`/CSP/cache-control config will take effect in production | Recognize `output: 'export'` disables `headers()` entirely; any header-level control (CSP, cache, `Permissions-Policy`) requires migrating off GitHub Pages to a platform like Vercel/Cloudflare Pages, which is explicitly out of scope for this milestone |
| WebGL library selection (three.js / react-three-fiber) | Pulling in the full r3f + drei ecosystem for a single ambient shader effect | Prefer a lighter WebGL abstraction or hand-written GLSL for a mesh-gradient/particle-network effect, matching the "no heavy 3D" out-of-scope decision already made in PROJECT.md |
| Video hosting on GitHub Pages | Committing raw, uncompressed video exports (potentially tens of MB each) directly to `public/` and git | Pre-compress to WebM (VP9/AV1) + MP4 (H.264) fallback pair, each clip ideally under 3-5MB, before committing; never commit an unprocessed source export |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| WebGL/video JS bundled into every route's shared chunk instead of code-split to the home page only | About page and other non-hero routes ship large unused JS; mobile Lighthouse score drops sitewide, not just on the home page | Use `next/dynamic({ ssr: false })` scoped to the specific page/component that needs it; verify per-route JS size in `next build` output | Noticeable at first mobile Lighthouse run after the hero ships — this is not a "scale" threshold, it manifests immediately |
| Autoplaying ambient video on every "For Employers"/"For Candidates" section simultaneously | Multiple concurrent video decode streams drain mobile battery/CPU fast and can cause visible frame drops or thermal throttling on lower-end phones | Only autoplay the video that's currently in/near the viewport (`IntersectionObserver`); pause/unload video elements once scrolled well out of view | Becomes visible once more than one video section exists on a single page, especially on mid-range Android hardware |
| Backdrop-blur header (`backdrop-blur-sm`) compositing simultaneously with an animated WebGL canvas | Scroll jank from two independent GPU compositing operations fighting for frame budget | Profile scroll performance specifically with the WebGL hero active; consider disabling backdrop-blur or reducing its area while the hero animation is in view | Already flagged as a latent risk in CONCERNS.md; worth checking as soon as both features coexist, not deferred to "if it's slow" |
| Cursor-reactive "connected nodes" shader layer computing on every mousemove without throttling | High CPU usage and potential INP regression from mousemove handlers firing every frame | Throttle/debounce mousemove sampling (e.g., via `requestAnimationFrame`-gated updates, not raw event-driven redraws) | Becomes noticeable on lower-end devices or when many mousemove-driven redraws compound with the WebGL render loop itself |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Treating `git rm` of `/goals` and `public/family/*` as sufficient privacy protection | Personal financial figures and family photos remain permanently visible to anyone browsing git history on the (likely public) GitHub repo | Rewrite git history with `git filter-repo` (or BFG) to purge the blobs entirely, as its own dedicated step, before increasing site traffic/visibility |
| No `robots.txt`/`noindex` before removal is complete | Search engines may have already indexed `/goals` from before removal; cached results can persist even after the page is gone | Add `robots.txt` disallowing crawl of any residual paths and request removal from Google Search Console if the URL was ever indexed, in addition to deleting/purging the content |
| Loading third-party scripts (Calendly, any future video CDN embed) with no CSP because GitHub Pages can't set one | Slightly larger XSS/content-injection surface if any third-party script is ever compromised or a dependency is later added carelessly | Since a real HTTP-header CSP isn't available on GitHub Pages, at minimum use a `<meta http-equiv="Content-Security-Policy">` tag scoped to explicitly allow only the known-needed third-party origins (Calendly), and audit any new third-party script addition against that list |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Ambient ombre/gradient WebGL hero with no visible pause control and no reduced-motion fallback | Visitors with vestibular disorders or motion sensitivity may feel discomfort or leave the site; also a WCAG 2.2.2 Level A violation | Build the static-poster/gradient fallback and an explicit pause control as core requirements of the hero component, not optional polish |
| Stock video that looks generic/staged for a healthcare-trust brand | Candidates and healthcare-employer visitors may subconsciously discount the recruiter's credibility if the "human" feel the redesign is going for reads as inauthentic stock footage | Curate footage carefully — favor understated, less obviously-staged clips (hands, close details, quiet moments) over generic "diverse smiling people in an office" b-roll; treat this as a real brand-trust risk, not just an aesthetic nice-to-have |
| Calendly's own cookie banner blocking the booking flow on mobile | Directly undermines the site's core value ("book an intro chat in one click") if the banner covers the date picker | Test the full booking flow on real mobile devices as an explicit acceptance criterion for the Calendly integration phase |
| WebGL hero rendering fine on the developer's high-end machine but janky/laggy on a low-/mid-tier Android phone (the likely device for many LinkedIn-referred candidates) | Poor first impression exactly where the redesign is trying to build trust and polish | Test on actual mid-tier Android hardware or throttled CPU/GPU in DevTools, not just a modern laptop or high-end phone |

## "Looks Done But Isn't" Checklist

- [ ] **WebGL hero:** Often missing a `prefers-reduced-motion` fallback that's actually wired to a media query listener (not just checked once on mount) — verify by toggling the OS setting live while the page is open, not just on page load.
- [ ] **WebGL hero:** Often missing `webglcontextlost`/`webglcontextrestored` handling — verify by forcing context loss via the `WEBGL_lose_context` extension in dev tools and confirming graceful fallback rather than a frozen/black canvas.
- [ ] **Ambient video:** Often missing the `muted playsinline` combination as literal HTML attributes (not JS-only) — verify by testing on a real iPhone, not just Chrome DevTools device emulation.
- [ ] **Ambient video:** Often missing a visible pause/stop control for WCAG 2.2.2 — verify manually since automated a11y scanners frequently don't catch this criterion.
- [ ] **Calendly CTA:** Often missing lazy-loading of the widget script — verify via Network tab that `widget.js` only loads after the CTA is clicked, not on every page load.
- [ ] **Brand colors:** Often "looks styled" in a quick glance but is actually falling back to default black/inherited color — verify by compiling Tailwind output and grepping for the specific utility classes used (`text-primary`, `bg-primary`, etc.).
- [ ] **Static export SEO:** Often looks fine in a normal browser (JS runs) but is missing content in the actual exported HTML — verify with `curl` or "View Page Source" / JS-disabled browsing on the built `out/` directory, not just the dev server.
- [ ] **`/goals` removal:** Often looks resolved because the live site no longer shows the page — verify by checking `git log --all` (or the public GitHub commit history UI) for the file's continued presence in history after "removal."
- [ ] **Video file size:** Often looks fine locally on fast wifi — verify actual file sizes committed to `public/` (or wherever hosted) are within the small-clip budget, and test loading behavior on throttled 4G in DevTools.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|-----------------|
| Canvas/video ends up as LCP element after ship | LOW | Add/adjust a headline or poster image to be the largest paint candidate; re-run Lighthouse to confirm LCP element changed |
| WebGL context-loss crash discovered in the field | MEDIUM | Add the listener pair retroactively; ship the same static-fallback component already built for reduced-motion as the recovery path rather than building new recovery logic |
| Tailwind broken colors shipped to production silently | LOW | Add the `theme.extend.colors` mapping (quick fix) or complete the v4 migration; re-deploy — no data/user impact, purely cosmetic and reversible instantly |
| `/goals`/family photos found still in git history after "removal" | MEDIUM-HIGH | Run `git filter-repo` to purge history, force-push the rewritten history, notify any collaborators to re-clone, and request Google Search Console removal if indexed; cannot guarantee removal from third-party caches/forks already made |
| Calendly banner blocking mobile booking flow discovered post-launch | LOW | Toggle `hide_gdpr_banner` parameter or restyle the popup container's height/scroll behavior; low-risk, quick to test and redeploy |
| Video autoplay silently failing on iOS discovered post-launch | LOW | Add missing `muted`/`playsinline` attributes; quick fix, but requires real-device retest to confirm |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Canvas/video as LCP element | Hero implementation phase | Lighthouse mobile run confirms LCP element is text/poster, not canvas/video; LCP ≤ 2.5s |
| Hydration/INP cost from WebGL bundle | Hero implementation phase | Per-route JS bundle size checked in `next build` output; INP/TBT measured before and after hero merge |
| WebGL context loss | Hero implementation phase | Manual test forcing `WEBGL_lose_context`; confirms fallback renders instead of frozen canvas |
| iOS Safari autoplay failure | Video-embed phase | Real iPhone test (normal + Low Power Mode) confirms video plays; `.play()` rejection handled without console error |
| WCAG 2.2.2 pause control missing | Hero/video phase | Manual accessibility check (not just automated scanner) confirms a working pause/stop/hide control exists |
| Contrast over moving background | Visual system phase + hero/video phase | Contrast checked against darkest and lightest points of animation/video, with scrim overlay in place |
| GitHub Pages video hosting limits | Video-embed phase | Per-clip file size budget enforced (e.g., <5MB); total repo/site size tracked against ~1GB soft limit |
| `/goals` and family photos in git history | Dedicated privacy-cleanup phase (early, independent of visual work) | `git log --all` no longer returns the files after history rewrite; repo visibility confirmed |
| Calendly performance/consent | Calendly integration phase | Network tab confirms lazy script load; mobile test confirms booking flow isn't blocked by the cookie banner |
| SEO content trapped in client components | Component-splitting phase | JS-disabled view of exported static HTML shows all marketing copy present |
| Broken Tailwind v3/v4 color tokens | Visual system phase (before any new component styling begins) | Compiled Tailwind output CSS contains the expected utility classes (`.text-primary`, etc.) |

## Sources

- [Largest Contentful Paint (LCP) — web.dev](https://web.dev/articles/lcp)
- [Largest Contentful Paint — MDN](https://developer.mozilla.org/en-US/docs/Glossary/Largest_contentful_paint)
- [WebGL & Three.js Site SEO: Make 3D Sites Rankable (2026) — Utsubo](https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide)
- [HandlingContextLost — Khronos WebGL Public Wiki](https://www.khronos.org/webgl/wiki/HandlingContextLost)
- [HTMLCanvasElement: webglcontextlost event — MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event)
- [HTMLCanvasElement: webglcontextrestored event — MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextrestored_event)
- [Non-Intrusive WebGL, Part 1: Context Loss & Preloading — Matt DesLauriers](https://medium.com/@mattdesl/non-intrusive-webgl-cebd176c281d)
- [New `<video>` Policies for iOS — WebKit blog](https://webkit.org/blog/6784/new-video-policies-for-ios/)
- [WCAG 2.2.2 Pause, Stop, Hide — W3C Understanding docs](https://www.w3.org/TR/UNDERSTANDING-WCAG20/time-limits-pause.html)
- [Understanding SC 2.2.2 — Silktide accessibility guide](https://silktide.com/accessibility-guide/the-wcag-standard/2-2/enough-time/2-2-2-pause-stop-hide/)
- [prefers-reduced-motion — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [Animation and motion — web.dev accessibility learning path](https://web.dev/learn/accessibility/motion)
- [GitHub Pages limits — GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub Pages sites have a soft bandwidth limit of 100GB/month — Hacker News discussion citing GitHub docs](https://news.ycombinator.com/item?id=42039554)
- [Removing sensitive data from a repository — GitHub Docs](https://docs.github.com/en/enterprise-server@3.0/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Remove Large Files from Git History: filter-repo & BFG — DeployHQ](https://www.deployhq.com/git/removing-large-files-from-git-history)
- [Web video codec guide — MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs)
- [Upgrade guide — Tailwind CSS official docs](https://tailwindcss.com/docs/upgrade-guide)
- [TailwindCSS v4 Migration Guide — dev.to](https://dev.to/umesh_malik/tailwindcss-v4-migration-guide-what-changed-and-how-to-upgrade-525g)
- [Guides: Static Exports — Next.js official docs](https://nextjs.org/docs/app/guides/static-exports)
- [Guides: Lazy Loading — Next.js official docs](https://nextjs.org/docs/pages/guides/lazy-loading)
- [Calendly cookie management and banner — Calendly Help](https://calendly.com/help/calendly-cookie-management-and-banner)
- [Cookie banner on mobile negatively impacting my conversions — Calendly Community](https://community.calendly.com/api-webhook-help-61/cookie-banner-on-mobile-negatively-impacting-my-conversions-1416)
- [GDPR FAQs — Calendly Help](https://help.calendly.com/hc/en-us/articles/360007032633-GDPR-FAQs)
- [Healthcare Brands Are Moving Beyond Stock Imagery — Socialfly](https://socialflyny.com/healthcare-brands-are-moving-beyond-stock-imagery/)
- [Why Stock Photos Are Hurting Your Physical Therapy Website — ThriveHD](https://www.thrivehd.com/why-stock-photos-are-hurting-your-physical-therapy-website/)
- Project-specific: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md` (mvforster-talent-solutions repo)

---
*Pitfalls research for: WebGL hero + background video + Calendly on static Next.js/GitHub Pages healthcare recruiting site*
*Researched: 2026-09-29*

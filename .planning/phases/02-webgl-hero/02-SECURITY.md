---
phase: 02
slug: webgl-hero
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-12
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry -> repo | Third-party code (`ogl`) enters the production bundle | Build-time dependency code |
| local harness server -> filesystem | Dev-only HTTP server (`scripts/hero-harness.mjs`) reads repo files to serve to headless Chrome | Repo source (type-stripped `.ts`), ogl `src/`, PNG/WebP artifacts |
| browser pointer/touch events -> simulation | Untrusted-but-benign numeric coordinates feed node math | Numeric pointer/touch coordinates |
| dev harness -> public/ | Script writes binary assets that ship in the static export | Encoded WebP still images |
| browser events -> render loop | pointer/touch/visibility/intersection events drive client state | DOM event data, visibility flags |
| GPU driver -> page | context loss is an external, uncontrolled event | WebGL context-lost/restored signals |
| static HTML -> visitor | Server-rendered markup and same-origin static assets only | Hero markup, chooser anchors, still images |
| dev smoke-test server -> filesystem | `scripts/hero-smoke.mjs` reads the built `out/` export | Static export files served to headless Chrome |
| GPU driver -> page (shader link) | Shader compile/link results come from an untrusted, device-specific driver | Link-status booleans, driver info logs (not surfaced) |
| static build -> visitor browser | Committed WebP stills served as first-paint LCP images | Pre-rendered still images |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-SC | Tampering | `npm install ogl` | mitigate | Exact pin `"ogl": "1.0.11"` in `package.json:18` (no caret); `package-lock.json` records integrity hash `sha512-kUpC154A...` for `node_modules/ogl`; CI runs `npm ci` (`.github/workflows/nextjs.yml:20`); no other packages added across 02-01..02-07 (`git log --oneline -- package.json` shows a single ogl-adding commit `b0566d0` in this phase) | closed |
| T-02-01 | Tampering | shader source | accept | All GLSL in `src/components/hero/shaders.ts` is static template-literal source with zero `${}` interpolation (verified: `grep '\${' shaders.ts` → no matches); no runtime/user data reaches shader compilation | closed |
| T-02-02 | Denial of Service | WebGL context | mitigate | `createHeroScene()` (`src/components/hero/heroScene.ts:200`) constructs exactly one `new Renderer(...)`; `destroy()` (line 287-291) calls `gl.getExtension("WEBGL_lose_context")?.loseContext()`, guarded by a `contextLost` flag so a second call is a no-op | closed |
| T-02-03 | Information Disclosure | `scripts/hero-harness.mjs` server | mitigate | `server.listen(0, "127.0.0.1", ...)` (line 297); path-traversal guard rejects any `pathname.includes("..")` with 400 (line 208-212) before any filesystem read; module names restricted to `MODULE_NAME_RE = /^[A-Za-z0-9_-]+$/` (line 60, enforced line 247-251); `server.close()` in `finally` in `main()` (line 822-824), `renderFrame()` (line 603-607), and `runBreakShaderCheck()` (line 721-723) | closed |
| T-02-04 | Tampering | pointer coords -> stepNodes | accept | `nodeNetwork.ts` contract only ever consumes coordinates as numbers in distance math; `scripts/hero-network.test.mjs` proves `buildNetworkBuffers` emits only finite, clamped values; coordinates are never rendered as text/HTML, persisted, or transmitted | closed |
| T-02-05 | Denial of Service | O(n^2) link loop | mitigate | Node count capped at `HERO_NODE_COUNT_DESKTOP = 48` (`heroConfig.ts`); `allocateBuffers(HERO_NODE_COUNT_DESKTOP)` called exactly once per scene construction (`heroScene.ts:139`, inside `buildScene`), buffers reused every frame in `render()` with no per-frame allocation | closed |
| T-02-06 | Denial of Service (LCP budget) | still images | mitigate | `encodeStillWebp()` (`hero-harness.mjs:531-571`) loops quality/scale tiers until `stats.size <= HERO_STILL_MAX_BYTES` (61440) or throws; RIFF/WEBP magic-byte check (line 630-637) before accepting output. Live `stat` of committed files: desktop 7560B, mobile 5092B, tablet 11740B — all under budget with valid `RIFF....WEBP` headers | closed |
| T-02-07 | Tampering | optional `layers` scene option | accept | `grep -rn "layers:" src/components/hero/useHeroRenderer.ts src/components/hero/HeroCanvas.tsx src/components/hero/HeroCanvasLoader.tsx` → no matches; only `scripts/hero-harness.mjs` passes `layers: "gradient"`; production call in `useHeroRenderer.ts:94-103` omits the field entirely (defaults to `"all"`) | closed |
| T-02-08 | Denial of Service | touch handlers blocking scroll | mitigate | `grep -c preventDefault useHeroRenderer.ts` → 1 (only inside `onContextLost`, line 127); `grep -cE 'passive:\s*true'` → 7 (pointermove, pointerleave, touchstart, touchmove, touchend, touchcancel all registered `{ passive: true }`, lines 209-220) | closed |
| T-02-09 | Denial of Service | runaway GPU/battery use | mitigate | Loop effect (`useHeroRenderer.ts:251-300`) gates on `shouldRun({ inView, tabVisible, paused, contextLost })` from `renderLoop.ts`; `frameIntervalFor()` caps to `HERO_NARROW_FPS` (30fps) below 768px; `clampDpr()` caps DPR to 1.5 below 768px, 2 above; `destroy()` releases the context on unmount (mount-effect cleanup, line 240) | closed |
| T-02-10 | Denial of Service | WebGL context exhaustion on remounts | mitigate | One `createHeroScene()` call per mount effect (runs once, `[containerRef]` dependency is a stable ref identity); cleanup (line 222-242) removes all listeners, then `scene?.canvas.remove()`, then `scene?.destroy()`; `grep -cE 'getContext\(' useHeroRenderer.ts` → 0 (no second capability probe) | closed |
| T-02-11 | Information Disclosure | persisted motion preference | mitigate | `paused` lives only in `useState(false)` (`useHeroRenderer.ts:33`); `grep -cE 'localStorage|sessionStorage|document\.cookie' src/components/hero/*.ts src/components/hero/*.tsx` → 0 across all 10 hero files | closed |
| T-02-12 | Tampering | context-loss recovery | accept | `onContextRestored()` (`useHeroRenderer.ts:134-137`) is a documented no-op; `event.preventDefault()` is called in `onContextLost` to keep the door open, but no resource rebuild is attempted this phase — matches D-06 fail-invisible disposition | closed |
| T-02-13 | Spoofing/Tampering | chooser anchor links | accept | `Hero.tsx:75,78` — both chooser links are same-page fragments (`href="#employers"`, `href="#candidates"`), no external URLs or query params | closed |
| T-02-14 | Information Disclosure | audience choice | mitigate | `grep -n "onClick\|localStorage\|sessionStorage" src/components/sections/Hero.tsx` → no matches; chooser `<a>` elements carry no event handlers and no storage calls | closed |
| T-02-15 | Denial of Service (booking path availability) | hero layout | mitigate | `Hero.tsx` is a server component (no `'use client'`) rendering the still, copy, and chooser directly; live build check: `out/index.html` contains `bg-brand-strong` (1), `href="#employers"` (1), `href="#candidates"` (1), and zero `<canvas` occurrences | closed |
| T-02-16 | Information Disclosure | `scripts/hero-smoke.mjs` server | mitigate | `server.listen(0, "127.0.0.1", ...)` (line 150); `pathname.includes("..")` rejected with 400 (line 114-118); all file reads are prefix-checked against `OUT_DIR` (line 129-133); `server.close()` in `finally` (`main()` line 498-500) | closed |
| T-02-17 | Denial of Service (first paint) | ogl bundle | mitigate | `checkOglBundle()` (`hero-smoke.mjs:311-373`) asserts every chunk containing the distinctive ogl literal is NOT referenced by an initial `<script>` tag and gzips to <= 40960 bytes; live SUMMARY evidence: ogl chunk gzips to 18,854 bytes, `inInitialHtml: false` | closed |
| T-02-18 | Elevation of Privilege | UAT `python3 -m http.server` | accept | Manual, local-only, short-lived process serving only the public static `out/` export; documented in 02-05-SUMMARY.md "User Setup Required" section | closed |
| T-02-G1 | Denial of Service | `heroScene.ts` `createHeroScene` | mitigate | `assertProgramLinked(gl, program, name)` called after each of the 3 `new Program(...)` sites (lines 124, 163, 174); `releaseContext(gl)` called in the `catch` around `buildScene()` (line 220-225) before rethrow. Live verification: `node scripts/hero-harness.mjs --break-shader {gradient,points,lines}` each exits 0 with `"ok":true` and `lost=true` in the title | closed |
| T-02-G2 | Information Disclosure | `glGuards.ts` error message | accept | `assertProgramLinked` throws a fixed `` `hero ${name} program failed to link` `` message (`glGuards.ts:34`) with no driver info-log text; `useHeroRenderer.ts` catch path only sets `contextLost` boolean state, never renders the error string anywhere (confirmed: no error-message JSX in `HeroCanvas.tsx`) | closed |
| T-02-G3 | Tampering | `hero-harness.mjs --break-shader` routes | mitigate | Wrapper route active only when `breakShaderArg` is set (`hero-harness.mjs:252-264`) and `/hero-real/shaders` is a single hardcoded exact-path route (line 235-242); existing 127.0.0.1 bind and `..` rejection (T-02-03) unchanged. Live verification: normal `--check` still exits 0 after break-shader additions | closed |
| T-02-S1 | Tampering | `hero-harness.mjs` variant/CLI input | mitigate | `Object.hasOwn(HERO_STILL_SIZES, v)` guards the `--still` variant lookup (line 751) rejecting prototype-pollution keys; output paths come only from `HERO_STILL_PATHS` constants and fixed artifact filenames | closed |
| T-02-S2 | Denial of Service | `public/hero/*.webp` LCP weight | mitigate | `encodeStillWebp` enforces `HERO_STILL_MAX_BYTES` (61440) per file; live `stat`: desktop 7560B, mobile 5092B, tablet 11740B — all well under budget | closed |
| T-02-S3 | Information Disclosure | `Hero.tsx` config import | accept | `heroConfig.ts` is a pure, import-free constants module with no secrets; `Hero.tsx` has no `'use client'` directive (server component), so the import adds nothing to client JS | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-01 | Shader source is static, authored at build time; no runtime/user data path into GLSL compilation | gsd-security-auditor | 2026-10-12 |
| AR-02-04 | T-02-04 | Pointer coordinates are consumed only as numbers in physics math, never rendered, persisted, or transmitted; unit-tested to stay finite and clamped | gsd-security-auditor | 2026-10-12 |
| AR-02-07 | T-02-07 | The optional `layers: "gradient"` field is only ever passed by the dev harness; production code never sets it and it can only omit decorative meshes, never add capability | gsd-security-auditor | 2026-10-12 |
| AR-02-12 | T-02-12 | WebGL context-loss restoration is intentionally not attempted this phase (D-06 fail-invisible design); the visitor sees the still until reload | gsd-security-auditor | 2026-10-12 |
| AR-02-13 | T-02-13 | Chooser links are same-page fragment anchors only, no external URLs or query parameters, no new framing/redirect surface | gsd-security-auditor | 2026-10-12 |
| AR-02-18 | T-02-18 | The `python3 -m http.server` process used for human UAT is manual, local-only, short-lived, and serves only the public static export already destined for GitHub Pages | gsd-security-auditor | 2026-10-12 |
| AR-02-G2 | T-02-G2 | glGuards.ts error messages are fixed strings naming only the failed program; driver info-log text is never copied in, and the error is caught silently client-side (never rendered to the DOM) | gsd-security-auditor | 2026-10-12 |
| AR-02-S3 | T-02-S3 | heroConfig.ts is a pure constants module with no secrets; Hero.tsx remains a server component so the import never reaches client JS | gsd-security-auditor | 2026-10-12 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-12 | 25 | 25 | 0 | gsd-security-auditor |

**Verification method per threat:** every `mitigate` threat was checked against a live grep/stat of the current implementation files (not SUMMARY claims alone), and 5 threats were additionally re-verified via live command execution in this audit: `npm test` (60/60 passing), `npx tsc --noEmit` (clean), `npm run lint` (0 errors), `node scripts/hero-harness.mjs --break-shader {gradient,points,lines}` (all 3 exit 0 with expected failure+context-lost titles), and `node scripts/hero-harness.mjs --verify-stills` (all 3 variants pass, negative control correctly fails). `accept` threats were checked against their stated rationale in the implementation (e.g., confirmed no `${}` interpolation in shaders.ts, confirmed no `layers:` usage outside the harness) before being logged in the Accepted Risks Log above.

**Unregistered flags:** none. `.planning/phases/02-webgl-hero/02-0{1..7}-SUMMARY.md` were checked for a `## Threat Flags` section; none exists except a plain-text reference to T-02-18 in 02-05-SUMMARY.md (already a registered threat, not new attack surface).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-12

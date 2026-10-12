# Phase 2: WebGL Hero - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log keeps the alternatives that were considered.

**Date:** 2026-10-11
**Phase:** 02-webgl-hero
**Areas discussed:** Motion & network feel, Fallback look, Audience chooser, Hero copy & pause control

---

## Motion & network feel

| Question | Options | Selected |
|----------|---------|----------|
| Gradient color mix | Navy-dominant, teal flow, coral glints / Balanced three-way blend / Teal-forward, lighter | Navy-dominant, teal flow, coral glints |
| Gradient speed | Very slow (~20–30s cycle) / Gentle, clearly visible (~10–15s) / You decide | Very slow |
| Network prominence | Subtle (30–60 nodes) / Noticeable (80–120) / Very minimal (10–20) | Subtle |
| Pointer interaction | Gentle attraction + line highlight (incl. touch) / Soft repel / parallax / Desktop only | Gentle attraction + line highlight |

**Notes:** All recommended options accepted.

---

## Fallback look

| Question | Options | Selected |
|----------|---------|----------|
| Static fallback | Pre-rendered still of shader / Pure CSS gradient / Keep office photo (compressed) | Pre-rendered still |
| Fallback→WebGL transition | Slow crossfade (~600–1000ms) / Instant swap | Slow crossfade |
| office-bg.jpg | Stop using on hero (delete in Phase 4) / Delete now | Stop using on hero |

---

## Audience chooser

| Question | Options | Selected |
|----------|---------|----------|
| Interim targets | Final #employers/#candidates anchors mapped to existing sections / Link #services/#expertise directly / Placeholder sections | Final anchors mapped to existing sections |
| Style | Two glass pill buttons / One solid + one outline / Large cards with subline | Two glass pill buttons |
| Behavior | Smooth scroll only / Scroll + remember choice | Smooth scroll only |
| Reserve Phase 3 CTA slot | Yes / No | Yes |

---

## Hero copy & pause control

| Question | Options | Selected |
|----------|---------|----------|
| Hero copy | Rewrite for healthcare now (options for review) / Keep existing / User provides | Rewrite for healthcare now |
| Pause control position | Bottom-right / Bottom-left / Inline under chooser | Bottom-right |
| Paused state | Freeze current frame / Crossfade back to still | Freeze current frame |
| Persist pause | No, resets each visit / Yes, localStorage | No |

---

## Claude's Discretion

- Shader approach, node counts per breakpoint, line thresholds, attraction easing
- Single vs multi-pass rendering; DPR clamp and mobile frame-rate cap
- How the fallback still is produced, its format, and mobile/desktop variants
- Hero height (no CLS), component/file structure, pause icon (inline SVG)
- Runtime FPS probe only if testing shows a need

## Deferred Ideas

- Site metadata "Technical Recruitment Specialist" copy: Phase 4 SEO
- Remembering the audience choice: not in v1
- Deleting office-bg.jpg: Phase 4 cleanup

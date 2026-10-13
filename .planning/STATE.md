---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-06-PLAN.md
last_updated: "2026-10-13T00:50:04.846Z"
last_activity: 2026-10-13
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 13
  completed_plans: 12
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-29)

**Core value:** Every visitor, whether employer or candidate, can book an intro chat on Calendly in one click from anywhere on the site. The new visuals must make that booking more likely, not get in the way of it.
**Current focus:** Phase 02 — webgl-hero

## Current Position

Phase: 02 (webgl-hero) — EXECUTING
Plan: 2 of 7
Status: Ready to execute
Last activity: 2026-10-13

Progress: [█████████░] 92%

## Performance Metrics

**Velocity:**

- Total plans completed: 6
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 6 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01-foundation P01 | 10min | 2 tasks | 11 files |
| Phase 01-foundation P02 | 12min | 2 tasks | 7 files |
| Phase 01 P06 | 15min | 3 tasks | 1 files |
| Phase 02-webgl-hero P01 | 15min | 3 tasks | 9 files |
| Phase 02 P04 | 20min | 2 tasks | 5 files |
| Phase 02-webgl-hero P05 | 35min | 2 tasks | 2 files |
| Phase 02-webgl-hero P06 | 22min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Init: Upgrade to Node ≥ 20, Next.js 16, Tailwind v4 before any visual work — Next 14 is EOL and brand colors are already broken under v3
- Init: `ogl` for the WebGL hero, `motion` for scroll reveal, official Calendly script loaded on click — smallest bundles that meet the perf budget without forcing React 19
- Init: Keep `/goals` and `public/family/` untouched — user decision, no privacy/history-rewrite phase in this roadmap
- Init: Founder trust section and quantified stats deferred to v2 — pending real numbers from Micah
- [Phase ?]: Node 22 chosen over Node 24 for Phase 1 upgrade — matches local dev runtime (v22.23.2), avoiding CI/local mismatch
- [Phase ?]: Manual Tailwind v3->v4 rewrite instead of @tailwindcss/upgrade codemod — only 2 v3-only class names existed in source
- [Phase ?]: Pinned tailwindcss/@tailwindcss/postcss/postcss to exact versions (no caret ranges) per plan threat model T-01-SC
- [Phase ?]: Next.js 16.3.8 kept, no fallback needed — D-11 smoke test (two / <-> /about round trips, no __next*/__PAGE__/.txt 404s) passed cleanly in Linux/WSL2
- [Phase ?]: Skipped npx @next/codemod for the Next 16 upgrade — no dynamic routes/params/middleware/API routes to migrate; avoided an unpinned package fetch
- [Phase 01-06]: Proceed with Phase 1 merge/deploy without the WebGL hero present — User approved after confirming WebGL hero is Phase 2 scope
- [Phase 01-06]: Do not stash/discard uncommitted config.json change blocking checkout to main — Per resume instructions; coordinator committed the file directly (ae7e5b8) to unblock
- [Phase 02-01]: ogl spike passed on first attempt with no fallback-ladder rung needed — the installed ogl 1.0.11 API matched RESEARCH.md's Renderer/Program/Mesh/Triangle/Transform option names exactly
- [Phase 02-04]: D-12 resolved to option-a — headline 'Great care starts with the right people', subline naming healthcare/behavioral-health/admin audiences and BCBA/RBT roles
- [Phase 02-04]: Kept the plan-mandated data-hero-cta-slot attribute name despite colliding with an acceptance grep for 'cta'; verified the real coral/teal-avoidance intent with a scoped bg-cta/text-cta/bg-accent/text-accent grep instead
- [Phase 02-05]: Replaced --blink-settings=scriptEnabled=false with --disable-javascript for the JS-disabled smoke check — Chrome 148 compatibility; combining --virtual-time-budget with --disable-javascript silently re-enables JS
- [Phase 02-05]: UAT removed the hero's bottom fade entirely rather than retuning it — Any semi-transparent overlay on the navy shader read as a visible divider band; the fade was a Phase 1 carry-over, not a design requirement
- [Phase 02-05]: Header-height measurement confirmed scroll-margin-top: calc(73px + 1rem) is already correct at 1440px and 390px — No globals.css change needed
- [Phase ?]: [Phase 02-06]: Used ogl's exported OGLRenderingContext type for buildScene()'s gl parameter instead of a hand-written WebGLRenderingContext union, matching ogl's stricter Program/Mesh/Geometry constructor types
- [Phase ?]: [Phase 02-06]: Performed a manual negative control during Task 2 verification (temporarily commented out the three assertProgramLinked calls, confirmed --break-shader gradient reports HERO_UNEXPECTED_SUCCESS and exits non-zero, then restored) to prove the check is real

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 1: Next.js 16's static-export nested-route prefetch behavior is single-source and unverified on this project's CI — needs a smoke test right after the upgrade.
- Phase 2: `ogl` mesh-gradient shader implementation needs a small reference spike before the full render loop is built.
- Phase 3: Ambient video needs real iPhone Safari autoplay QA (including Low Power Mode) and a stock-footage licensing decision before implementation.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Trust | TRUST-01/02/03 (founder trust section, quantified stats, testimonials) | v2 | Init |
| Conversion | CONV-01/02 (sticky mobile CTA bar, inline Calendly embed) | v2 | Init |
| Media | MEDIA-01 (custom-filmed video) | v2 | Init |

## Session Continuity

Last session: 2026-10-13T00:50:04.835Z
Stopped at: Completed 02-06-PLAN.md
Resume file: None

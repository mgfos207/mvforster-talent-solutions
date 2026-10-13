---
status: complete
phase: 02-webgl-hero
source: [02-VERIFICATION.md]
started: 2026-10-12T00:00:00Z
updated: 2026-10-12T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. REVIEW WR-01: still and live canvas pick different node tiers near breakpoints (scrollbar and fractional widths)
how: On a Windows or Linux desktop browser with classic scrollbars, open the home page at a viewport width of about 1024-1040px (a 1280x800 laptop at 125% scaling gives 1024px) and again at about 768-784px. Watch the 800ms crossfade from still to canvas.
expected: Either the faint node rearrangement (48 vs 36 nodes, or 36 vs 22) during the crossfade is acceptable, in which case add the WR-01 override from 02-VERIFICATION.md, or it isn't, in which case schedule the fix: pick the live node tier with the same matchMedia queries the <picture> uses.
result: pass
note: Developer accepted the faint node rearrangement; add WR-01 override to 02-VERIFICATION.md.

### 2. REVIEW WR-02: portrait tablet and mobile stills served to landscape viewports
how: Open the home page on a landscape phone (932x430 or 915x412 in device emulation with touch) and in a narrow desktop window (about 1000x700). Watch the crossfade.
expected: Either the shift during the 800ms crossfade still reads as calm, in which case add the WR-02 override and correct the "slightly / bounded" wording in heroConfig.ts, or it reads as a visible jump, in which case add a landscape still variant.
result: pass
note: Developer accepted the landscape crossfade shift as calm; add WR-02 override to 02-VERIFICATION.md and correct the "slightly / bounded" wording in heroConfig.ts.

### 3. Check the new and regenerated stills on real portrait sizes
how: Load the page at 390x844 (phone) and 820x1180 (tablet), then reload each with reduced motion on.
expected: The same calm navy/teal look as the desktop UAT, a crossfade that is barely noticeable on capable devices, and under reduced motion only the still, with no pause button.
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]

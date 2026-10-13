// Pure module: no browser globals or navigator references, and NO runtime
// imports at all. Node's `--experimental-strip-types` loader cannot resolve
// extensionless relative imports, so every pure hero module stays
// import-free by design — callers (heroScene.ts, the harness, React
// components) pass in any environment values they need.
//
// HERO_COLORS mirrors the @theme tokens in src/app/globals.css (Phase 1
// D-04, contrast-checked for WCAG AA). scripts/hero-config.test.mjs proves
// parity by parsing globals.css directly — do not let these two drift.

export const HERO_COLORS = {
  brand: "#0B2545",
  brandStrong: "#071A33",
  accent: "#0F766E",
  cta: "#E76F51",
  onBrand: "#FFFFFF",
} as const;

const HEX_RE = /^#([0-9A-Fa-f]{6})$/;

export function hexToRgb01(hex: string): [number, number, number] {
  const match = HEX_RE.exec(hex);
  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return [r, g, b];
}

// Gradient motion timing (D-02: 20-30s full color cycle).
export const HERO_CYCLE_SECONDS = 24;
export const HERO_SEED = 7;
// Still == first live frame (D-05/D-06), so the still image is always
// rendered at t = HERO_STILL_TIME_SECONDS.
export const HERO_STILL_TIME_SECONDS = 0;

// Canvas-over-still crossfade duration (D-06: 600-1000ms).
export const HERO_CROSSFADE_MS = 800;

// DPR clamp + narrow-viewport frame-rate cap (Claude's discretion).
export const HERO_DPR_MAX = 2;
export const HERO_DPR_MAX_NARROW = 1.5;
export const HERO_NARROW_BREAKPOINT_PX = 768;
export const HERO_TABLET_BREAKPOINT_PX = 1024;
export const HERO_NARROW_FPS = 30;

// Node network tuning (D-03/D-04), consumed by 02-02.
export const HERO_NODE_COUNT_DESKTOP = 48;
export const HERO_NODE_COUNT_TABLET = 36;
export const HERO_NODE_COUNT_MOBILE = 22;
export const HERO_LINK_DISTANCE_PX = 170;
export const HERO_POINTER_RADIUS_PX = 200;
// Fraction of the way a node at distance 0 from the pointer moves toward
// it, falling off linearly to 0 at HERO_POINTER_RADIUS_PX.
export const HERO_ATTRACTION = 0.35;
// Per-second exponential ease toward the target position (~1s ease-back).
export const HERO_EASE_RATE = 3.0;
// Normalized-unit drift amplitude for idle node wander.
export const HERO_DRIFT_AMPLITUDE = 0.012;
export const HERO_NODE_ALPHA = 0.35;
export const HERO_LINE_ALPHA = 0.1;
export const HERO_LINE_ALPHA_HIGHLIGHT = 0.38;
export const HERO_POINT_SIZE_PX = 3;

// Pre-rendered still output (D-05/D-06, 02-07 gap closure WR-04).
//
// Guarantee: each variant is rendered at a CSS width inside its own served
// range (minCssWidth..maxCssWidth), so nodeCountForWidth(cssWidth) always
// equals the node tier the live canvas uses across that still's *entire*
// served range, measured by viewport width. Exception (REVIEW WR-01,
// accepted): on classic-scrollbar desktops the container is ~15px narrower
// than the viewport, so in a band just above 768/1024 (and at fractional
// widths between 767 and 768) the still is one node tier off the canvas.
// Link distance (HERO_LINK_DISTANCE_PX) and point size
// (HERO_POINT_SIZE_PX) are both measured in the same CSS-px scale the live
// canvas uses, so they match too. The still/live match is pixel-exact only
// at each variant's reference cssWidth/cssHeight. At other aspect ratios
// within the same tier, the <img>/<source> is object-cover cropped while
// live node coordinates stay normalized to the full container, so node
// positions and gradient composition shift during the 800ms crossfade. The
// shift is small near the reference aspect but large on landscape viewports
// served a portrait still (e.g. a 932x430 phone gets the 820x1180 tablet
// still, cropped to about its middle third; REVIEW WR-02, accepted after
// on-device UAT). This is an
// accepted limitation (02-07 objective): a live cover-fit projection would
// require reworking the gradient shader's aspect math and nodeNetwork's
// normalized-coordinate model, which the original 02-02 design deliberately
// avoided to keep live pointer interaction simple.
//
// Served ranges tile [0, infinity) with no gap or overlap and mirror
// HERO_NARROW_BREAKPOINT_PX / HERO_TABLET_BREAKPOINT_PX exactly (enforced by
// scripts/hero-stills.test.mjs, not just by this comment).
export const HERO_STILL_SIZES = {
  mobile: {
    // Served 0-767 (HERO_NARROW_BREAKPOINT_PX - 1), mobile node tier (22).
    cssWidth: 390,
    cssHeight: 844,
    dpr: 2,
    minCssWidth: 0,
    maxCssWidth: 767,
    width: 780,
    height: 1688,
  },
  tablet: {
    // Served 768 (HERO_NARROW_BREAKPOINT_PX) - 1023
    // (HERO_TABLET_BREAKPOINT_PX - 1), tablet node tier (36).
    cssWidth: 820,
    cssHeight: 1180,
    dpr: 2,
    minCssWidth: 768,
    maxCssWidth: 1023,
    width: 1640,
    height: 2360,
  },
  desktop: {
    // Served 1024 (HERO_TABLET_BREAKPOINT_PX) and up, desktop node tier (48).
    cssWidth: 1920,
    cssHeight: 1080,
    dpr: 1,
    minCssWidth: 1024,
    maxCssWidth: null,
    width: 1920,
    height: 1080,
  },
} as const;
export const HERO_STILL_SRC = {
  mobile: "/hero/hero-still-mobile.webp",
  tablet: "/hero/hero-still-tablet.webp",
  desktop: "/hero/hero-still-desktop.webp",
} as const;
export const HERO_STILL_PATHS = {
  desktop: "public/hero/hero-still-desktop.webp",
  mobile: "public/hero/hero-still-mobile.webp",
  tablet: "public/hero/hero-still-tablet.webp",
} as const;
// Media query strings for the <picture> element, built from the same
// min/max values as HERO_STILL_SIZES so the served ranges cannot drift from
// the tested ranges. Desktop is the <img> fallback and has no media entry.
export const HERO_STILL_MEDIA = {
  mobile: `(max-width: ${HERO_STILL_SIZES.mobile.maxCssWidth}px)`,
  tablet: `(min-width: ${HERO_STILL_SIZES.tablet.minCssWidth}px) and (max-width: ${HERO_STILL_SIZES.tablet.maxCssWidth}px)`,
} as const;
// ~30-60KB ceiling (D-05).
export const HERO_STILL_MAX_BYTES = 61440;

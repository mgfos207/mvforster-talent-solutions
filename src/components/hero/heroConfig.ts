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

// Pre-rendered still output (D-05), consumed by 02-02.
export const HERO_STILL_SIZES = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 780, height: 1688 },
} as const;
export const HERO_STILL_PATHS = {
  desktop: "public/hero/hero-still-desktop.webp",
  mobile: "public/hero/hero-still-mobile.webp",
} as const;
// ~30-60KB ceiling (D-05).
export const HERO_STILL_MAX_BYTES = 61440;

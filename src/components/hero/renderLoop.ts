// Pure module: no browser globals or navigator references, and NO runtime
// imports at all (same purity rule as heroConfig.ts/nodeNetwork.ts). All
// environment values (viewport width, devicePixelRatio, breakpoints,
// clamps) are passed in by the caller (useHeroRenderer.ts in the browser,
// or scripts/hero-loop.test.mjs in tests).

export type RunGate = {
  inView: boolean;
  tabVisible: boolean;
  paused: boolean;
  contextLost: boolean;
};

// The render loop runs only while every gate is open (HERO-06): in the
// viewport, the tab visible, not paused by the user, and the WebGL
// context not lost.
export function shouldRun(gate: RunGate): boolean {
  return gate.inView && gate.tabVisible && !gate.paused && !gate.contextLost;
}

// Advances the animation clock by one frame. The raw delta is clamped to
// maxDeltaSeconds so a long background-tab gap or a resume-from-pause
// never produces a visible time jump (D-14: pausing freezes, resuming
// continues from the same time without a jump). A negative raw delta
// (clock skew / out-of-order rAF timestamps) is floored to zero.
export function advanceClock(
  elapsedSeconds: number,
  rawDeltaSeconds: number,
  maxDeltaSeconds: number,
): { elapsed: number; delta: number } {
  const delta = Math.min(Math.max(rawDeltaSeconds, 0), maxDeltaSeconds);
  return { elapsed: elapsedSeconds + delta, delta };
}

// Returns the minimum interval in ms between frames, or 0 for "no cap".
// Narrow viewports (< narrowBreakpointPx) are capped to narrowFps to save
// battery/GPU on small/mobile devices (Claude's Discretion, CONTEXT.md).
export function frameIntervalFor(
  widthPx: number,
  narrowBreakpointPx: number,
  narrowFps: number,
): number {
  return widthPx < narrowBreakpointPx ? 1000 / narrowFps : 0;
}

// Clamps devicePixelRatio for perf: a lower ceiling below the narrow
// breakpoint, a higher ceiling at/above it. Falls back to 1 for a
// missing/invalid devicePixelRatio (0, NaN, negative).
export function clampDpr(
  devicePixelRatio: number,
  widthPx: number,
  narrowBreakpointPx: number,
  maxDpr: number,
  maxDprNarrow: number,
): number {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const ceiling = widthPx < narrowBreakpointPx ? maxDprNarrow : maxDpr;
  return Math.min(dpr, ceiling);
}

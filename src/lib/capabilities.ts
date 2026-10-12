import type {
  CapabilityEnv,
  CapabilitySignals,
  CapabilityVerdicts,
} from "../types/capabilities";

// Pure module: no window/navigator/document references. All environment
// access comes through the CapabilityEnv argument passed by callers
// (src/hooks/useCapabilitySignals.ts in the browser, or test fixtures).

export const SSR_DEFAULT_SIGNALS: CapabilitySignals = Object.freeze({
  detected: false,
  prefersReducedMotion: null,
  webgl: null,
  saveData: null,
  effectiveType: null,
  deviceMemory: null,
  hardwareConcurrency: null,
});

export const STATIC_VERDICTS: CapabilityVerdicts = Object.freeze({
  canAnimateHero: false,
  canPlayVideo: false,
  canAnimateScroll: false,
});

export function readSignals(env: CapabilityEnv): CapabilitySignals {
  const hardwareConcurrency =
    typeof env.hardwareConcurrency === "number" && env.hardwareConcurrency !== 0
      ? env.hardwareConcurrency
      : null;

  return {
    detected: true,
    prefersReducedMotion: env.matchMedia
      ? env.matchMedia("(prefers-reduced-motion: reduce)").matches
      : null,
    webgl: env.probeWebGL(),
    saveData: env.connection ? Boolean(env.connection.saveData) : null,
    effectiveType: env.connection?.effectiveType ?? null,
    deviceMemory: typeof env.deviceMemory === "number" ? env.deviceMemory : null,
    hardwareConcurrency,
  };
}

// The ONLY place that maps raw signals to feature verdicts (D-14). Hero,
// video, and scroll motion consumers must never implement this rule
// themselves — they read the verdicts from useCapabilities() instead.
export function deriveVerdicts(s: CapabilitySignals): CapabilityVerdicts {
  if (!s.detected) {
    return STATIC_VERDICTS;
  }

  const reducedMotion = s.prefersReducedMotion === true;
  const constrainedNetwork =
    s.saveData === true || s.effectiveType === "2g" || s.effectiveType === "slow-2g";
  const lowEndDevice =
    (s.deviceMemory !== null && s.deviceMemory <= 2) ||
    (s.hardwareConcurrency !== null && s.hardwareConcurrency <= 2);

  return {
    canAnimateHero: !reducedMotion && s.webgl === true && !constrainedNetwork && !lowEndDevice,
    canPlayVideo: !reducedMotion && !constrainedNetwork && !lowEndDevice,
    canAnimateScroll: !reducedMotion && !lowEndDevice,
  };
}

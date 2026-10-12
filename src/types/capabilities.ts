// Types only — this file is fully erasable at build/test time, no runtime code.

export type CapabilitySignals = {
  detected: boolean;
  prefersReducedMotion: boolean | null;
  webgl: boolean | null;
  saveData: boolean | null;
  effectiveType: string | null;
  deviceMemory: number | null;
  hardwareConcurrency: number | null;
};

export type CapabilityVerdicts = {
  canAnimateHero: boolean;
  canPlayVideo: boolean;
  canAnimateScroll: boolean;
};

export type Capabilities = CapabilityVerdicts & {
  signals: CapabilitySignals;
};

export type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: "change", cb: () => void) => void;
  removeEventListener?: (type: "change", cb: () => void) => void;
};

export type CapabilityEnv = {
  matchMedia?: (query: string) => { matches: boolean };
  connection?: NetworkInformationLike;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  probeWebGL: () => boolean;
};

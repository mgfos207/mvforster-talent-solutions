'use client';

import { useSyncExternalStore } from "react";
import { readSignals, SSR_DEFAULT_SIGNALS } from "@/lib/capabilities";
import type { CapabilityEnv, CapabilitySignals, NetworkInformationLike } from "@/types/capabilities";

type NavigatorWithHints = Navigator & {
  connection?: NetworkInformationLike;
  deviceMemory?: number;
};

// Probed once per page load (module-level cache) to avoid exhausting the
// browser's WebGL context limit before Phase 2's hero creates its own
// (threat T-05-02).
let webglResult: boolean | null = null;

function probeWebGL(): boolean {
  if (webglResult !== null) {
    return webglResult;
  }

  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGLRenderingContext | null) ??
      (canvas.getContext("webgl") as WebGLRenderingContext | null);
    webglResult = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglResult = false;
  }

  return webglResult;
}

// useSyncExternalStore requires getSnapshot to return a stable reference
// when nothing has changed, so the result is cached and only replaced when
// its serialized value actually differs.
let cached: CapabilitySignals = SSR_DEFAULT_SIGNALS;
let cachedKey = "";

function getConnection(): NetworkInformationLike | undefined {
  return (navigator as NavigatorWithHints).connection;
}

function getSnapshot(): CapabilitySignals {
  const env: CapabilityEnv = {
    matchMedia: window.matchMedia.bind(window),
    connection: getConnection(),
    deviceMemory: (navigator as NavigatorWithHints).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    probeWebGL,
  };

  const result = readSignals(env);
  const key = JSON.stringify(result);

  if (key !== cachedKey) {
    cached = result;
    cachedKey = key;
  }

  return cached;
}

function getServerSnapshot(): CapabilitySignals {
  return SSR_DEFAULT_SIGNALS;
}

function subscribe(onChange: () => void): () => void {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotionQuery.addEventListener("change", onChange);

  const connection = getConnection();
  connection?.addEventListener?.("change", onChange);

  return () => {
    reducedMotionQuery.removeEventListener("change", onChange);
    connection?.removeEventListener?.("change", onChange);
  };
}

export function useCapabilitySignals(): CapabilitySignals {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

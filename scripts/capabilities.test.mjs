import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deriveVerdicts,
  readSignals,
  SSR_DEFAULT_SIGNALS,
  STATIC_VERDICTS,
} from "../src/lib/capabilities.ts";

// Base fixture for a fully capable device. Individual tests override one
// field at a time via object spread to isolate each rule in deriveVerdicts.
const CAPABLE = {
  detected: true,
  prefersReducedMotion: false,
  webgl: true,
  saveData: false,
  effectiveType: "4g",
  deviceMemory: 8,
  hardwareConcurrency: 8,
};

test("deriveVerdicts(SSR_DEFAULT_SIGNALS) returns all-false (D-16)", () => {
  const verdicts = deriveVerdicts(SSR_DEFAULT_SIGNALS);
  assert.deepEqual(verdicts, STATIC_VERDICTS);
});

test("capable device: all three verdicts true", () => {
  const verdicts = deriveVerdicts(CAPABLE);
  assert.equal(verdicts.canAnimateHero, true);
  assert.equal(verdicts.canPlayVideo, true);
  assert.equal(verdicts.canAnimateScroll, true);
});

test("prefersReducedMotion true forces all three verdicts false", () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, prefersReducedMotion: true });
  assert.equal(verdicts.canAnimateHero, false);
  assert.equal(verdicts.canPlayVideo, false);
  assert.equal(verdicts.canAnimateScroll, false);
});

test("webgl false blocks only canAnimateHero", () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, webgl: false });
  assert.equal(verdicts.canAnimateHero, false);
  assert.equal(verdicts.canPlayVideo, true);
  assert.equal(verdicts.canAnimateScroll, true);
});

test("saveData true blocks hero and video, not scroll", () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, saveData: true });
  assert.equal(verdicts.canAnimateHero, false);
  assert.equal(verdicts.canPlayVideo, false);
  assert.equal(verdicts.canAnimateScroll, true);
});

test('effectiveType "slow-2g" blocks hero and video, not scroll', () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, effectiveType: "slow-2g" });
  assert.equal(verdicts.canAnimateHero, false);
  assert.equal(verdicts.canPlayVideo, false);
  assert.equal(verdicts.canAnimateScroll, true);
});

test('effectiveType "2g" blocks hero and video, not scroll', () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, effectiveType: "2g" });
  assert.equal(verdicts.canAnimateHero, false);
  assert.equal(verdicts.canPlayVideo, false);
  assert.equal(verdicts.canAnimateScroll, true);
});

test('effectiveType "3g" does not block anything', () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, effectiveType: "3g" });
  assert.equal(verdicts.canAnimateHero, true);
  assert.equal(verdicts.canPlayVideo, true);
  assert.equal(verdicts.canAnimateScroll, true);
});

test("deviceMemory <= 2 forces all three verdicts false", () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, deviceMemory: 2 });
  assert.equal(verdicts.canAnimateHero, false);
  assert.equal(verdicts.canPlayVideo, false);
  assert.equal(verdicts.canAnimateScroll, false);
});

test("deviceMemory 4 does not trigger the low-end-device rule", () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, deviceMemory: 4 });
  assert.equal(verdicts.canAnimateHero, true);
  assert.equal(verdicts.canPlayVideo, true);
  assert.equal(verdicts.canAnimateScroll, true);
});

test("hardwareConcurrency <= 2 forces all three verdicts false", () => {
  const verdicts = deriveVerdicts({ ...CAPABLE, hardwareConcurrency: 2 });
  assert.equal(verdicts.canAnimateHero, false);
  assert.equal(verdicts.canPlayVideo, false);
  assert.equal(verdicts.canAnimateScroll, false);
});

test("Safari-like missing APIs count as unknown, not low-end (D-12)", () => {
  const verdicts = deriveVerdicts({
    detected: true,
    prefersReducedMotion: false,
    webgl: true,
    saveData: null,
    effectiveType: null,
    deviceMemory: null,
    hardwareConcurrency: 8,
  });
  assert.equal(verdicts.canAnimateHero, true);
  assert.equal(verdicts.canPlayVideo, true);
  assert.equal(verdicts.canAnimateScroll, true);
});

test("readSignals with an env lacking matchMedia/connection/deviceMemory returns unknown (null) fields", () => {
  const signals = readSignals({
    probeWebGL: () => true,
  });
  assert.equal(signals.detected, true);
  assert.equal(signals.prefersReducedMotion, null);
  assert.equal(signals.saveData, null);
  assert.equal(signals.effectiveType, null);
  assert.equal(signals.deviceMemory, null);
});

test("readSignals reads matchMedia and connection when present", () => {
  const signals = readSignals({
    matchMedia: () => ({ matches: true }),
    connection: { saveData: true, effectiveType: "4g" },
    probeWebGL: () => true,
  });
  assert.equal(signals.prefersReducedMotion, true);
  assert.equal(signals.saveData, true);
  assert.equal(signals.effectiveType, "4g");
});

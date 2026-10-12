import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shouldRun,
  advanceClock,
  frameIntervalFor,
  clampDpr,
} from "../src/components/hero/renderLoop.ts";

test("shouldRun is true only when every gate is open", () => {
  assert.equal(
    shouldRun({ inView: true, tabVisible: true, paused: false, contextLost: false }),
    true,
  );
});

test("shouldRun is false when inView is false", () => {
  assert.equal(
    shouldRun({ inView: false, tabVisible: true, paused: false, contextLost: false }),
    false,
  );
});

test("shouldRun is false when tabVisible is false", () => {
  assert.equal(
    shouldRun({ inView: true, tabVisible: false, paused: false, contextLost: false }),
    false,
  );
});

test("shouldRun is false when paused is true", () => {
  assert.equal(
    shouldRun({ inView: true, tabVisible: true, paused: true, contextLost: false }),
    false,
  );
});

test("shouldRun is false when contextLost is true", () => {
  assert.equal(
    shouldRun({ inView: true, tabVisible: true, paused: false, contextLost: true }),
    false,
  );
});

test("advanceClock accumulates a normal frame delta", () => {
  const { elapsed, delta } = advanceClock(10, 0.016, 0.1);
  assert.ok(Math.abs(elapsed - 10.016) < 1e-9);
  assert.ok(Math.abs(delta - 0.016) < 1e-9);
});

test("advanceClock clamps a long delta so resume never jumps (D-14)", () => {
  const { elapsed, delta } = advanceClock(10, 5, 0.1);
  assert.ok(Math.abs(delta - 0.1) < 1e-9);
  assert.ok(Math.abs(elapsed - 10.1) < 1e-9);
});

test("advanceClock floors a negative raw delta to zero", () => {
  const { elapsed, delta } = advanceClock(10, -1, 0.1);
  assert.equal(delta, 0);
  assert.equal(elapsed, 10);
});

test("frameIntervalFor caps narrow viewports to the narrow fps", () => {
  assert.ok(Math.abs(frameIntervalFor(375, 768, 30) - 1000 / 30) < 1e-6);
  assert.ok(Math.abs(frameIntervalFor(767, 768, 30) - 1000 / 30) < 1e-6);
});

test("frameIntervalFor removes the cap at and above the breakpoint", () => {
  assert.equal(frameIntervalFor(768, 768, 30), 0);
  assert.equal(frameIntervalFor(1440, 768, 30), 0);
});

test("clampDpr clamps to the wide-viewport ceiling", () => {
  assert.equal(clampDpr(3, 1440, 768, 2, 1.5), 2);
});

test("clampDpr clamps to the narrow-viewport ceiling below the breakpoint", () => {
  assert.equal(clampDpr(3, 390, 768, 2, 1.5), 1.5);
});

test("clampDpr passes through a value already within the narrow ceiling", () => {
  assert.equal(clampDpr(1, 390, 768, 2, 1.5), 1);
});

test("clampDpr falls back to 1 for missing or invalid devicePixelRatio", () => {
  assert.equal(clampDpr(0, 1440, 768, 2, 1.5), 1);
  assert.equal(clampDpr(NaN, 1440, 768, 2, 1.5), 1);
});

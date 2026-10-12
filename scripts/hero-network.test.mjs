import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRng,
  nodeCountForWidth,
  createNodes,
  stepNodes,
  allocateBuffers,
  buildNetworkBuffers,
} from "../src/components/hero/nodeNetwork.ts";
import {
  HERO_SEED,
  HERO_NODE_COUNT_DESKTOP,
  HERO_NODE_COUNT_TABLET,
  HERO_NODE_COUNT_MOBILE,
  HERO_TABLET_BREAKPOINT_PX,
  HERO_NARROW_BREAKPOINT_PX,
  HERO_LINK_DISTANCE_PX,
  HERO_POINTER_RADIUS_PX,
  HERO_ATTRACTION,
  HERO_EASE_RATE,
  HERO_DRIFT_AMPLITUDE,
  HERO_NODE_ALPHA,
  HERO_LINE_ALPHA,
  HERO_LINE_ALPHA_HIGHLIGHT,
} from "../src/components/hero/heroConfig.ts";

const NODE_COUNT_PARAMS = {
  tabletBreakpointPx: HERO_TABLET_BREAKPOINT_PX,
  narrowBreakpointPx: HERO_NARROW_BREAKPOINT_PX,
  desktop: HERO_NODE_COUNT_DESKTOP,
  tablet: HERO_NODE_COUNT_TABLET,
  mobile: HERO_NODE_COUNT_MOBILE,
};

const NETWORK_PARAMS = {
  driftAmplitude: HERO_DRIFT_AMPLITUDE,
  attraction: HERO_ATTRACTION,
  pointerRadiusPx: HERO_POINTER_RADIUS_PX,
  easeRate: HERO_EASE_RATE,
  linkDistancePx: HERO_LINK_DISTANCE_PX,
  nodeAlpha: HERO_NODE_ALPHA,
  lineAlpha: HERO_LINE_ALPHA,
  lineAlphaHighlight: HERO_LINE_ALPHA_HIGHLIGHT,
};

const DRIFT_NORMALIZER = Math.SQRT1_2;

test("createRng(7) is deterministic and yields values in [0,1)", () => {
  const rngA = createRng(7);
  const rngB = createRng(7);
  const a = Array.from({ length: 5 }, () => rngA());
  const b = Array.from({ length: 5 }, () => rngB());
  assert.deepEqual(a, b);
  for (const v of a) {
    assert.ok(v >= 0 && v < 1, `${v} not in [0,1)`);
  }
});

test("nodeCountForWidth maps widths to the correct breakpoint tier", () => {
  assert.equal(nodeCountForWidth(1440, NODE_COUNT_PARAMS), HERO_NODE_COUNT_DESKTOP);
  assert.equal(nodeCountForWidth(1024, NODE_COUNT_PARAMS), HERO_NODE_COUNT_DESKTOP);
  assert.equal(nodeCountForWidth(1023, NODE_COUNT_PARAMS), HERO_NODE_COUNT_TABLET);
  assert.equal(nodeCountForWidth(768, NODE_COUNT_PARAMS), HERO_NODE_COUNT_TABLET);
  assert.equal(nodeCountForWidth(767, NODE_COUNT_PARAMS), HERO_NODE_COUNT_MOBILE);
  assert.equal(nodeCountForWidth(320, NODE_COUNT_PARAMS), HERO_NODE_COUNT_MOBILE);
});

test("createNodes is deterministic and keeps homes within [0.04, 0.96]", () => {
  const a = createNodes(HERO_NODE_COUNT_DESKTOP, HERO_SEED, NETWORK_PARAMS);
  const b = createNodes(HERO_NODE_COUNT_DESKTOP, HERO_SEED, NETWORK_PARAMS);
  assert.deepEqual(a, b);
  assert.equal(a.length, HERO_NODE_COUNT_DESKTOP);
  for (const node of a) {
    assert.ok(node.hx >= 0.04 && node.hx <= 0.96, `hx ${node.hx} out of range`);
    assert.ok(node.hy >= 0.04 && node.hy <= 0.96, `hy ${node.hy} out of range`);
  }
});

test("createNodes initializes x/y to home plus drift at t=0 (deterministic first frame)", () => {
  const nodes = createNodes(HERO_NODE_COUNT_DESKTOP, HERO_SEED, NETWORK_PARAMS);
  const scale = NETWORK_PARAMS.driftAmplitude * DRIFT_NORMALIZER;
  for (const node of nodes) {
    const expectedX = node.hx + scale * Math.cos(node.phase);
    const expectedY = node.hy + scale * Math.sin(node.phase * 1.3);
    assert.ok(Math.abs(node.x - expectedX) < 1e-9);
    assert.ok(Math.abs(node.y - expectedY) < 1e-9);
  }
});

test("stepNodes with no pointer keeps every node within driftAmplitude of home", () => {
  const nodes = createNodes(HERO_NODE_COUNT_DESKTOP, HERO_SEED, NETWORK_PARAMS);
  const viewport = { width: 1920, height: 1080 };
  let t = 0;
  const dt = 1 / 60;
  for (let i = 0; i < 600; i++) {
    stepNodes(nodes, t, dt, null, viewport, NETWORK_PARAMS);
    t += dt;
  }
  for (const node of nodes) {
    const dist = Math.hypot(node.x - node.hx, node.y - node.hy);
    assert.ok(
      dist <= NETWORK_PARAMS.driftAmplitude + 1e-6,
      `dist ${dist} exceeds driftAmplitude bound`,
    );
  }
});

test("stepNodes pulls a node toward a nearby pointer without crossing past it", () => {
  const params = { ...NETWORK_PARAMS, driftAmplitude: 0 };
  const viewport = { width: 1000, height: 1000 };
  const node = { hx: 0.5, hy: 0.5, x: 0.5, y: 0.5, phase: 0, speed: 0 };
  const nodes = [node];
  const pointer = { x: 0.5 + 50 / viewport.width, y: 0.5 };
  const startDist = Math.hypot(
    (node.x - pointer.x) * viewport.width,
    (node.y - pointer.y) * viewport.height,
  );

  let t = 0;
  const dt = 1 / 60;
  let prevDist = startDist;
  for (let i = 0; i < 120; i++) {
    stepNodes(nodes, t, dt, pointer, viewport, params);
    t += dt;
    const dist = Math.hypot(
      (node.x - pointer.x) * viewport.width,
      (node.y - pointer.y) * viewport.height,
    );
    assert.ok(dist > 0, "node crossed the pointer");
    assert.ok(dist <= prevDist + 1e-9, `distance increased from ${prevDist} to ${dist}`);
    prevDist = dist;
  }
  assert.ok(prevDist < startDist, "node never moved closer to the pointer");
  const maxAllowedMove = params.attraction * startDist + params.driftAmplitude + 1e-6;
  assert.ok(startDist - prevDist <= maxAllowedMove);
});

test("nodes farther than pointerRadiusPx are unaffected by the pointer", () => {
  const viewport = { width: 1000, height: 1000 };
  const makeNode = () => ({ hx: 0.5, hy: 0.5, x: 0.5, y: 0.5, phase: 0.3, speed: 0.2 });
  const farPointer = {
    x: 0.5 + (NETWORK_PARAMS.pointerRadiusPx + 50) / viewport.width,
    y: 0.5,
  };

  const withPointer = [makeNode()];
  const withoutPointer = [makeNode()];

  let t = 0;
  const dt = 1 / 60;
  for (let i = 0; i < 30; i++) {
    stepNodes(withPointer, t, dt, farPointer, viewport, NETWORK_PARAMS);
    stepNodes(withoutPointer, t, dt, null, viewport, NETWORK_PARAMS);
    t += dt;
  }
  assert.ok(Math.abs(withPointer[0].x - withoutPointer[0].x) < 1e-9);
  assert.ok(Math.abs(withPointer[0].y - withoutPointer[0].y) < 1e-9);
});

test("removing the pointer eases the node back toward home (D-04)", () => {
  const viewport = { width: 1000, height: 1000 };
  const node = { hx: 0.5, hy: 0.5, x: 0.5, y: 0.5, phase: 0, speed: 0 };
  const nodes = [node];
  const pointer = { x: 0.5 + 50 / viewport.width, y: 0.5 };
  let t = 0;
  const dt = 1 / 60;
  for (let i = 0; i < 120; i++) {
    stepNodes(nodes, t, dt, pointer, viewport, NETWORK_PARAMS);
    t += dt;
  }
  for (let i = 0; i < 180; i++) {
    stepNodes(nodes, t, dt, null, viewport, NETWORK_PARAMS);
    t += dt;
  }
  const dist = Math.hypot(node.x - node.hx, node.y - node.hy);
  assert.ok(dist <= 2 * NETWORK_PARAMS.driftAmplitude, `dist ${dist} exceeds 2x driftAmplitude`);
});

test("buildNetworkBuffers only links nodes within linkDistancePx and returns even vertex counts", () => {
  const viewport = { width: 1920, height: 1080 };
  const nodes = createNodes(HERO_NODE_COUNT_DESKTOP, HERO_SEED, NETWORK_PARAMS);
  const buffers = allocateBuffers(HERO_NODE_COUNT_DESKTOP);
  const { pointCount, lineVertexCount } = buildNetworkBuffers(
    nodes,
    viewport,
    null,
    NETWORK_PARAMS,
    buffers,
  );
  assert.equal(pointCount, nodes.length);
  assert.equal(lineVertexCount % 2, 0);

  for (let v = 0; v < lineVertexCount; v += 2) {
    const ax = buffers.lines[v * 2];
    const ay = buffers.lines[v * 2 + 1];
    const bx = buffers.lines[v * 2 + 2];
    const by = buffers.lines[v * 2 + 3];
    const axPx = ((ax + 1) / 2) * viewport.width;
    const ayPx = ((1 - ay) / 2) * viewport.height;
    const bxPx = ((bx + 1) / 2) * viewport.width;
    const byPx = ((1 - by) / 2) * viewport.height;
    const d = Math.hypot(axPx - bxPx, ayPx - byPx);
    assert.ok(d < NETWORK_PARAMS.linkDistancePx + 1e-6, `segment length ${d} too long`);
  }
});

test("a line midpoint near the pointer gets a higher alpha than without a pointer (D-04)", () => {
  const viewport = { width: 1000, height: 1000 };
  const nodeA = { hx: 0.45, hy: 0.5, x: 0.45, y: 0.5, phase: 0, speed: 0 };
  const nodeB = { hx: 0.55, hy: 0.5, x: 0.55, y: 0.5, phase: 0, speed: 0 };
  const nodes = [nodeA, nodeB];
  const buffersNoPointer = allocateBuffers(2);
  const buffersWithPointer = allocateBuffers(2);

  buildNetworkBuffers(nodes, viewport, null, NETWORK_PARAMS, buffersNoPointer);
  buildNetworkBuffers(nodes, viewport, { x: 0.5, y: 0.5 }, NETWORK_PARAMS, buffersWithPointer);

  assert.ok(buffersWithPointer.lineAlpha[0] > buffersNoPointer.lineAlpha[0]);
});

test("buildNetworkBuffers emits finite, clip-space-bounded coordinates and valid alphas", () => {
  const viewport = { width: 1920, height: 1080 };
  const nodes = createNodes(HERO_NODE_COUNT_DESKTOP, HERO_SEED, NETWORK_PARAMS);
  const buffers = allocateBuffers(HERO_NODE_COUNT_DESKTOP);
  const pointer = { x: 0.5, y: 0.5 };
  const { pointCount, lineVertexCount } = buildNetworkBuffers(
    nodes,
    viewport,
    pointer,
    NETWORK_PARAMS,
    buffers,
  );

  for (let i = 0; i < pointCount * 2; i++) {
    assert.ok(Number.isFinite(buffers.points[i]));
    assert.ok(buffers.points[i] >= -1.1 && buffers.points[i] <= 1.1);
  }
  for (let i = 0; i < pointCount; i++) {
    assert.ok(buffers.pointAlpha[i] >= 0 && buffers.pointAlpha[i] <= 1);
  }
  for (let i = 0; i < lineVertexCount * 2; i++) {
    assert.ok(Number.isFinite(buffers.lines[i]));
    assert.ok(buffers.lines[i] >= -1.1 && buffers.lines[i] <= 1.1);
  }
  for (let i = 0; i < lineVertexCount; i++) {
    assert.ok(buffers.lineAlpha[i] >= 0 && buffers.lineAlpha[i] <= 1);
  }
});

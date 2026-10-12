// Pure module: no browser globals (navigator or the two DOM-global objects
// every other hero module avoids) and NO runtime imports at all. Node's
// --experimental-strip-types loader cannot resolve extensionless relative
// imports, so this module defines its own local types rather than importing
// from heroConfig.ts — callers (heroScene.ts, the harness,
// scripts/hero-network.test.mjs) build NetworkParams/NodeCountParams objects
// from the HERO_* tuning constants and pass them in.
//
// "Connecting people" (D-03): the node network is a metaphor for recruiting
// connections, not a tech/data visualization — keep it subtle (low alpha,
// slow drift, gentle pointer attraction, D-04).

export type HeroNode = {
  hx: number;
  hy: number;
  x: number;
  y: number;
  phase: number;
  speed: number;
};

export type NetworkParams = {
  driftAmplitude: number;
  attraction: number;
  pointerRadiusPx: number;
  easeRate: number;
  linkDistancePx: number;
  nodeAlpha: number;
  lineAlpha: number;
  lineAlphaHighlight: number;
};

export type NodeCountParams = {
  tabletBreakpointPx: number;
  narrowBreakpointPx: number;
  desktop: number;
  tablet: number;
  mobile: number;
};

export type NetworkBuffers = {
  points: Float32Array;
  pointAlpha: Float32Array;
  lines: Float32Array;
  lineAlpha: Float32Array;
};

type PointerPos = { x: number; y: number } | null;
type Viewport = { width: number; height: number };

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

// mulberry32: a small, fast, public-domain PRNG. Deterministic from a single
// uint32 seed so the t=0 live frame always matches the pre-rendered still
// (D-05/D-06).
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function rng(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function nodeCountForWidth(widthPx: number, p: NodeCountParams): number {
  if (widthPx >= p.tabletBreakpointPx) return p.desktop;
  if (widthPx >= p.narrowBreakpointPx) return p.tablet;
  return p.mobile;
}

// The vector (cos(a), sin(b)) for independent a/b can reach magnitude
// sqrt(2), not 1. Scale by 1/sqrt(2) so the worst-case drift distance from
// home never exceeds driftAmplitude, which is the idle-wander contract
// stepNodes must hold.
const DRIFT_NORMALIZER = Math.SQRT1_2;

function driftOffset(
  phase: number,
  speed: number,
  t: number,
  amplitude: number,
): { dx: number; dy: number } {
  const scale = amplitude * DRIFT_NORMALIZER;
  return {
    dx: scale * Math.cos(phase + t * speed),
    dy: scale * Math.sin(phase * 1.3 + t * speed * 0.8),
  };
}

export function createNodes(count: number, seed: number, p: NetworkParams): HeroNode[] {
  const rng = createRng(seed);
  const aspect = 16 / 9;
  const cols = Math.max(1, Math.round(Math.sqrt(count * aspect)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const totalCells = cols * rows;

  const cellIndices: number[] = [];
  for (let i = 0; i < totalCells; i++) cellIndices.push(i);
  // Fisher-Yates shuffle, driven by the same rng, so "first count cells in
  // rng-shuffled order" is fully deterministic from (count, seed).
  for (let i = cellIndices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cellIndices[i];
    cellIndices[i] = cellIndices[j];
    cellIndices[j] = tmp;
  }
  const chosen = cellIndices.slice(0, count);

  const cellW = 1 / cols;
  const cellH = 1 / rows;

  const nodes: HeroNode[] = [];
  for (const cellIndex of chosen) {
    const cx = cellIndex % cols;
    const cy = Math.floor(cellIndex / cols);
    const jitterX = (rng() - 0.5) * 0.8 * cellW;
    const jitterY = (rng() - 0.5) * 0.8 * cellH;
    const hx = clamp((cx + 0.5) * cellW + jitterX, 0.04, 0.96);
    const hy = clamp((cy + 0.5) * cellH + jitterY, 0.04, 0.96);

    const phase = rng() * 2 * Math.PI;
    const speed = 0.15 + rng() * 0.2;

    const { dx, dy } = driftOffset(phase, speed, 0, p.driftAmplitude);

    nodes.push({ hx, hy, x: hx + dx, y: hy + dy, phase, speed });
  }

  return nodes;
}

export function stepNodes(
  nodes: HeroNode[],
  timeSeconds: number,
  deltaSeconds: number,
  pointer: PointerPos,
  viewport: Viewport,
  p: NetworkParams,
): void {
  // deltaSeconds === 0 => k === 0 => no movement, which is what makes the
  // t=0 still frame equal the live first frame (D-05/D-06).
  const k = deltaSeconds > 0 ? 1 - Math.exp(-deltaSeconds * p.easeRate) : 0;

  for (const node of nodes) {
    const { dx, dy } = driftOffset(node.phase, node.speed, timeSeconds, p.driftAmplitude);
    let targetX = node.hx + dx;
    let targetY = node.hy + dy;

    if (pointer) {
      const dxPx = (targetX - pointer.x) * viewport.width;
      const dyPx = (targetY - pointer.y) * viewport.height;
      const distPx = Math.hypot(dxPx, dyPx);
      if (distPx < p.pointerRadiusPx) {
        const falloff = 1 - distPx / p.pointerRadiusPx;
        const pull = p.attraction * falloff;
        targetX = targetX + (pointer.x - targetX) * pull;
        targetY = targetY + (pointer.y - targetY) * pull;
      }
    }

    node.x = node.x + (targetX - node.x) * k;
    node.y = node.y + (targetY - node.y) * k;
  }
}

export function allocateBuffers(maxNodes: number): NetworkBuffers {
  const maxPairs = (maxNodes * (maxNodes - 1)) / 2;
  return {
    points: new Float32Array(maxNodes * 2),
    pointAlpha: new Float32Array(maxNodes),
    lines: new Float32Array(maxPairs * 4),
    lineAlpha: new Float32Array(maxPairs * 2),
  };
}

function toClipX(norm: number): number {
  return norm * 2 - 1;
}

function toClipY(norm: number): number {
  return 1 - norm * 2;
}

export function buildNetworkBuffers(
  nodes: HeroNode[],
  viewport: Viewport,
  pointer: PointerPos,
  p: NetworkParams,
  out: NetworkBuffers,
): { pointCount: number; lineVertexCount: number } {
  const n = nodes.length;

  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    out.points[i * 2] = toClipX(node.x);
    out.points[i * 2 + 1] = toClipY(node.y);

    let alpha = p.nodeAlpha;
    if (pointer) {
      const dxPx = (node.x - pointer.x) * viewport.width;
      const dyPx = (node.y - pointer.y) * viewport.height;
      const distPx = Math.hypot(dxPx, dyPx);
      if (distPx < p.pointerRadiusPx) {
        const falloff = 1 - distPx / p.pointerRadiusPx;
        const boosted = Math.min(1, p.nodeAlpha * 2);
        alpha = alpha + (boosted - alpha) * falloff;
      }
    }
    out.pointAlpha[i] = alpha;
  }

  let lineFloatIdx = 0;
  let lineAlphaIdx = 0;
  let lineVertexCount = 0;

  for (let i = 0; i < n; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < n; j++) {
      const b = nodes[j];
      const dxPx = (a.x - b.x) * viewport.width;
      const dyPx = (a.y - b.y) * viewport.height;
      const d = Math.hypot(dxPx, dyPx);
      if (d >= p.linkDistancePx) continue;

      const proximity = 1 - d / p.linkDistancePx;
      const base = p.lineAlpha * proximity;

      let highlight = 0;
      if (pointer) {
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const mdxPx = (midX - pointer.x) * viewport.width;
        const mdyPx = (midY - pointer.y) * viewport.height;
        const distMidPx = Math.hypot(mdxPx, mdyPx);
        highlight = Math.max(0, 1 - distMidPx / p.pointerRadiusPx);
      }

      const alpha = base + (p.lineAlphaHighlight - p.lineAlpha) * proximity * highlight;

      out.lines[lineFloatIdx++] = toClipX(a.x);
      out.lines[lineFloatIdx++] = toClipY(a.y);
      out.lineAlpha[lineAlphaIdx++] = alpha;
      lineVertexCount++;

      out.lines[lineFloatIdx++] = toClipX(b.x);
      out.lines[lineFloatIdx++] = toClipY(b.y);
      out.lineAlpha[lineAlphaIdx++] = alpha;
      lineVertexCount++;
    }
  }

  return { pointCount: n, lineVertexCount };
}

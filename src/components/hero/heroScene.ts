import { Renderer, Program, Mesh, Triangle, Transform, Geometry, type OGLRenderingContext } from "ogl";
import {
  HERO_COLORS,
  HERO_CYCLE_SECONDS,
  hexToRgb01,
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
  HERO_POINT_SIZE_PX,
} from "./heroConfig";
import {
  gradientVertexShader,
  gradientFragmentShader,
  nodePointVertexShader,
  nodePointFragmentShader,
  nodeLineVertexShader,
  nodeLineFragmentShader,
} from "./shaders";
import {
  createNodes,
  stepNodes,
  buildNetworkBuffers,
  allocateBuffers,
  nodeCountForWidth,
  type HeroNode,
  type NetworkParams,
} from "./nodeNetwork";
import { assertProgramLinked, releaseContext } from "./glGuards";

// Public contract consumed unchanged by 02-02 (node network) and 02-03
// (React lifecycle hook). Do not change these shapes without updating both.
// `layers` is the one additive, optional field: only the dev harness passes
// "gradient" to render the gradient mesh alone for the diff-against check;
// production callers (02-03) never set it (threat T-02-07).
export type HeroSceneOptions = {
  dpr: number;
  seed: number;
  preserveDrawingBuffer?: boolean;
  layers?: "all" | "gradient";
};

const NODE_COUNT_PARAMS = {
  tabletBreakpointPx: HERO_TABLET_BREAKPOINT_PX,
  narrowBreakpointPx: HERO_NARROW_BREAKPOINT_PX,
  desktop: HERO_NODE_COUNT_DESKTOP,
  tablet: HERO_NODE_COUNT_TABLET,
  mobile: HERO_NODE_COUNT_MOBILE,
};

const NETWORK_PARAMS: NetworkParams = {
  driftAmplitude: HERO_DRIFT_AMPLITUDE,
  attraction: HERO_ATTRACTION,
  pointerRadiusPx: HERO_POINTER_RADIUS_PX,
  easeRate: HERO_EASE_RATE,
  linkDistancePx: HERO_LINK_DISTANCE_PX,
  nodeAlpha: HERO_NODE_ALPHA,
  lineAlpha: HERO_LINE_ALPHA,
  lineAlphaHighlight: HERO_LINE_ALPHA_HIGHLIGHT,
};

export type HeroScene = {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  resize(widthCssPx: number, heightCssPx: number): void;
  setPointer(xCssPx: number | null, yCssPx: number | null): void;
  render(timeSeconds: number, deltaSeconds: number): void;
  destroy(): void;
};

// Applies the CSS box that never depends on JS sizing (RESEARCH.md
// Pitfall 5): ogl's Renderer.setSize() writes literal px into
// canvas.style.width/height, so we re-apply the 100% box after every
// resize to keep layout driven purely by the parent container.
function applyCanvasBoxStyle(canvas: HTMLCanvasElement): void {
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
}

type BuiltScene = {
  scene: Transform;
  program: Program;
  networkBuffers: ReturnType<typeof allocateBuffers> | null;
  pointGeometry: Geometry | null;
  lineGeometry: Geometry | null;
};

// Constructs every GPU resource (shader programs, geometry, meshes) against
// the live `gl` context. Called from inside the try/catch in
// createHeroScene() below so a link failure in any of the three programs
// (REVIEW WR-01) can be released and rethrown cleanly (REVIEW WR-02).
function buildScene(
  gl: OGLRenderingContext,
  renderer: Renderer,
  layers: "all" | "gradient",
): BuiltScene {
  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: gradientVertexShader,
    fragment: gradientFragmentShader,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uCycle: { value: HERO_CYCLE_SECONDS },
      uResolution: { value: [0, 0] },
      uBrand: { value: hexToRgb01(HERO_COLORS.brand) },
      uBrandStrong: { value: hexToRgb01(HERO_COLORS.brandStrong) },
      uAccent: { value: hexToRgb01(HERO_COLORS.accent) },
      uCta: { value: hexToRgb01(HERO_COLORS.cta) },
    },
  });
  assertProgramLinked(gl, program, "gradient");
  const mesh = new Mesh(gl, { geometry, program });
  const scene = new Transform();
  mesh.setParent(scene);

  // Node network layer (D-03/D-04). `layers: "gradient"` (dev harness only,
  // T-02-07) skips all of this so the harness can render a gradient-only
  // frame for the --diff-against subtlety check.
  let networkBuffers: ReturnType<typeof allocateBuffers> | null = null;
  let pointGeometry: Geometry | null = null;
  let lineGeometry: Geometry | null = null;

  if (layers !== "gradient") {
    // Allocate once for the worst case (desktop node count); resize() only
    // ever recreates the `nodes` array, never the GPU buffers.
    networkBuffers = allocateBuffers(HERO_NODE_COUNT_DESKTOP);

    pointGeometry = new Geometry(gl, {
      position: { size: 2, data: networkBuffers.points, usage: gl.DYNAMIC_DRAW },
      alpha: { size: 1, data: networkBuffers.pointAlpha, usage: gl.DYNAMIC_DRAW },
    });
    lineGeometry = new Geometry(gl, {
      position: { size: 2, data: networkBuffers.lines, usage: gl.DYNAMIC_DRAW },
      alpha: { size: 1, data: networkBuffers.lineAlpha, usage: gl.DYNAMIC_DRAW },
    });

    const onBrandColor = hexToRgb01(HERO_COLORS.onBrand);

    const pointProgram = new Program(gl, {
      vertex: nodePointVertexShader,
      fragment: nodePointFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPointSize: { value: HERO_POINT_SIZE_PX * renderer.dpr },
        uColor: { value: onBrandColor },
      },
    });
    assertProgramLinked(gl, pointProgram, "points");
    const lineProgram = new Program(gl, {
      vertex: nodeLineVertexShader,
      fragment: nodeLineFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uColor: { value: onBrandColor },
      },
    });
    assertProgramLinked(gl, lineProgram, "lines");

    // Draw order (D-03): gradient (renderOrder 0, opaque group) -> lines
    // (renderOrder 1) -> points (renderOrder 2), both transparent+no-depth
    // so they land in ogl's "ui" render group, always after the opaque
    // gradient regardless of renderOrder value.
    const linesMesh = new Mesh(gl, {
      geometry: lineGeometry,
      program: lineProgram,
      mode: gl.LINES,
      renderOrder: 1,
    });
    const pointsMesh = new Mesh(gl, {
      geometry: pointGeometry,
      program: pointProgram,
      mode: gl.POINTS,
      renderOrder: 2,
    });
    linesMesh.setParent(scene);
    pointsMesh.setParent(scene);
  }

  return { scene, program, networkBuffers, pointGeometry, lineGeometry };
}

export function createHeroScene(options: HeroSceneOptions): HeroScene {
  const renderer = new Renderer({
    dpr: options.dpr,
    alpha: false,
    antialias: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
  });
  const gl = renderer.gl;
  const canvas = gl.canvas as HTMLCanvasElement;
  applyCanvasBoxStyle(canvas);

  const layers = options.layers ?? "all";

  // Everything that builds GPU resources against `gl` runs inside this
  // try/catch. If any of the three shader programs fails to compile or
  // link, assertProgramLinked() inside buildScene() throws (REVIEW WR-01);
  // releaseContext(gl) then frees the context before the same error is
  // rethrown unchanged (REVIEW WR-02), so useHeroRenderer's existing
  // try/catch around createHeroScene() runs and the still stays visible.
  let built: BuiltScene;
  try {
    built = buildScene(gl, renderer, layers);
  } catch (err) {
    releaseContext(gl);
    throw err;
  }
  const { scene, program, networkBuffers, pointGeometry, lineGeometry } = built;

  // Stored for resize/pointer math; the gradient itself ignores the
  // pointer (D-04 interaction lives on the node layer below).
  let width = 0;
  let height = 0;
  let pointer: { x: number; y: number } | null = null;
  let contextLost = false;

  let nodes: HeroNode[] = [];
  let currentNodeCount = -1;

  function resize(widthCssPx: number, heightCssPx: number): void {
    width = widthCssPx;
    height = heightCssPx;
    renderer.setSize(width, height);
    applyCanvasBoxStyle(canvas);
    program.uniforms.uResolution.value = [width * renderer.dpr, height * renderer.dpr];

    if (layers !== "gradient") {
      const count = nodeCountForWidth(width, NODE_COUNT_PARAMS);
      if (count !== currentNodeCount) {
        nodes = createNodes(count, options.seed, NETWORK_PARAMS);
        currentNodeCount = count;
      }
    }
  }

  function setPointer(xCssPx: number | null, yCssPx: number | null): void {
    pointer = xCssPx === null || yCssPx === null ? null : { x: xCssPx, y: yCssPx };
  }

  function render(timeSeconds: number, deltaSeconds: number): void {
    if (contextLost) return;
    program.uniforms.uTime.value = timeSeconds;

    if (layers !== "gradient" && networkBuffers && pointGeometry && lineGeometry) {
      const pointerNorm =
        pointer && width > 0 && height > 0
          ? { x: pointer.x / width, y: pointer.y / height }
          : null;
      const viewport = { width, height };
      stepNodes(nodes, timeSeconds, deltaSeconds, pointerNorm, viewport, NETWORK_PARAMS);
      const { pointCount, lineVertexCount } = buildNetworkBuffers(
        nodes,
        viewport,
        pointerNorm,
        NETWORK_PARAMS,
        networkBuffers,
      );
      pointGeometry.attributes.position.needsUpdate = true;
      pointGeometry.attributes.alpha.needsUpdate = true;
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.alpha.needsUpdate = true;
      pointGeometry.setDrawRange(0, pointCount);
      lineGeometry.setDrawRange(0, lineVertexCount);
    }

    renderer.render({ scene });
  }

  function destroy(): void {
    if (contextLost) return;
    contextLost = true;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  return {
    canvas,
    gl,
    resize,
    setPointer,
    render,
    destroy,
  };
}

import { Renderer, Program, Mesh, Triangle, Transform } from "ogl";
import { HERO_COLORS, HERO_CYCLE_SECONDS, hexToRgb01 } from "./heroConfig";
import { gradientVertexShader, gradientFragmentShader } from "./shaders";

// Public contract consumed unchanged by 02-02 (node network) and 02-03
// (React lifecycle hook). Do not change these shapes without updating both.
export type HeroSceneOptions = {
  dpr: number;
  seed: number;
  preserveDrawingBuffer?: boolean;
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
  const mesh = new Mesh(gl, { geometry, program });
  const scene = new Transform();
  mesh.setParent(scene);

  // Stored for resize/pointer math; the gradient itself ignores the
  // pointer (D-04 interaction lives on the node layer added in 02-02).
  let width = 0;
  let height = 0;
  let pointer: { x: number; y: number } | null = null;
  let contextLost = false;

  function resize(widthCssPx: number, heightCssPx: number): void {
    width = widthCssPx;
    height = heightCssPx;
    renderer.setSize(width, height);
    applyCanvasBoxStyle(canvas);
    program.uniforms.uResolution.value = [width * renderer.dpr, height * renderer.dpr];
  }

  function setPointer(xCssPx: number | null, yCssPx: number | null): void {
    pointer = xCssPx === null || yCssPx === null ? null : { x: xCssPx, y: yCssPx };
  }

  function render(timeSeconds: number, _deltaSeconds: number): void {
    if (contextLost) return;
    program.uniforms.uTime.value = timeSeconds;
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

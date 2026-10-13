// Pure module: no browser globals and NO runtime imports at all (same
// convention as heroConfig.ts/nodeNetwork.ts), so Node's
// --experimental-strip-types loader can import it directly in
// scripts/hero-gl-guards.test.mjs. It declares its own minimal structural
// gl/program types below instead of importing ogl's Program class — only
// WebGLProgram itself is used, which is an ambient DOM lib type (tsconfig
// `lib: ["dom", ...]`), not a runtime import.

export type LinkStatusGl = {
  readonly LINK_STATUS: number;
  getProgramParameter(program: WebGLProgram, pname: number): unknown;
};

export type LoseContextGl = {
  getExtension(name: string): unknown;
};

export type LinkableProgram = {
  program: WebGLProgram | null | undefined;
};

// ogl's Program constructor never throws when a shader fails to compile or
// link — it only console.warns (node_modules/ogl/src/core/Program.js:69-85)
// — so without this check a "successful" scene renders an opaque black
// canvas instead of staying on the polished still (REVIEW WR-01). Keep the
// message fixed and free of the driver's info-log text; ogl already logs
// that separately via console.warn.
export function assertProgramLinked(
  gl: LinkStatusGl,
  program: LinkableProgram,
  name: string,
): void {
  if (!program.program || !gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
    throw new Error(`hero ${name} program failed to link`);
  }
}

// Frees the live WebGL context so a throw during scene construction never
// leaks it (REVIEW WR-02): browsers cap live contexts at roughly 16, so a
// leaked context on repeated failures would evict earlier, healthy
// contexts. Wrapped in try/catch so cleanup itself can never mask the
// original construction error that triggered it.
export function releaseContext(gl: LoseContextGl): void {
  try {
    const ext = gl.getExtension("WEBGL_lose_context") as { loseContext?: () => void } | null;
    ext?.loseContext?.();
  } catch {
    // Swallow: cleanup must never replace the original thrown error.
  }
}

// Pure module: GLSL exported as plain template-literal strings. Next.js 16
// (Turbopack/webpack) has no raw-text loader configured for .glsl/.vert/.frag
// extensions, so shader source lives here as exported `string`s instead
// (RESEARCH.md Anti-Patterns). Target GLSL ES 1.00 (WebGL1-compatible; ogl
// falls back to WebGL1 automatically).

export const gradientVertexShader = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const gradientFragmentShader = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUv;

uniform float uTime;
uniform float uCycle;
uniform vec2 uResolution;
uniform vec3 uBrand;
uniform vec3 uBrandStrong;
uniform vec3 uAccent;
uniform vec3 uCta;

//
// Description : Array and textureless GLSL 2D/3D/4D simplex noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20201014 (stegu)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  // Aspect-corrected coordinates, centered on 0, so noise frequency reads
  // the same regardless of viewport aspect ratio.
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (vUv - 0.5) * aspect;

  // Exactly periodic animation: sampling noise on a circle in time means the
  // field returns to its starting value every uCycle seconds, so the motion
  // loops seamlessly with no visible seam or jump (D-02).
  float phase = 6.2831853 * uTime / uCycle;
  vec2 orbit = vec2(cos(phase), sin(phase)) * 0.6;

  // (a) Base navy wash: low-frequency noise field mixes brandStrong -> brand.
  float baseNoise = snoise(vec3(p * 1.1, 0.0) + vec3(orbit, 0.0));
  float baseMix = smoothstep(-0.6, 0.6, baseNoise);
  vec3 color = mix(uBrandStrong, uBrand, baseMix);

  // (b) Teal current mask: mid-frequency noise field, scaled to cover
  // roughly 20-25% of the area (UI-SPEC gradient budget).
  float tealNoise = snoise(vec3(p * 1.7 + 11.3, 0.0) + vec3(orbit * 1.3, 0.0));
  float tealMask = smoothstep(0.15, 0.85, tealNoise) * 0.55;
  color = mix(color, uAccent, tealMask);

  // (c) Coral glint mask: higher-threshold noise field, kept scarce (<5%)
  // and pushed away from the central text zone via a radial falloff that is
  // 0 near the center and rises toward the edges/corners (D-01).
  float coralNoise = snoise(vec3(p * 2.6 - 7.1, 0.0) + vec3(orbit * 0.8, 0.0));
  float coralField = smoothstep(0.78, 0.95, coralNoise) * 0.45;
  float distFromCenter = length(p);
  float radialAllow = smoothstep(0.35, 0.65, distFromCenter);
  float coralMask = coralField * radialAllow;
  color = mix(color, uCta, coralMask);

  // (d) Center calm: pull back toward brandStrong near the middle so white
  // hero text always keeps WCAG AA contrast, regardless of the noise fields
  // above (D-01).
  float centerCalm = (1.0 - smoothstep(0.0, 0.6, distFromCenter)) * 0.35;
  color = mix(color, uBrandStrong, centerCalm);

  gl_FragColor = vec4(color, 1.0);
}
`;

// Node-network shaders (D-03/D-04): subtle on-brand points with soft round
// dots, and faint connecting lines. Alpha per-vertex is computed on the CPU
// in nodeNetwork.ts (buildNetworkBuffers) — these shaders only interpolate
// and apply it; no proximity math happens on the GPU (RESEARCH.md Open
// Question 2, resolved to CPU-side).

export const nodePointVertexShader = /* glsl */ `
attribute vec2 position;
attribute float alpha;
varying float vAlpha;

uniform float uPointSize;

void main() {
  vAlpha = alpha;
  gl_PointSize = uPointSize;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const nodePointFragmentShader = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying float vAlpha;

uniform vec3 uColor;

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float dist = length(centered);
  if (dist > 0.5) discard;
  float edge = 1.0 - smoothstep(0.35, 0.5, dist);
  gl_FragColor = vec4(uColor, vAlpha * edge);
}
`;

export const nodeLineVertexShader = /* glsl */ `
attribute vec2 position;
attribute float alpha;
varying float vAlpha;

void main() {
  vAlpha = alpha;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const nodeLineFragmentShader = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying float vAlpha;

uniform vec3 uColor;

void main() {
  gl_FragColor = vec4(uColor, vAlpha);
}
`;

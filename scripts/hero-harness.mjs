#!/usr/bin/env node
// Headless-Chrome render harness for the ogl hero gradient (ROADMAP spike
// evidence). Serves the real src/components/hero/*.ts modules (type-stripped
// on the fly) plus the installed ogl package to a minimal page, renders one
// frame in headless Chrome, screenshots it, and analyzes the PNG for the
// D-01/D-02 palette/contrast budget. No new npm dependencies — only Node
// built-ins, google-chrome, and ffmpeg.
//
// Usage: npm run hero:render -- [--width 1920] [--height 1080] [--time 0]
//                                [--out path.png] [--check]
//                                [--layers all|gradient] [--diff-against path.png]
//                                [--still desktop|mobile|all]
//                                [--break-shader gradient|points|lines]

import { parseArgs } from "node:util";
import { createServer } from "node:http";
import { readFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { stripTypeScriptTypes } from "node:module";
import {
  HERO_STILL_SIZES,
  HERO_STILL_PATHS,
  HERO_STILL_MAX_BYTES,
  HERO_STILL_TIME_SECONDS,
} from "../src/components/hero/heroConfig.ts";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const HERO_DIR = path.join(REPO_ROOT, "src/components/hero");
// ogl's package.json "exports" map only exposes "." (-> ./src/index.js) and
// "./src/*" — there is no "./package.json" subpath export, so resolve the
// src directory via the "." entry point instead.
const OGL_SRC_DIR = path.dirname(require.resolve("ogl"));

const CHROME_PATH = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const FFMPEG_PATH = process.env.FFMPEG_PATH || "/usr/bin/ffmpeg";

const MODULE_NAME_RE = /^[A-Za-z0-9_-]+$/;

const { values: args } = parseArgs({
  options: {
    width: { type: "string", default: "1920" },
    height: { type: "string", default: "1080" },
    time: { type: "string", default: "0" },
    out: { type: "string" },
    check: { type: "boolean", default: false },
    layers: { type: "string", default: "all" },
    "diff-against": { type: "string" },
    still: { type: "string" },
    "break-shader": { type: "string" },
  },
});

const width = Number(args.width);
const height = Number(args.height);
const time = Number(args.time);
const layers = args.layers;
if (layers !== "all" && layers !== "gradient") {
  console.error(`Bad --layers value: ${layers} (expected "all" or "gradient")`);
  process.exit(1);
}

// T-02-G3: --break-shader only ever maps to one of these three fixed export
// names; the value is never interpolated into a file path or module name.
const BREAK_SHADER_EXPORT_NAMES = {
  gradient: "gradientFragmentShader",
  points: "nodePointFragmentShader",
  lines: "nodeLineFragmentShader",
};
const breakShader = args["break-shader"];
if (breakShader !== undefined && !Object.hasOwn(BREAK_SHADER_EXPORT_NAMES, breakShader)) {
  console.error(
    `Bad --break-shader value: ${breakShader} (expected "gradient", "points", or "lines")`,
  );
  process.exit(1);
}
const outPath = args.out
  ? path.resolve(REPO_ROOT, args.out)
  : path.resolve(
      REPO_ROOT,
      `.planning/phases/02-webgl-hero/artifacts/hero-${width}x${height}.png`,
    );

function buildHtml(w, h) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>loading</title>
<style>
  html, body { margin: 0; padding: 0; background: #000; }
  #root { position: fixed; inset: 0; width: ${w}px; height: ${h}px; overflow: hidden; }
</style>
<script type="importmap">
{ "imports": { "ogl": "/ogl/src/index.js" } }
</script>
</head>
<body>
<div id="root"></div>
<script type="module" src="/entry.js"></script>
</body>
</html>`;
}

function buildEntryJs(w, h, t, layersArg) {
  return `
import { createHeroScene } from "/hero/heroScene";
import { HERO_SEED } from "/hero/heroConfig";

try {
  const scene = createHeroScene({
    dpr: 1,
    seed: HERO_SEED,
    preserveDrawingBuffer: true,
    layers: ${JSON.stringify(layersArg)},
  });
  document.getElementById("root").appendChild(scene.canvas);
  scene.resize(${w}, ${h});
  scene.render(${t}, 0);
  document.title = "HERO_READY";
} catch (err) {
  document.title = "HERO_ERROR: " + (err && err.message ? err.message : String(err));
}

window.addEventListener("error", (event) => {
  const message = event.error && event.error.message ? event.error.message : event.message;
  document.title = "HERO_ERROR: " + message;
});
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  document.title = "HERO_ERROR: " + (reason && reason.message ? reason.message : String(reason));
});
`;
}

// Failure-mode entry script (--break-shader only). Wraps
// HTMLCanvasElement.prototype.getContext *before* createHeroScene runs so
// the WebGL context ogl's Renderer creates is captured, then proves (a)
// createHeroScene() throws once the server-side shader wrapper makes one
// program fail to link, and (b) the captured context is lost afterwards
// (REVIEW WR-01/WR-02). heroScene is imported dynamically so its module body
// is only evaluated after the getContext wrapper is installed.
function buildBreakShaderEntryJs() {
  return `
import { HERO_SEED } from "/hero/heroConfig";

let capturedCtx = null;
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
  const ctx = originalGetContext.call(this, type, ...rest);
  if (ctx && typeof type === "string" && type.indexOf("webgl") !== -1) {
    capturedCtx = ctx;
  }
  return ctx;
};

(async () => {
  try {
    const { createHeroScene } = await import("/hero/heroScene");
    createHeroScene({
      dpr: 1,
      seed: HERO_SEED,
      preserveDrawingBuffer: true,
      layers: "all",
    });
    document.title = "HERO_UNEXPECTED_SUCCESS";
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    const lost = capturedCtx ? capturedCtx.isContextLost() : "noctx";
    document.title = "HERO_EXPECTED_FAILURE:" + message + ":lost=" + String(lost);
  }
})();
`;
}

function startServer(w, h, t, layersArg, breakShaderArg) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://127.0.0.1");
        const pathname = decodeURIComponent(url.pathname);

        // Threat T-02-03: reject any path traversal attempt before it ever
        // reaches a filesystem read.
        if (pathname.includes("..")) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Bad Request: path traversal rejected");
          return;
        }

        if (pathname === "/") {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(buildHtml(w, h));
          return;
        }

        if (pathname === "/entry.js") {
          res.writeHead(200, { "Content-Type": "text/javascript" });
          res.end(
            breakShaderArg ? buildBreakShaderEntryJs() : buildEntryJs(w, h, t, layersArg),
          );
          return;
        }

        // --break-shader only (T-02-G3): serves the real, unmodified
        // shaders.ts under a second, hardcoded path so the synthesized
        // /hero/shaders wrapper below can re-export everything else from it
        // unbroken. Inactive (404s, same as any other unknown path) unless
        // --break-shader is set.
        if (breakShaderArg && pathname === "/hero-real/shaders") {
          const filePath = path.join(HERO_DIR, "shaders.ts");
          const source = await readFile(filePath, "utf8");
          const stripped = stripTypeScriptTypes(source, { mode: "strip" });
          res.writeHead(200, { "Content-Type": "text/javascript" });
          res.end(stripped);
          return;
        }

        const heroMatch = /^\/hero\/([^/]+)$/.exec(pathname);
        if (heroMatch) {
          const name = heroMatch[1];
          if (!MODULE_NAME_RE.test(name)) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Bad Request: invalid module name");
            return;
          }
          if (breakShaderArg && name === "shaders") {
            // ES module semantics: this local `export const` shadows the
            // same-named export coming through the `export *` re-export of
            // the real module, so every other shader string passes through
            // unchanged and only the targeted one breaks.
            const mappedName = BREAK_SHADER_EXPORT_NAMES[breakShaderArg];
            const wrapper =
              `export * from "/hero-real/shaders";\n` +
              `export const ${mappedName} = "void main() { this_is_not_glsl; }";\n`;
            res.writeHead(200, { "Content-Type": "text/javascript" });
            res.end(wrapper);
            return;
          }
          const filePath = path.join(HERO_DIR, `${name}.ts`);
          const source = await readFile(filePath, "utf8");
          const stripped = stripTypeScriptTypes(source, { mode: "strip" });
          res.writeHead(200, { "Content-Type": "text/javascript" });
          res.end(stripped);
          return;
        }

        const oglMatch = /^\/ogl\/src\/(.+)$/.exec(pathname);
        if (oglMatch) {
          const rel = oglMatch[1];
          const filePath = path.join(OGL_SRC_DIR, rel);
          if (!filePath.startsWith(OGL_SRC_DIR)) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Bad Request: outside ogl src");
            return;
          }
          const source = await readFile(filePath, "utf8");
          res.writeHead(200, { "Content-Type": "text/javascript" });
          res.end(source);
          return;
        }

        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(String(err));
      }
    });

    // Dev-only server: 127.0.0.1 only, random port (threat T-02-03).
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function runChrome(chromeArgs) {
  return execFileAsync(CHROME_PATH, chromeArgs, {
    timeout: 60000,
    maxBuffer: 16 * 1024 * 1024,
  });
}

function chromeBaseFlags(w, h) {
  return [
    "--headless=new",
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    `--window-size=${w},${h}`,
    "--virtual-time-budget=8000",
  ];
}

async function renderOnce(serverUrl, w, h, outFile) {
  const baseFlags = chromeBaseFlags(w, h);

  let dumpResult;
  try {
    dumpResult = await runChrome([...baseFlags, "--dump-dom", serverUrl]);
  } catch (err) {
    throw new Error(`Chrome --dump-dom invocation failed: ${err.message}`);
  }
  const titleMatch = /<title>([^<]*)<\/title>/i.exec(dumpResult.stdout);
  const title = titleMatch ? titleMatch[1] : "(no <title> found in DOM dump)";
  if (title !== "HERO_READY") {
    throw new Error(`Hero scene failed to become ready: ${title}`);
  }

  await mkdir(path.dirname(outFile), { recursive: true });
  await runChrome([...baseFlags, `--screenshot=${outFile}`, serverUrl]);

  if (!existsSync(outFile)) {
    throw new Error(`Chrome did not write a screenshot to ${outFile}`);
  }
}

function parsePngDimensions(buffer) {
  // PNG signature (8 bytes) + IHDR chunk: 4-byte length, "IHDR" (4 bytes),
  // then width/height as 4-byte big-endian integers.
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function decodeRgb(pngPath) {
  const pngBuffer = await readFile(pngPath);
  const { width: pw, height: ph } = parsePngDimensions(pngBuffer);
  const { stdout } = await execFileAsync(
    FFMPEG_PATH,
    ["-v", "error", "-i", pngPath, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { encoding: "buffer", maxBuffer: 256 * 1024 * 1024 },
  );
  return { buffer: stdout, width: pw, height: ph };
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return (
    0.2126 * srgbToLinear(r / 255) +
    0.7152 * srgbToLinear(g / 255) +
    0.0722 * srgbToLinear(b / 255)
  );
}

function analyze(buffer, width, height) {
  const totalPixels = width * height;
  let sumL = 0;
  let sumL2 = 0;
  let warmCount = 0;
  const textBoxLs = [];

  const xMin = Math.floor(width * 0.15);
  const xMax = Math.ceil(width * 0.85);
  const yMin = Math.floor(height * 0.28);
  const yMax = Math.ceil(height * 0.72);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const r = buffer[idx];
      const g = buffer[idx + 1];
      const b = buffer[idx + 2];
      const L = relativeLuminance(r, g, b);
      sumL += L;
      sumL2 += L * L;
      if (r > g + 40 && r > b + 40) warmCount++;
      if (x >= xMin && x < xMax && y >= yMin && y < yMax) {
        textBoxLs.push(L);
      }
    }
  }

  const meanL = sumL / totalPixels;
  const varianceL = Math.max(sumL2 / totalPixels - meanL * meanL, 0);
  const stdL = Math.sqrt(varianceL);
  const warmFraction = warmCount / totalPixels;

  textBoxLs.sort((a, b) => a - b);
  const p99Index = Math.min(textBoxLs.length - 1, Math.floor(textBoxLs.length * 0.99));
  const textBoxP99L = textBoxLs.length > 0 ? textBoxLs[p99Index] : 0;

  return { meanL, stdL, textBoxP99L, warmFraction };
}

// Pitfall-adjacent note: both PNGs must be decoded via the same path as the
// single-frame analysis (ffmpeg rawvideo), not byte-compared, since PNG
// encoding is not guaranteed pixel-stable across runs.
async function diffPngs(pathA, pathB) {
  const a = await decodeRgb(pathA);
  const b = await decodeRgb(pathB);
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(
      `--diff-against size mismatch: ${a.width}x${a.height} vs ${b.width}x${b.height}`,
    );
  }
  const total = a.width * a.height;
  let diffPixels = 0;
  for (let i = 0; i < total; i++) {
    const idx = i * 3;
    const dr = Math.abs(a.buffer[idx] - b.buffer[idx]);
    const dg = Math.abs(a.buffer[idx + 1] - b.buffer[idx + 1]);
    const db = Math.abs(a.buffer[idx + 2] - b.buffer[idx + 2]);
    if (dr > 8 || dg > 8 || db > 8) diffPixels++;
  }
  return { diffPixels, totalPixels: total, width: a.width, height: a.height };
}

function runChecks(metrics) {
  const failures = [];
  if (!(metrics.meanL <= 0.08)) {
    failures.push(`meanL ${metrics.meanL.toFixed(4)} > 0.08 (navy-dominant, D-01)`);
  }
  if (!(metrics.textBoxP99L <= 0.183)) {
    failures.push(
      `textBoxP99L ${metrics.textBoxP99L.toFixed(4)} > 0.183 (white text contrast, D-01)`,
    );
  }
  if (!(metrics.warmFraction <= 0.05)) {
    failures.push(`warmFraction ${metrics.warmFraction.toFixed(4)} > 0.05 (coral scarce, D-01)`);
  }
  if (!(metrics.meanL >= 0.003)) {
    failures.push(`meanL ${metrics.meanL.toFixed(4)} < 0.003 (frame looks blank)`);
  }
  if (!(metrics.stdL >= 0.003)) {
    failures.push(`stdL ${metrics.stdL.toFixed(4)} < 0.003 (frame looks uniform)`);
  }
  return failures;
}

// Encodes pngPath to outWebp as WebP, stepping quality down from 72 to a
// floor of 40 (D-05 ~30-60KB budget); if still over budget at quality 40,
// retries the same quality ladder at 85% of the source dimensions (Pitfall 2:
// no Safari-silent-PNG risk here since this harness always runs in
// headless Chrome, which supports image/webp natively via ffmpeg's encoder).
async function encodeStillWebp(pngPath, outWebp, pw, ph) {
  let quality = 72;
  let lastBytes = Infinity;
  for (let tier = 0; tier < 2; tier++) {
    const scaled = tier === 1;
    const outWidth = scaled ? Math.round(pw * 0.85) : pw;
    const outHeight = scaled ? Math.round(ph * 0.85) : ph;
    const vfArgs = scaled ? ["-vf", `scale=${outWidth}:${outHeight}`] : [];

    while (true) {
      await execFileAsync(FFMPEG_PATH, [
        "-y",
        "-v",
        "error",
        "-i",
        pngPath,
        ...vfArgs,
        "-c:v",
        "libwebp",
        "-quality",
        String(quality),
        "-compression_level",
        "6",
        "-preset",
        "picture",
        outWebp,
      ]);
      const stats = await stat(outWebp);
      lastBytes = stats.size;
      if (lastBytes <= HERO_STILL_MAX_BYTES) {
        return { quality, width: outWidth, height: outHeight, bytes: lastBytes };
      }
      if (quality <= 40) break;
      quality = Math.max(40, quality - 6);
    }
    quality = 72; // reset for the next (85%-scale) tier
  }
  throw new Error(
    `Could not fit still under ${HERO_STILL_MAX_BYTES} bytes at any quality/scale tier (last: ${lastBytes} bytes)`,
  );
}

async function renderStill(variant) {
  const size = HERO_STILL_SIZES[variant];
  const pngPath = path.resolve(
    REPO_ROOT,
    `.planning/phases/02-webgl-hero/artifacts/hero-still-${variant}.png`,
  );
  const server = await startServer(size.width, size.height, HERO_STILL_TIME_SECONDS, "all");
  const { port } = server.address();
  const serverUrl = `http://127.0.0.1:${port}/`;

  try {
    await renderOnce(serverUrl, size.width, size.height, pngPath);
    const { buffer, width: pw, height: ph } = await decodeRgb(pngPath);
    const metrics = analyze(buffer, pw, ph);
    const failures = runChecks(metrics);
    if (failures.length > 0) {
      throw new Error(`Still check failed for ${variant}: ${failures.join("; ")}`);
    }

    const outWebp = path.resolve(REPO_ROOT, HERO_STILL_PATHS[variant]);
    await mkdir(path.dirname(outWebp), { recursive: true });
    const result = await encodeStillWebp(pngPath, outWebp, pw, ph);

    // Pitfall 2: verify the output is really WebP (RIFF....WEBP magic),
    // not a silently-wrong format.
    const header = await readFile(outWebp);
    const isRiff = header.length >= 12 && header.toString("ascii", 0, 4) === "RIFF";
    const isWebp = header.length >= 12 && header.toString("ascii", 8, 12) === "WEBP";
    if (!isRiff || !isWebp) {
      throw new Error(`${outWebp} failed the RIFF/WEBP magic-byte check`);
    }

    console.log(JSON.stringify({ variant, ...result }));
  } finally {
    server.close();
  }
}

// --break-shader only: proves in real headless Chrome (not just the fake-gl
// unit tests in scripts/hero-gl-guards.test.mjs) that a genuine compile/link
// failure in the targeted program makes createHeroScene() throw with the
// expected message and leaves the WebGL context lost. Takes no screenshot
// and writes no file.
async function runBreakShaderCheck(name) {
  const server = await startServer(1920, 1080, 0, "all", name);
  const { port } = server.address();
  const serverUrl = `http://127.0.0.1:${port}/`;

  try {
    const baseFlags = chromeBaseFlags(1920, 1080);
    let dumpResult;
    try {
      dumpResult = await runChrome([...baseFlags, "--dump-dom", serverUrl]);
    } catch (err) {
      throw new Error(`Chrome --dump-dom invocation failed: ${err.message}`);
    }
    const titleMatch = /<title>([^<]*)<\/title>/i.exec(dumpResult.stdout);
    const title = titleMatch ? titleMatch[1] : "(no <title> found in DOM dump)";
    const expected = `HERO_EXPECTED_FAILURE:hero ${name} program failed to link:lost=true`;

    if (title !== expected) {
      console.error(title);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({ breakShader: name, ok: true, title }));
  } finally {
    server.close();
  }
}

async function main() {
  if (breakShader) {
    try {
      await runBreakShaderCheck(breakShader);
    } catch (err) {
      console.error(err && err.message ? err.message : String(err));
      process.exitCode = 1;
    }
    return;
  }

  if (args.still) {
    const variants = args.still === "all" ? ["desktop", "mobile"] : [args.still];
    for (const v of variants) {
      if (!HERO_STILL_SIZES[v]) {
        console.error(`Unknown --still variant: ${v} (expected desktop, mobile, or all)`);
        process.exitCode = 1;
        return;
      }
    }
    try {
      for (const v of variants) {
        await renderStill(v);
      }
    } catch (err) {
      console.error(err && err.message ? err.message : String(err));
      process.exitCode = 1;
    }
    return;
  }

  const server = await startServer(width, height, time, layers);
  const { port } = server.address();
  const serverUrl = `http://127.0.0.1:${port}/`;

  try {
    await renderOnce(serverUrl, width, height, outPath);
    const { buffer, width: pw, height: ph } = await decodeRgb(outPath);
    const metrics = analyze(buffer, pw, ph);

    const report = {
      width: pw,
      height: ph,
      time,
      layers,
      meanL: metrics.meanL,
      stdL: metrics.stdL,
      textBoxP99L: metrics.textBoxP99L,
      warmFraction: metrics.warmFraction,
      out: outPath,
    };

    let diffResult = null;
    if (args["diff-against"]) {
      const diffAgainstPath = path.resolve(REPO_ROOT, args["diff-against"]);
      diffResult = await diffPngs(outPath, diffAgainstPath);
      report.diffPixels = diffResult.diffPixels;
      report.diffAgainst = diffAgainstPath;
    }

    console.log(JSON.stringify(report));

    if (args.check) {
      const failures = runChecks(metrics);
      if (diffResult) {
        const frameArea = diffResult.width * diffResult.height;
        if (!(diffResult.diffPixels > 200)) {
          failures.push(`diffPixels ${diffResult.diffPixels} <= 200 (nodes not visible, D-03)`);
        }
        if (!(diffResult.diffPixels < 0.05 * frameArea)) {
          failures.push(
            `diffPixels ${diffResult.diffPixels} >= 5% of frame (${(0.05 * frameArea).toFixed(0)}) (nodes too prominent, D-03)`,
          );
        }
      }
      if (failures.length > 0) {
        console.error(`FAILED: ${failures.join("; ")}`);
        process.exitCode = 1;
      }
    }
  } catch (err) {
    console.error(err && err.message ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

main();

#!/usr/bin/env node
// Built-site smoke test for the Phase 2 WebGL hero (Plan 02-05 Task 1).
//
// Usage: npm run build && node scripts/hero-smoke.mjs
//
// Drives headless Chrome against the real `out/` static export (not a dev
// server) and proves, end to end:
//   1. Capable browsers hydrate the canvas + pause control (HERO-01/HERO-04)
//   2. prefers-reduced-motion shows only the still, no canvas/pause control
//      (HERO-03, Phase 1 D-16 gate honored live)
//   3. The page still works with JS disabled (D-10 plain anchor links)
//   4. The ogl chunk never ships as an initial-HTML <script> and stays
//      <= 40KB gzipped, so it can never block first paint (HERO-01/QUAL-01)
//   5. The fixed header's real rendered height matches the
//      scroll-margin-top value baked into globals.css (D-10, RESEARCH
//      Open Question 1 — measured, not guessed from Tailwind classes)
//
// Exits 1 with a clear message on the first failure. Node built-ins +
// google-chrome only (threats T-02-16/T-02-17: no new runtime dependency,
// dev-only server bound to 127.0.0.1, serves only from out/, closes in
// `finally`).

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "out");
const STATIC_DIR = path.join(OUT_DIR, "_next/static");
const GLOBALS_CSS_PATH = path.join(REPO_ROOT, "src/app/globals.css");
const RENDERER_JS_PATH = path.join(REPO_ROOT, "node_modules/ogl/src/core/Renderer.js");

const CHROME_PATH = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const GZIP_BUDGET_BYTES = 40960; // 40KB gzip ceiling (plan acceptance criteria)
const DISTINCTIVE_OGL_LITERAL = "OES_standard_derivatives";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

class SmokeFailure extends Error {}

function fail(message) {
  throw new SmokeFailure(message);
}

// ---------------------------------------------------------------------------
// Static server (serves the real out/ export + a same-origin header-height
// measurement harness) — dev-only, 127.0.0.1, random port, closed in finally.
// ---------------------------------------------------------------------------

function measureHeaderHtml(width) {
  // Same-origin iframe (src="/"): a cross-origin iframe would throw on
  // contentDocument access, which is exactly why this page is served from
  // the SAME http server/port as the real site rather than a second server.
  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>pending</title></head>
<body>
<iframe id="f" src="/" width="${width}" height="900"></iframe>
<pre id="result">pending</pre>
<script>
  var done = false;
  function report() {
    if (done) return;
    done = true;
    try {
      var doc = document.getElementById('f').contentDocument;
      var header = doc.querySelector('header');
      var h = header ? header.getBoundingClientRect().height : -1;
      document.title = 'HEADER_HEIGHT=' + h;
    } catch (e) {
      document.title = 'HEADER_HEIGHT_ERROR=' + (e && e.message ? e.message : String(e));
    }
  }
  document.getElementById('f').addEventListener('load', function () {
    // 1s grace period for web fonts to settle before measuring (RESEARCH
    // Open Question 1: measure the real rendered height, not an estimate).
    setTimeout(report, 1000);
  });
  setTimeout(report, 4000);
</script>
</body>
</html>`;
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://127.0.0.1");
        const pathname = decodeURIComponent(url.pathname);

        // Threat T-02-16: reject any path-traversal attempt before it ever
        // reaches a filesystem read.
        if (pathname.includes("..")) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Bad Request: path traversal rejected");
          return;
        }

        if (pathname === "/__measure-header") {
          const width = Number(url.searchParams.get("w")) || 1440;
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(measureHeaderHtml(width));
          return;
        }

        const rel = pathname === "/" ? "/index.html" : pathname;
        const filePath = path.join(OUT_DIR, rel);
        if (!filePath.startsWith(OUT_DIR)) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Bad Request: outside out/");
          return;
        }

        const buf = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
        res.end(buf);
      } catch (err) {
        if (err && err.code === "ENOENT") {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found");
          return;
        }
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(String(err));
      }
    });

    // Dev-only server: 127.0.0.1 only, random port (threat T-02-16).
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

// ---------------------------------------------------------------------------
// Headless Chrome runner
// ---------------------------------------------------------------------------

const BASE_FLAGS = [
  "--headless=new",
  "--no-sandbox",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--hide-scrollbars",
];

async function runChrome(args) {
  try {
    const { stdout } = await execFileAsync(CHROME_PATH, args, {
      timeout: 60000,
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    // Headless Chrome can exit non-zero when --virtual-time-budget expires
    // mid-render even though --dump-dom already wrote a complete DOM to
    // stdout; prefer that over surfacing a spurious failure.
    if (err && typeof err.stdout === "string" && err.stdout.length > 0) {
      return err.stdout;
    }
    throw err;
  }
}

async function dumpDom(url, { width = 1440, height = 900, budget, extraFlags = [] } = {}) {
  const args = [...BASE_FLAGS, `--window-size=${width},${height}`];
  if (budget !== undefined) {
    args.push(`--virtual-time-budget=${budget}`);
  }
  args.push(...extraFlags, "--dump-dom", url);
  return runChrome(args);
}

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

async function checkCapableRun(baseUrl) {
  let dom = await dumpDom(baseUrl, { width: 1440, height: 900, budget: 15000 });
  let hasCanvasMarkers =
    dom.includes("data-hero-canvas") && countOccurrences(dom, "<canvas") >= 1;
  let hasPauseLabel = dom.includes("Pause background animation");

  if (hasCanvasMarkers && !hasPauseLabel) {
    // rAF/hydration timing fallback: raise the virtual-time budget once
    // before concluding the pause control genuinely never mounted.
    dom = await dumpDom(baseUrl, { width: 1440, height: 900, budget: 30000 });
    hasCanvasMarkers = dom.includes("data-hero-canvas") && countOccurrences(dom, "<canvas") >= 1;
    hasPauseLabel = dom.includes("Pause background animation");
  }

  if (!dom.includes("data-hero-canvas")) {
    fail("Capable run: [data-hero-canvas] container missing from the hydrated DOM");
  }
  if (countOccurrences(dom, "<canvas") < 1) {
    fail("Capable run: no <canvas> element found in the hydrated DOM");
  }
  if (!hasPauseLabel) {
    fail(
      'Capable run: "Pause background animation" label missing even after raising ' +
        "--virtual-time-budget to 30000",
    );
  }

  return { hasCanvasMarkers, hasPauseLabel };
}

async function checkReducedMotionRun(baseUrl) {
  const dom = await dumpDom(baseUrl, {
    width: 1440,
    height: 900,
    budget: 15000,
    extraFlags: ["--force-prefers-reduced-motion"],
  });

  if (!dom.includes("hero-still-desktop.webp")) {
    fail("Reduced-motion run: hero-still-desktop.webp not found in the DOM");
  }
  if (!dom.includes('href="#employers"')) {
    fail('Reduced-motion run: href="#employers" not found in the DOM');
  }
  if (!dom.includes('href="#candidates"')) {
    fail('Reduced-motion run: href="#candidates" not found in the DOM');
  }
  if (dom.includes("<canvas")) {
    fail("Reduced-motion run: <canvas> is present but must not render (HERO-03)");
  }
  if (dom.includes("Pause background animation")) {
    fail(
      "Reduced-motion run: pause control is present but must not render " +
        "(no dead control in the static fallback, D-13)",
    );
  }

  return { ok: true };
}

async function checkJsDisabledRun(baseUrl) {
  // DEVIATION (Rule 1 — bug in the plan's documented flag): the plan calls
  // for `--blink-settings=scriptEnabled=false`, but on this environment
  // (google-chrome 148, --headless=new) combining that flag with
  // --dump-dom makes Chrome emit an empty DOM dump and log
  // "Message ... rejected by interface blink.mojom.FrameWidgetHost" —
  // confirmed by direct reproduction outside this script. `--disable-javascript`
  // produces the same "JS truly off" result (verified: no canvas, no pause
  // control, but the headline and both anchors still render) and works
  // correctly with --dump-dom, so it replaces scriptEnabled=false here.
  // IMPORTANT: --virtual-time-budget must be omitted for this run — passing
  // both together was found to silently re-enable JS (the hero canvas and
  // pause control both appeared), which would defeat the point of this check.
  const dom = await dumpDom(baseUrl, {
    width: 1440,
    height: 900,
    extraFlags: ["--disable-javascript"],
  });

  if (!dom.includes("<h1")) {
    fail("JS-disabled run: <h1> headline not found in the DOM");
  }
  if (!dom.includes('href="#employers"')) {
    fail('JS-disabled run: href="#employers" not found in the DOM');
  }
  if (!dom.includes('href="#candidates"')) {
    fail('JS-disabled run: href="#candidates" not found in the DOM');
  }

  return { ok: true };
}

function walkFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function extractTagSubstrings(html, tagName) {
  const re = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return html.match(re) || [];
}

async function checkOglBundle() {
  const rendererSource = readFileSync(RENDERER_JS_PATH, "utf8");
  if (!rendererSource.includes(DISTINCTIVE_OGL_LITERAL)) {
    fail(
      `Bundle check: distinctive literal "${DISTINCTIVE_OGL_LITERAL}" not found in ` +
        `${path.relative(REPO_ROOT, RENDERER_JS_PATH)} — pick a different literal`,
    );
  }

  if (!existsSync(STATIC_DIR)) {
    fail(`Bundle check: ${path.relative(REPO_ROOT, STATIC_DIR)} does not exist — run npm run build first`);
  }

  const indexHtml = readFileSync(path.join(OUT_DIR, "index.html"), "utf8");
  const scriptTags = extractTagSubstrings(indexHtml, "script");
  const linkTags = extractTagSubstrings(indexHtml, "link");

  const allFiles = walkFiles(STATIC_DIR);
  const results = [];

  for (const file of allFiles) {
    const buf = readFileSync(file);
    if (!buf.includes(DISTINCTIVE_OGL_LITERAL)) continue;

    const basename = path.basename(file);
    const inInitialHtml = scriptTags.some((tag) => tag.includes(basename));
    const preloaded = linkTags.some(
      (tag) => tag.toLowerCase().includes('rel="preload"') && tag.includes(basename),
    );
    const gzipBytes = gzipSync(buf).length;

    const result = { chunk: path.relative(OUT_DIR, file), gzipBytes, inInitialHtml, preloaded };
    results.push(result);
    console.log(JSON.stringify(result));
  }

  if (results.length === 0) {
    fail("Bundle check: no chunk under out/_next/static/ contains the ogl literal — did ogl ship at all?");
  }

  for (const result of results) {
    if (result.inInitialHtml) {
      fail(
        `Bundle check: ${result.chunk} is referenced by an initial <script> tag in index.html — ` +
          "ogl must be lazily loaded (dynamic import), never render-blocking",
      );
    }
    if (result.gzipBytes > GZIP_BUDGET_BYTES) {
      fail(
        `Bundle check: ${result.chunk} is ${result.gzipBytes} gzip bytes, over the ${GZIP_BUDGET_BYTES} ` +
          "budget. Apply the deep-import fallback described in 02-05-PLAN.md Task 1 " +
          "(import ogl/src/core/*.js etc. instead of the package root) and re-run.",
      );
    }
    if (result.preloaded) {
      console.log(
        `NOTE: ${result.chunk} is referenced by a <link rel="preload"> — non-blocking per plan, recorded for SUMMARY.`,
      );
    }
  }

  return results;
}

function readScrollMarginCssValue() {
  const css = readFileSync(GLOBALS_CSS_PATH, "utf8");
  const match = /scroll-margin-top:\s*calc\((\d+)px \+ 1rem\)/.exec(css);
  if (!match) {
    fail(`Could not find a "scroll-margin-top: calc(Npx + 1rem)" rule in ${GLOBALS_CSS_PATH}`);
  }
  return Number(match[1]);
}

function updateScrollMarginCssValue(newValue) {
  const css = readFileSync(GLOBALS_CSS_PATH, "utf8");
  const updated = css
    .replace(
      /scroll-margin-top:\s*calc\(\d+px \+ 1rem\);/,
      `scroll-margin-top: calc(${newValue}px + 1rem);`,
    )
    .replace(
      /\/\* 73px is the fixed Header height[\s\S]*?\*\//,
      `/* ${newValue}px is the fixed Header's real rendered height, measured by\n     scripts/hero-smoke.mjs at 1440px and 390px widths, plus the UI-SPEC\n     16px buffer. */`,
    );
  writeFileSync(GLOBALS_CSS_PATH, updated);
}

async function measureHeaderHeight(baseUrl, width) {
  const dom = await dumpDom(`${baseUrl}__measure-header?w=${width}`, {
    width: width + 40,
    height: 1000,
    budget: 6000,
  });
  const titleMatch = /<title>([^<]*)<\/title>/i.exec(dom);
  const title = titleMatch ? titleMatch[1] : "";
  const okMatch = /^HEADER_HEIGHT=([\d.]+)$/.exec(title);
  if (!okMatch) {
    fail(`Header-height measurement failed at width=${width}: title was "${title}"`);
  }
  return Number(okMatch[1]);
}

async function checkHeaderHeight(baseUrl) {
  const widths = [1440, 390];
  let cssValue = readScrollMarginCssValue();
  let measurements = {};

  for (const width of widths) {
    measurements[width] = await measureHeaderHeight(baseUrl, width);
  }

  let mismatch = widths.some((w) => Math.round(measurements[w]) !== cssValue);

  if (mismatch) {
    // The measured height differs from the value baked into globals.css at
    // 02-04 time — correct it (Rule 1: fix the bug) rather than fail the
    // whole plan on a stale estimate.
    const maxMeasured = Math.max(...widths.map((w) => measurements[w]));
    const newValue = Math.ceil(maxMeasured);
    updateScrollMarginCssValue(newValue);
    console.log(
      `NOTE: scroll-margin-top mismatch (css=${cssValue}px, measured=${JSON.stringify(
        measurements,
      )}) — updated globals.css to ${newValue}px. Rebuilding to re-verify...`,
    );
    await execFileAsync("npm", ["run", "build"], { cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 });

    cssValue = readScrollMarginCssValue();
    measurements = {};
    for (const width of widths) {
      measurements[width] = await measureHeaderHeight(baseUrl, width);
    }
    mismatch = widths.some((w) => Math.round(measurements[w]) !== cssValue);
    if (mismatch) {
      fail(
        `Header-height measurement still mismatched after updating globals.css: ` +
          `css=${cssValue}px, measured=${JSON.stringify(measurements)}`,
      );
    }
  }

  for (const width of widths) {
    console.log(JSON.stringify({ width, headerHeight: measurements[width], cssValue }));
  }

  return { measurements, cssValue };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!existsSync(path.join(OUT_DIR, "index.html"))) {
    console.error(`HERO_SMOKE_FAIL: ${OUT_DIR}/index.html not found — run "npm run build" first`);
    process.exitCode = 1;
    return;
  }

  const server = await startServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/`;

  try {
    console.log("Running capable-browser check...");
    await checkCapableRun(baseUrl);

    console.log("Running prefers-reduced-motion check...");
    await checkReducedMotionRun(baseUrl);

    console.log("Running JS-disabled check...");
    await checkJsDisabledRun(baseUrl);

    console.log("Running ogl bundle lazy/size check...");
    await checkOglBundle();

    console.log("Running header-height measurement check...");
    await checkHeaderHeight(baseUrl);

    console.log("HERO_SMOKE_OK");
  } catch (err) {
    if (err instanceof SmokeFailure) {
      console.error(`HERO_SMOKE_FAIL: ${err.message}`);
    } else {
      console.error(`HERO_SMOKE_FAIL: unexpected error: ${err && err.stack ? err.stack : err}`);
    }
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

main();

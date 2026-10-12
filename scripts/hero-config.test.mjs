import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HERO_COLORS,
  hexToRgb01,
  HERO_CYCLE_SECONDS,
  HERO_NODE_COUNT_DESKTOP,
  HERO_NODE_COUNT_TABLET,
  HERO_NODE_COUNT_MOBILE,
  HERO_CROSSFADE_MS,
  HERO_DPR_MAX,
  HERO_DPR_MAX_NARROW,
  HERO_STILL_MAX_BYTES,
} from "../src/components/hero/heroConfig.ts";

function readGlobalsToken(name) {
  const css = readFileSync(
    new URL("../src/app/globals.css", import.meta.url),
    "utf8",
  );
  const match = new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(css);
  assert.ok(match, `--color-${name} not found in globals.css`);
  return match[1];
}

test("HERO_COLORS matches the @theme tokens in globals.css", () => {
  assert.equal(HERO_COLORS.brand.toLowerCase(), readGlobalsToken("brand").toLowerCase());
  assert.equal(
    HERO_COLORS.brandStrong.toLowerCase(),
    readGlobalsToken("brand-strong").toLowerCase(),
  );
  assert.equal(HERO_COLORS.accent.toLowerCase(), readGlobalsToken("accent").toLowerCase());
  assert.equal(HERO_COLORS.cta.toLowerCase(), readGlobalsToken("cta").toLowerCase());
  assert.equal(
    HERO_COLORS.onBrand.toLowerCase(),
    readGlobalsToken("on-brand").toLowerCase(),
  );
});

test("hexToRgb01 converts #RRGGBB to normalized [r,g,b]", () => {
  assert.deepEqual(hexToRgb01("#0B2545"), [11 / 255, 37 / 255, 69 / 255]);
  assert.deepEqual(hexToRgb01("#FFFFFF"), [1, 1, 1]);
});

test("hexToRgb01 throws on malformed hex input", () => {
  assert.throws(() => hexToRgb01("#12345"), /Invalid hex color/);
  assert.throws(() => hexToRgb01("0B2545"), /Invalid hex color/);
});

test("HERO_CYCLE_SECONDS is within the D-02 20-30s band", () => {
  assert.ok(HERO_CYCLE_SECONDS >= 20 && HERO_CYCLE_SECONDS <= 30);
});

test("node counts descend desktop > tablet > mobile within D-03 range", () => {
  assert.ok(HERO_NODE_COUNT_DESKTOP >= 30 && HERO_NODE_COUNT_DESKTOP <= 60);
  assert.ok(HERO_NODE_COUNT_TABLET < HERO_NODE_COUNT_DESKTOP);
  assert.ok(HERO_NODE_COUNT_MOBILE < HERO_NODE_COUNT_TABLET);
});

test("HERO_CROSSFADE_MS is within the D-06 600-1000ms band", () => {
  assert.ok(HERO_CROSSFADE_MS >= 600 && HERO_CROSSFADE_MS <= 1000);
});

test("HERO_DPR_MAX_NARROW <= HERO_DPR_MAX <= 2", () => {
  assert.ok(HERO_DPR_MAX_NARROW <= HERO_DPR_MAX);
  assert.ok(HERO_DPR_MAX <= 2);
});

test("HERO_STILL_MAX_BYTES equals the D-05 ~30-60KB ceiling", () => {
  assert.equal(HERO_STILL_MAX_BYTES, 61440);
});

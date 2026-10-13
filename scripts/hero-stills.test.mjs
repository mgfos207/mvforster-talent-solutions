// Still/live tier-parity contract (02-07 gap closure, REVIEW WR-04).
// Each pre-rendered still must be rendered at a CSS width whose node tier
// matches the live canvas tier across that still's entire served range.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nodeCountForWidth } from "../src/components/hero/nodeNetwork.ts";
import {
  HERO_NODE_COUNT_DESKTOP,
  HERO_NODE_COUNT_TABLET,
  HERO_NODE_COUNT_MOBILE,
  HERO_TABLET_BREAKPOINT_PX,
  HERO_NARROW_BREAKPOINT_PX,
  HERO_STILL_SIZES,
  HERO_STILL_SRC,
  HERO_STILL_PATHS,
  HERO_STILL_MEDIA,
} from "../src/components/hero/heroConfig.ts";

const NODE_COUNT_PARAMS = {
  tabletBreakpointPx: HERO_TABLET_BREAKPOINT_PX,
  narrowBreakpointPx: HERO_NARROW_BREAKPOINT_PX,
  desktop: HERO_NODE_COUNT_DESKTOP,
  tablet: HERO_NODE_COUNT_TABLET,
  mobile: HERO_NODE_COUNT_MOBILE,
};

const VARIANTS = ["mobile", "tablet", "desktop"];
const EXPECTED_TIER = {
  mobile: HERO_NODE_COUNT_MOBILE,
  tablet: HERO_NODE_COUNT_TABLET,
  desktop: HERO_NODE_COUNT_DESKTOP,
};
// Upper probe for the open-ended desktop range.
const OPEN_RANGE_PROBE_PX = 3840;

const tier = (w) => nodeCountForWidth(w, NODE_COUNT_PARAMS);

test("still render CSS width resolves to the same node tier as its entire served range", () => {
  for (const v of VARIANTS) {
    const s = HERO_STILL_SIZES[v];
    const maxW = s.maxCssWidth ?? OPEN_RANGE_PROBE_PX;
    assert.equal(tier(s.cssWidth), tier(s.minCssWidth), `${v}: cssWidth tier != min tier`);
    assert.equal(tier(s.cssWidth), tier(maxW), `${v}: cssWidth tier != max tier`);
    assert.equal(tier(s.cssWidth), EXPECTED_TIER[v], `${v}: unexpected tier`);
  }
});

test("still render CSS width lies inside its served range", () => {
  for (const v of VARIANTS) {
    const s = HERO_STILL_SIZES[v];
    assert.ok(s.minCssWidth <= s.cssWidth, `${v}: cssWidth below range`);
    assert.ok(
      s.maxCssWidth === null || s.cssWidth <= s.maxCssWidth,
      `${v}: cssWidth above range`,
    );
  }
});

test("still output dims equal CSS size times dpr", () => {
  for (const v of VARIANTS) {
    const s = HERO_STILL_SIZES[v];
    assert.ok(s.dpr === 1 || s.dpr === 2, `${v}: dpr must be 1 or 2`);
    assert.equal(s.width, s.cssWidth * s.dpr, `${v}: width`);
    assert.equal(s.height, s.cssHeight * s.dpr, `${v}: height`);
  }
});

test("served ranges tile [0, infinity) with no gap or overlap at the tier breakpoints", () => {
  const { mobile, tablet, desktop } = HERO_STILL_SIZES;
  assert.equal(mobile.minCssWidth, 0);
  assert.equal(mobile.maxCssWidth + 1, tablet.minCssWidth);
  assert.equal(tablet.minCssWidth, HERO_NARROW_BREAKPOINT_PX);
  assert.equal(tablet.maxCssWidth + 1, desktop.minCssWidth);
  assert.equal(desktop.minCssWidth, HERO_TABLET_BREAKPOINT_PX);
  assert.equal(desktop.maxCssWidth, null);
});

test("picture media queries are built from the served range numbers", () => {
  const { mobile, tablet } = HERO_STILL_SIZES;
  assert.equal(HERO_STILL_MEDIA.mobile, `(max-width: ${mobile.maxCssWidth}px)`);
  assert.equal(
    HERO_STILL_MEDIA.tablet,
    `(min-width: ${tablet.minCssWidth}px) and (max-width: ${tablet.maxCssWidth}px)`,
  );
  assert.equal(Object.hasOwn(HERO_STILL_MEDIA, "desktop"), false);
});

test("HERO_STILL_PATHS mirror HERO_STILL_SRC under public/", () => {
  for (const v of VARIANTS) {
    assert.equal(HERO_STILL_PATHS[v], "public" + HERO_STILL_SRC[v], v);
  }
});

test("Hero.tsx derives its picture from heroConfig (drift guard)", () => {
  const src = readFileSync(
    new URL("../src/components/sections/Hero.tsx", import.meta.url),
    "utf8",
  );
  assert.equal(src.includes("/hero/hero-still-"), false, "hardcoded still path");
  assert.equal(src.includes("max-width: 767px"), false, "hardcoded media query");
  assert.ok(src.includes("HERO_STILL_SRC"), "missing HERO_STILL_SRC");
  assert.ok(src.includes("HERO_STILL_MEDIA"), "missing HERO_STILL_MEDIA");
});

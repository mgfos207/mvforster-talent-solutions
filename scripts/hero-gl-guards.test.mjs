import { test } from "node:test";
import assert from "node:assert/strict";
import { assertProgramLinked, releaseContext } from "../src/components/hero/glGuards.ts";

const LINK_STATUS = 0x8b82;

test("assertProgramLinked throws a fixed message when link status is false", () => {
  const calls = [];
  const fakeGl = {
    LINK_STATUS,
    getProgramParameter(program, pname) {
      calls.push([program, pname]);
      return false;
    },
  };
  const fakeProgram = { program: {} };
  assert.throws(
    () => assertProgramLinked(fakeGl, fakeProgram, "gradient"),
    (err) => err instanceof Error && err.message === "hero gradient program failed to link",
  );
});

test("assertProgramLinked throws without calling getProgramParameter when program.program is null", () => {
  const calls = [];
  const fakeGl = {
    LINK_STATUS,
    getProgramParameter(program, pname) {
      calls.push([program, pname]);
      return true;
    },
  };
  const fakeProgram = { program: null };
  assert.throws(
    () => assertProgramLinked(fakeGl, fakeProgram, "points"),
    (err) => err instanceof Error && err.message === "hero points program failed to link",
  );
  assert.equal(calls.length, 0);
});

test("assertProgramLinked does not throw when link status is true, and calls getProgramParameter correctly", () => {
  const calls = [];
  const fakeGl = {
    LINK_STATUS,
    getProgramParameter(program, pname) {
      calls.push([program, pname]);
      return true;
    },
  };
  const theProgram = {};
  const fakeProgram = { program: theProgram };
  assert.doesNotThrow(() => assertProgramLinked(fakeGl, fakeProgram, "lines"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], theProgram);
  assert.equal(calls[0][1], LINK_STATUS);
});

test("releaseContext calls loseContext exactly once when WEBGL_lose_context is available", () => {
  let loseContextCalls = 0;
  const fakeGl = {
    getExtension(name) {
      assert.equal(name, "WEBGL_lose_context");
      return {
        loseContext() {
          loseContextCalls += 1;
        },
      };
    },
  };
  releaseContext(fakeGl);
  assert.equal(loseContextCalls, 1);
});

test("releaseContext does not throw when getExtension returns null", () => {
  const fakeGl = {
    getExtension() {
      return null;
    },
  };
  assert.doesNotThrow(() => releaseContext(fakeGl));
});

test("releaseContext does not throw when getExtension itself throws", () => {
  const fakeGl = {
    getExtension() {
      throw new Error("driver exploded");
    },
  };
  assert.doesNotThrow(() => releaseContext(fakeGl));
});

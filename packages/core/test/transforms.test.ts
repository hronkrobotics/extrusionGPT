import { describe, expect, it } from "vitest";
import { alongAxis, applyQuat, vec3 } from "../src/schema/geometry.js";

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe("alongAxis", () => {
  it("keeps local +Y along world +Y (identity)", () => {
    const r = applyQuat(alongAxis("y"), vec3(0, 1, 0));
    expect(close(r.x, 0) && close(r.y, 1) && close(r.z, 0)).toBe(true);
  });

  it("maps local +Y to world +X", () => {
    const r = applyQuat(alongAxis("x"), vec3(0, 1, 0));
    expect(close(r.x, 1) && close(r.y, 0) && close(r.z, 0)).toBe(true);
  });

  it("maps local +Y to world +Z", () => {
    const r = applyQuat(alongAxis("z"), vec3(0, 1, 0));
    expect(close(r.x, 0) && close(r.y, 0) && close(r.z, 1)).toBe(true);
  });
});

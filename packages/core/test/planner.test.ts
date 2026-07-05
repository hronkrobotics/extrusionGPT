import { describe, expect, it } from "vitest";
import { normalizeWorkbenchIntent } from "../src/planner/normalize.js";
import type { PlannerExtraction } from "../src/planner/schema.js";

/**
 * Eval fixtures for the DETERMINISTIC half of the planner. The LLM extraction
 * is mocked (its output is a PlannerExtraction); these lock in normalization,
 * clamping, and default behavior so model/prompt drift is caught downstream.
 */
const ex = (over: Partial<PlannerExtraction>): PlannerExtraction => ({
  family: "workbench",
  widthMm: null,
  depthMm: null,
  heightMm: null,
  profileSize: null,
  shelfCount: null,
  feet: null,
  topPanel: null,
  assumptions: [],
  ...over,
});

describe("normalizeWorkbenchIntent", () => {
  it("fills defaults when nothing is specified", () => {
    const { intent } = normalizeWorkbenchIntent(ex({}));
    expect(intent.width).toBe(1200);
    expect(intent.depth).toBe(600);
    expect(intent.height).toBe(900);
    expect(intent.feet).toBe("feet");
    expect(intent.topPanel).toBe(true);
  });

  it("clamps out-of-range dimensions and records assumptions", () => {
    const { intent, assumptions } = normalizeWorkbenchIntent(ex({ widthMm: 99999, heightMm: 10 }));
    expect(intent.width).toBe(3000);
    expect(intent.height).toBe(400);
    expect(assumptions.some((a) => a.includes("clamped"))).toBe(true);
  });

  it("chooses 2040 for large spans when profile unspecified", () => {
    const { intent } = normalizeWorkbenchIntent(ex({ widthMm: 2000 }));
    expect(intent.profileSize).toBe("2040");
  });

  it("chooses 2020 for small benches when profile unspecified", () => {
    const { intent } = normalizeWorkbenchIntent(ex({ widthMm: 800, depthMm: 500 }));
    expect(intent.profileSize).toBe("2020");
  });

  it("clamps shelf count to the allowed maximum", () => {
    const { intent } = normalizeWorkbenchIntent(ex({ shelfCount: 10 }));
    expect(intent.shelfCount).toBe(3);
  });

  it("respects explicit casters", () => {
    const { intent } = normalizeWorkbenchIntent(ex({ feet: "casters" }));
    expect(intent.feet).toBe("casters");
  });
});

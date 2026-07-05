import { describe, expect, it } from "vitest";
import { generateWorkbench } from "../src/families/workbench/generator.js";
import { generateBom } from "../src/bom/index.js";
import type { WorkbenchIntent } from "../src/schema/design-intent.js";

const intent: WorkbenchIntent = {
  family: "workbench",
  width: 1200,
  depth: 600,
  height: 900,
  profileSize: "2040",
  shelfCount: 1,
  feet: "casters",
  topPanel: true,
};

describe("generateBom", () => {
  const bom = generateBom(generateWorkbench(intent));

  it("has non-zero totals", () => {
    expect(bom.totals.partCount).toBeGreaterThan(0);
    expect(bom.totals.cost).toBeGreaterThan(0);
    expect(bom.totals.weight).toBeGreaterThan(0);
  });

  it("counts four casters and no feet", () => {
    const casters = bom.lines.find((l) => l.moduleId === "caster");
    expect(casters?.qty).toBe(4);
    expect(bom.lines.some((l) => l.moduleId === "foot")).toBe(false);
  });

  it("counts t-nuts from joints (never rendered as nodes)", () => {
    const tnuts = bom.lines.find((l) => l.moduleId === "tnut");
    expect(tnuts).toBeDefined();
    expect(tnuts!.qty).toBeGreaterThan(0);
  });

  it("produces a profile cut list", () => {
    expect(bom.cutList.length).toBeGreaterThan(0);
    for (const item of bom.cutList) expect(item.lengthMm).toBeGreaterThan(0);
  });

  it("line cost equals unit cost times qty", () => {
    for (const l of bom.lines) {
      expect(l.lineCost).toBeCloseTo(Math.round(l.unitCost * l.qty * 100) / 100, 2);
    }
  });
});

import { describe, expect, it } from "vitest";
import { generateWorkbench } from "../src/families/workbench/generator.js";
import type { WorkbenchIntent } from "../src/schema/design-intent.js";

const base: WorkbenchIntent = {
  family: "workbench",
  width: 1200,
  depth: 600,
  height: 900,
  profileSize: "2040",
  shelfCount: 0,
  feet: "feet",
  topPanel: true,
};

describe("generateWorkbench", () => {
  it("produces the four legs and a top frame", () => {
    const g = generateWorkbench(base);
    const legs = g.nodes.filter((n) => n.meta.tags.includes("leg"));
    const rails = g.nodes.filter((n) => n.meta.tags.includes("rail"));
    expect(legs).toHaveLength(4);
    expect(rails).toHaveLength(4);
  });

  it("uses stable, deterministic node ids across runs", () => {
    const a = generateWorkbench(base).nodes.map((n) => n.id).sort();
    const b = generateWorkbench(base).nodes.map((n) => n.id).sort();
    expect(a).toEqual(b);
    expect(a).toContain("leg/front-left");
    expect(a).toContain("top/rail/front");
  });

  it("adds a shelf frame + panel per shelf", () => {
    const g = generateWorkbench({ ...base, shelfCount: 2 });
    expect(g.nodes.some((n) => n.id === "shelf/1/panel")).toBe(true);
    expect(g.nodes.some((n) => n.id === "shelf/2/panel")).toBe(true);
  });

  it("swaps feet for casters", () => {
    const feet = generateWorkbench({ ...base, feet: "feet" });
    const casters = generateWorkbench({ ...base, feet: "casters" });
    expect(feet.nodes.some((n) => n.moduleId === "foot")).toBe(true);
    expect(feet.nodes.some((n) => n.moduleId === "caster")).toBe(false);
    expect(casters.nodes.some((n) => n.moduleId === "caster")).toBe(true);
  });

  it("keeps the top surface at the requested height", () => {
    const g = generateWorkbench(base);
    const panel = g.nodes.find((n) => n.id === "panel/top");
    expect(panel).toBeDefined();
    // panel center = H - thickness/2, so top face sits at H.
    expect(panel!.transform.position.y).toBeCloseTo(900 - 9, 5);
  });

  it("adds gussets only for tall benches", () => {
    const short = generateWorkbench({ ...base, height: 900 });
    const tall = generateWorkbench({ ...base, height: 1400 });
    expect(short.nodes.some((n) => n.moduleId === "gusset")).toBe(false);
    expect(tall.nodes.some((n) => n.moduleId === "gusset")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { compileDesign } from "../src/index.js";
import type { DesignDocument } from "../src/schema/design-document.js";

const doc: DesignDocument = {
  id: "test",
  name: "Test bench",
  version: 1,
  familyId: "workbench",
  intent: {
    family: "workbench",
    width: 1500,
    depth: 700,
    height: 950,
    profileSize: "2040",
    shelfCount: 1,
    feet: "feet",
    topPanel: true,
  },
  overrides: [],
  meta: {},
};

describe("compileDesign", () => {
  it("produces graph, geometry payload, and bom together", () => {
    const { graph, geometry, bom } = compileDesign(doc);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(geometry.groups.length).toBeGreaterThan(0);
    // At least the footprint width; feet extend slightly past the legs.
    expect(geometry.bounds.size.x).toBeGreaterThanOrEqual(1500);
    expect(geometry.bounds.size.x).toBeLessThan(1600);
    expect(bom.totals.partCount).toBeGreaterThan(0);
  });

  it("applies a module-swap override and flags orphans", () => {
    const withOverride = compileDesign({
      ...doc,
      overrides: [
        { nodeId: "foot/front-left", moduleId: "caster" },
        { nodeId: "does/not/exist", hidden: true },
      ],
    });
    const swapped = withOverride.graph.nodes.find((n) => n.id === "foot/front-left");
    expect(swapped?.moduleId).toBe("caster");
    expect(withOverride.orphanedOverrides).toContain("does/not/exist");
  });

  it("hides a node via override so it drops from geometry + bom", () => {
    const before = compileDesign(doc);
    const after = compileDesign({
      ...doc,
      overrides: [{ nodeId: "panel/top", hidden: true }],
    });
    const beforePanels = before.geometry.groups.filter((g) => g.category === "panel").length;
    const afterPanels = after.geometry.groups.filter((g) => g.category === "panel").length;
    expect(afterPanels).toBeLessThan(beforePanels);
  });
});

/**
 * @extrusiongpt/core
 *
 * Framework-agnostic engine. No React, no Next, no DB. This is the single
 * shared contract + deterministic pipeline used by the web app, tests, and any
 * future consumers (CLI, STEP-export worker).
 */

import type { DesignDocument } from "./schema/design-document.js";
import { buildGraph } from "./build.js";
import { buildGeometryPayload, type GeometryPayload } from "./geometry/assemble.js";
import { generateBom } from "./bom/index.js";
import type { AssemblyGraph } from "./schema/assembly-graph.js";
import type { Bom } from "./schema/bom.js";

export * from "./schema/index.js";
export * from "./modules/registry.js";
export { PROFILE_SPECS, HARDWARE_SPECS } from "./modules/materials.js";
export { computeLayout } from "./families/workbench/rules.js";
export { generateWorkbench } from "./families/workbench/generator.js";
export { getFamilyGenerator, listFamilies } from "./families/registry.js";
export { generateGraph, buildGraph, type BuildResult } from "./build.js";
export { applyOverrides, type ApplyOverridesResult } from "./overrides.js";
export {
  buildGeometryPayload,
  type GeometryPayload,
  type InstanceGroup,
  type InstancePlacement,
  type MaterialSpec,
} from "./geometry/assemble.js";
export { composeTransform, localToWorld } from "./geometry/transforms.js";
export { generateBom } from "./bom/index.js";
export {
  PlannerExtractionSchema,
  PLANNER_JSON_SCHEMA,
  PLANNER_SYSTEM_PROMPT,
  type PlannerExtraction,
} from "./planner/schema.js";
export { normalizeWorkbenchIntent, type NormalizeResult } from "./planner/normalize.js";

/**
 * One-shot compile of the source-of-truth document into everything the UI
 * consumes: graph, geometry payload, and BOM. Pure and deterministic.
 */
export interface CompiledDesign {
  graph: AssemblyGraph;
  geometry: GeometryPayload;
  bom: Bom;
  orphanedOverrides: string[];
}

export function compileDesign(doc: DesignDocument): CompiledDesign {
  const { graph, orphanedOverrides } = buildGraph(doc);
  return {
    graph,
    geometry: buildGeometryPayload(graph),
    bom: generateBom(graph),
    orphanedOverrides,
  };
}

import type { AssemblyGraph } from "./schema/assembly-graph.js";
import type { DesignDocument } from "./schema/design-document.js";
import type { DesignIntent } from "./schema/design-intent.js";
import { getFamilyGenerator } from "./families/registry.js";
import { applyOverrides } from "./overrides.js";

/**
 * The one function that turns the source-of-truth DesignDocument into the
 * derived Assembly Graph:
 *
 *   buildGraph(doc) = applyOverrides(generator[doc.familyId](doc.intent), doc.overrides)
 */

export function generateGraph(intent: DesignIntent): AssemblyGraph {
  return getFamilyGenerator(intent.family)(intent);
}

export interface BuildResult {
  graph: AssemblyGraph;
  orphanedOverrides: string[];
}

export function buildGraph(doc: DesignDocument): BuildResult {
  const base = getFamilyGenerator(doc.familyId)(doc.intent);
  const { graph, orphaned } = applyOverrides(base, doc.overrides);
  return { graph, orphanedOverrides: orphaned };
}

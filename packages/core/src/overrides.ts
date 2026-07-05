import type { AssemblyGraph, PartNode } from "./schema/assembly-graph.js";
import type { NodeOverride } from "./schema/design-document.js";
import { getModule, hasModule } from "./modules/registry.js";

/**
 * Apply non-destructive node overrides to a freshly generated graph.
 *
 * Overrides are keyed by stable node id. If an override targets a node that no
 * longer exists (e.g. a parameter change removed it), it is skipped rather than
 * throwing -- callers can surface "orphaned overrides" to the user.
 */

export interface ApplyOverridesResult {
  graph: AssemblyGraph;
  orphaned: string[];
}

export function applyOverrides(
  graph: AssemblyGraph,
  overrides: NodeOverride[],
): ApplyOverridesResult {
  if (overrides.length === 0) return { graph, orphaned: [] };

  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const orphaned: string[] = [];

  for (const ov of overrides) {
    const target = byId.get(ov.nodeId);
    if (!target) {
      orphaned.push(ov.nodeId);
      continue;
    }
    byId.set(ov.nodeId, applyOne(target, ov));
  }

  return {
    graph: { ...graph, nodes: [...byId.values()] },
    orphaned,
  };
}

function applyOne(node: PartNode, ov: NodeOverride): PartNode {
  const moduleId = ov.moduleId && hasModule(ov.moduleId) ? ov.moduleId : node.moduleId;
  const params = ov.params ? { ...node.params, ...ov.params } : node.params;
  const mod = getModule(moduleId);
  const parsed = mod.paramSchema.safeParse(params);
  const connectionPoints = parsed.success
    ? mod.connectionPoints(parsed.data as never)
    : node.connectionPoints;

  const tags = ov.hidden
    ? [...new Set([...node.meta.tags, "hidden"])]
    : node.meta.tags.filter((t) => t !== "hidden");

  return {
    ...node,
    moduleId,
    params,
    connectionPoints,
    transform: ov.transform ?? node.transform,
    meta: { generatedBy: "override", tags },
  };
}

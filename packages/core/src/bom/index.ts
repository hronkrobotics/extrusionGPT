import type { AssemblyGraph } from "../schema/assembly-graph.js";
import type { Bom, BomLine, CutListItem } from "../schema/bom.js";
import { DEFAULT_CURRENCY } from "../modules/materials.js";
import { getModule, resolveModule } from "../modules/registry.js";

/**
 * BOM engine: a pure aggregation over the Assembly Graph.
 *
 * - Placed parts (nodes) are grouped by module + size-relevant params.
 * - Fasteners consumed by joints (connection.hardware) are counted separately,
 *   so they never double-count with rendered nodes.
 */

interface Accum {
  key: string;
  moduleId: string;
  category: string;
  description: string;
  params: Record<string, unknown>;
  qty: number;
  lengthMm?: number;
}

function groupKey(moduleId: string, params: Record<string, unknown>): string {
  const mod = getModule(moduleId);
  if (mod.category === "profile") return `${moduleId}@${Number(params.length).toFixed(1)}`;
  if (mod.category === "panel") {
    return `${moduleId}@${params.width}x${params.depth}x${params.thickness}`;
  }
  return moduleId;
}

function describe(moduleId: string, params: Record<string, unknown>): string {
  const mod = getModule(moduleId);
  if (mod.category === "profile") {
    return `${mod.displayName} - ${Math.round(Number(params.length))} mm`;
  }
  if (mod.category === "panel") {
    return `${mod.displayName} - ${Math.round(Number(params.width))} x ${Math.round(
      Number(params.depth),
    )} x ${params.thickness} mm`;
  }
  return mod.displayName;
}

export function generateBom(graph: AssemblyGraph): Bom {
  const accum = new Map<string, Accum>();

  const add = (moduleId: string, params: Record<string, unknown>) => {
    const key = groupKey(moduleId, params);
    const existing = accum.get(key);
    if (existing) {
      existing.qty += 1;
      return;
    }
    const mod = getModule(moduleId);
    accum.set(key, {
      key,
      moduleId,
      category: mod.category,
      description: describe(moduleId, params),
      params,
      qty: 1,
      lengthMm: mod.category === "profile" ? Number(params.length) : undefined,
    });
  };

  for (const node of graph.nodes) {
    if (node.meta.tags.includes("hidden")) continue;
    add(node.moduleId, node.params);
  }
  for (const conn of graph.connections) {
    for (const hw of conn.hardware) add(hw, {});
  }

  const lines: BomLine[] = [];
  const cutList: CutListItem[] = [];
  let totalCost = 0;
  let totalWeight = 0;
  let partCount = 0;

  for (const item of [...accum.values()].sort((a, b) => a.key.localeCompare(b.key))) {
    const resolved = resolveModule(item.moduleId, item.params);
    const unitCost = resolved.cost.amount;
    const unitWeight = resolved.weight;
    const lineCost = unitCost * item.qty;
    const lineWeight = unitWeight * item.qty;
    const mod = getModule(item.moduleId);

    lines.push({
      key: item.key,
      moduleId: item.moduleId,
      category: item.category,
      description: item.description,
      qty: item.qty,
      lengthMm: item.lengthMm,
      unitCost: round(unitCost),
      unitWeight: round(unitWeight),
      lineCost: round(lineCost),
      lineWeight: round(lineWeight),
      currency: DEFAULT_CURRENCY,
      vendor: mod.meta.vendor,
      sku: mod.meta.sku,
    });

    if (item.category === "profile" && item.lengthMm !== undefined) {
      cutList.push({
        profile: mod.displayName,
        lengthMm: Math.round(item.lengthMm),
        qty: item.qty,
      });
    }

    totalCost += lineCost;
    totalWeight += lineWeight;
    partCount += item.qty;
  }

  cutList.sort((a, b) => a.profile.localeCompare(b.profile) || b.lengthMm - a.lengthMm);

  return {
    lines,
    cutList,
    totals: {
      partCount,
      cost: round(totalCost),
      weight: round(totalWeight),
      currency: DEFAULT_CURRENCY,
    },
    disclaimer:
      "Costs and weights are estimates from the built-in module catalog, not live vendor quotes.",
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

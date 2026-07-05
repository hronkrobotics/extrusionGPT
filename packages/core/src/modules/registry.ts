import type {
  BBox,
  ConnectionPoint,
  GeometryDescriptor,
  ModuleDefinition,
  Money,
} from "../schema/module.js";
import { extrusion2020, extrusion2040 } from "./profiles/extrusion.js";
import { caster, cornerBracket, foot, gusset, tnut } from "./hardware/index.js";
import { shelfPanel } from "./panels/shelf.js";

/**
 * The Module Registry is how the system stays extensible: adding a part means
 * registering a definition, not editing the pipeline. All lookups validate
 * params against the module's schema before running any factory.
 */

// Definitions carry specific param types; the registry erases them so it can
// store a heterogeneous collection. Access always goes through validation.
type ErasedModule = ModuleDefinition<Record<string, never>>;

const ALL_MODULES: ModuleDefinition<never>[] = [
  extrusion2020 as unknown as ModuleDefinition<never>,
  extrusion2040 as unknown as ModuleDefinition<never>,
  cornerBracket as unknown as ModuleDefinition<never>,
  gusset as unknown as ModuleDefinition<never>,
  tnut as unknown as ModuleDefinition<never>,
  foot as unknown as ModuleDefinition<never>,
  caster as unknown as ModuleDefinition<never>,
  shelfPanel as unknown as ModuleDefinition<never>,
];

const REGISTRY = new Map<string, ErasedModule>();
for (const mod of ALL_MODULES) {
  REGISTRY.set(mod.id, mod as unknown as ErasedModule);
}

export function getModule(id: string): ErasedModule {
  const mod = REGISTRY.get(id);
  if (!mod) throw new Error(`Unknown module id: "${id}"`);
  return mod;
}

export function hasModule(id: string): boolean {
  return REGISTRY.has(id);
}

export function listModules(): ErasedModule[] {
  return [...REGISTRY.values()];
}

/** Validate raw params against a module's schema, throwing on failure. */
export function resolveParams(id: string, params: Record<string, unknown>): Record<string, unknown> {
  const mod = getModule(id);
  const result = mod.paramSchema.safeParse(params);
  if (!result.success) {
    throw new Error(`Invalid params for module "${id}": ${result.error.message}`);
  }
  return result.data as Record<string, unknown>;
}

interface Resolved {
  dimensions: BBox;
  connectionPoints: ConnectionPoint[];
  geometry: GeometryDescriptor;
  cost: Money;
  weight: number;
}

/** Validate params once and compute every derived quantity for a module. */
export function resolveModule(id: string, rawParams: Record<string, unknown>): Resolved {
  const mod = getModule(id);
  const params = resolveParams(id, rawParams) as never;
  return {
    dimensions: mod.dimensions(params),
    connectionPoints: mod.connectionPoints(params),
    geometry: mod.geometry(params),
    cost: mod.cost(params),
    weight: mod.weight(params),
  };
}

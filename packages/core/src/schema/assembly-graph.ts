import { z } from "zod";
import { TransformSchema } from "./geometry.js";
import { ConnectionPointSchema } from "./module.js";

/**
 * The Assembly Graph is the derived interchange format between engine stages
 * and the thing the viewer / BOM consume. It is *not* persisted as the source
 * of truth (see DesignDocument) -- it is rebuilt from intent + overrides.
 */

/** A concrete instance of a module placed in world space. */
export const PartNodeSchema = z.object({
  /** Stable, deterministic, semantic id, e.g. "leg/front-left". */
  id: z.string(),
  moduleId: z.string(),
  /** Semantic role for UI + override targeting, e.g. "rail-top-front". */
  role: z.string(),
  /** Resolved module params (already validated against the module schema). */
  params: z.record(z.union([z.number(), z.string(), z.boolean()])),
  transform: TransformSchema,
  connectionPoints: z.array(ConnectionPointSchema),
  meta: z.object({
    generatedBy: z.enum(["generator", "override"]).default("generator"),
    tags: z.array(z.string()).default([]),
  }),
});
export type PartNode = z.infer<typeof PartNodeSchema>;

/** A joint between two connection points, driving structure and hardware BOM. */
export const ConnectionSchema = z.object({
  id: z.string(),
  type: z.enum(["bracket", "tnut-bolt", "butt", "panel-mount"]),
  a: z.object({ nodeId: z.string(), connectionPointId: z.string() }),
  b: z.object({ nodeId: z.string(), connectionPointId: z.string() }),
  /** moduleIds consumed by this joint (brackets, t-nuts, bolts). */
  hardware: z.array(z.string()).default([]),
  meta: z.record(z.unknown()).default({}),
});
export type Connection = z.infer<typeof ConnectionSchema>;

/**
 * Constraints are reserved for a future solver. The MVP generator emits
 * absolute transforms, so this list is typically empty but kept so the schema
 * is forward-compatible.
 */
export const ConstraintSchema = z.object({
  id: z.string(),
  type: z.enum(["coincident", "parallel", "offset", "symmetric"]),
  refs: z.array(z.string()),
  value: z.number().optional(),
});
export type Constraint = z.infer<typeof ConstraintSchema>;

export const ParamBindingSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.literal("mm").default("mm"),
  exposed: z.boolean().default(false),
});
export type ParamBinding = z.infer<typeof ParamBindingSchema>;

export const AssemblyGraphSchema = z.object({
  nodes: z.array(PartNodeSchema),
  connections: z.array(ConnectionSchema),
  constraints: z.array(ConstraintSchema).default([]),
  params: z.array(ParamBindingSchema).default([]),
  meta: z.object({
    familyId: z.string(),
    generatedAt: z.string().optional(),
  }),
});
export type AssemblyGraph = z.infer<typeof AssemblyGraphSchema>;

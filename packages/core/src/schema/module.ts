import { z } from "zod";
import type { ZodType } from "zod";
import { BBoxSchema, TransformSchema, type BBox, type Transform } from "./geometry.js";

/**
 * Module library contract.
 *
 * A ModuleDefinition is *data + small pure factory functions*. Only the
 * serialisable fragments (connection points, geometry descriptors, cost) get
 * Zod schemas; the definition itself lives in code because it carries
 * functions.
 */

export const MODULE_CATEGORIES = [
  "profile",
  "bracket",
  "gusset",
  "tnut",
  "foot",
  "caster",
  "panel",
] as const;
export const ModuleCategorySchema = z.enum(MODULE_CATEGORIES);
export type ModuleCategory = z.infer<typeof ModuleCategorySchema>;

/** Named local frame on a part that can mate with another part. */
export const ConnectionPointSchema = z.object({
  id: z.string(),
  frame: TransformSchema,
  kind: z.enum(["slot", "end", "face", "hole"]),
  compatibleWith: z.array(z.string()).default([]),
});
export type ConnectionPoint = z.infer<typeof ConnectionPointSchema>;

/**
 * A plain-data description of a part's shape. The geometry engine and the
 * viewer turn these into meshes; core never depends on three.js.
 */
export const GeometryDescriptorSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("extrusion"),
    profile: z.enum(["2020", "2040"]),
    /** Cross-section extent, mm: {x} x {y}. Length runs along local +Y. */
    section: z.object({ x: z.number(), y: z.number() }),
    length: z.number().positive(),
  }),
  z.object({
    kind: z.literal("box"),
    size: BBoxSchema,
  }),
  z.object({
    kind: z.literal("cylinder"),
    radius: z.number().positive(),
    height: z.number().positive(),
  }),
]);
export type GeometryDescriptor = z.infer<typeof GeometryDescriptorSchema>;

export const MoneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().default("USD"),
});
export type Money = z.infer<typeof MoneySchema>;

export const ModuleMetaSchema = z.object({
  vendor: z.string().optional(),
  sku: z.string().optional(),
  material: z.string(),
  finish: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
export type ModuleMeta = z.infer<typeof ModuleMetaSchema>;

/**
 * Code-level module definition. `params` is validated by `paramSchema` before
 * any factory function runs, so factories can trust their input.
 */
export interface ModuleDefinition<P extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  category: ModuleCategory;
  displayName: string;
  paramSchema: ZodType<P>;
  dimensions: (params: P) => BBox;
  connectionPoints: (params: P) => ConnectionPoint[];
  geometry: (params: P) => GeometryDescriptor;
  /** Cost of a single unit at the given params (per-part, not per-mm). */
  cost: (params: P) => Money;
  /** Weight of a single unit, grams. */
  weight: (params: P) => number;
  meta: ModuleMeta;
}

/** Erased definition used by the registry once param typing is not needed. */
export type AnyModuleDefinition = ModuleDefinition<Record<string, never>> & {
  paramSchema: ZodType<Record<string, unknown>>;
  dimensions: (params: Record<string, unknown>) => BBox;
  connectionPoints: (params: Record<string, unknown>) => ConnectionPoint[];
  geometry: (params: Record<string, unknown>) => GeometryDescriptor;
  cost: (params: Record<string, unknown>) => Money;
  weight: (params: Record<string, unknown>) => number;
};

export type { Transform, BBox };

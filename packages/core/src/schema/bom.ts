import { z } from "zod";

/** Bill of Materials: a pure projection of the Assembly Graph. */

export const BomLineSchema = z.object({
  /** Grouping key: moduleId plus size-relevant params. */
  key: z.string(),
  moduleId: z.string(),
  category: z.string(),
  description: z.string(),
  qty: z.number().int().nonnegative(),
  /** For profiles: cut length in mm (undefined for discrete hardware). */
  lengthMm: z.number().optional(),
  unitCost: z.number().nonnegative(),
  unitWeight: z.number().nonnegative(),
  lineCost: z.number().nonnegative(),
  lineWeight: z.number().nonnegative(),
  currency: z.string().default("USD"),
  vendor: z.string().optional(),
  sku: z.string().optional(),
});
export type BomLine = z.infer<typeof BomLineSchema>;

export const CutListItemSchema = z.object({
  profile: z.string(),
  lengthMm: z.number(),
  qty: z.number().int(),
});
export type CutListItem = z.infer<typeof CutListItemSchema>;

export const BomSchema = z.object({
  lines: z.array(BomLineSchema),
  cutList: z.array(CutListItemSchema),
  totals: z.object({
    partCount: z.number().int().nonnegative(),
    cost: z.number().nonnegative(),
    weight: z.number().nonnegative(),
    currency: z.string().default("USD"),
  }),
  /** Costs are estimates from the module catalog, not live quotes. */
  disclaimer: z.string(),
});
export type Bom = z.infer<typeof BomSchema>;

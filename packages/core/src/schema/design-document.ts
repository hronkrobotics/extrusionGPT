import { z } from "zod";
import { TransformSchema } from "./geometry.js";
import { DesignIntentSchema } from "./design-intent.js";

/**
 * A non-destructive manual edit layered on top of the generated graph, keyed
 * by a stable node id. Overrides let a user nudge an individual part without
 * discarding the parametric intent.
 */
export const NodeOverrideSchema = z.object({
  nodeId: z.string(),
  /** Patch the node's params (merged over generated params). */
  params: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  /** Replace the node's world transform entirely. */
  transform: TransformSchema.optional(),
  /** Swap the module used for this node (e.g. foot -> caster on one leg). */
  moduleId: z.string().optional(),
  /** Hide the node without deleting it (kept for re-anchoring). */
  hidden: z.boolean().optional(),
});
export type NodeOverride = z.infer<typeof NodeOverrideSchema>;

/**
 * The DesignDocument is the persisted, authoritative source of truth. The
 * Assembly Graph is derived from it via buildGraph(document).
 */
export const DesignDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().int().nonnegative().default(1),
  familyId: z.string(),
  intent: DesignIntentSchema,
  overrides: z.array(NodeOverrideSchema).default([]),
  meta: z
    .object({
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
      notes: z.string().optional(),
    })
    .default({}),
});
export type DesignDocument = z.infer<typeof DesignDocumentSchema>;

import { z } from "zod";

/**
 * DesignIntent is the small, parametric, human/AI-editable spec that drives
 * generation. This is the ONLY thing the LLM is allowed to produce. Everything
 * downstream is deterministic.
 *
 * All dimensions are millimetres.
 */

export const PROFILE_SIZES = ["2020", "2040"] as const;
export const ProfileSizeSchema = z.enum(PROFILE_SIZES);
export type ProfileSize = z.infer<typeof ProfileSizeSchema>;

export const FOOT_TYPES = ["feet", "casters"] as const;
export const FootTypeSchema = z.enum(FOOT_TYPES);
export type FootType = z.infer<typeof FootTypeSchema>;

/** Hard manufacturing / sanity limits. The planner clamps to these. */
export const WORKBENCH_LIMITS = {
  width: { min: 300, max: 3000, default: 1200 },
  depth: { min: 300, max: 1500, default: 600 },
  height: { min: 400, max: 2000, default: 900 },
  shelfCount: { min: 0, max: 3, default: 0 },
} as const;

export const WorkbenchIntentSchema = z.object({
  family: z.literal("workbench"),
  /** Overall footprint width (X), mm. */
  width: z.number(),
  /** Overall footprint depth (Z), mm. */
  depth: z.number(),
  /** Height of the top work surface (Y), mm. */
  height: z.number(),
  profileSize: ProfileSizeSchema,
  /** Number of lower shelves between the legs. */
  shelfCount: z.number().int(),
  /** Feet (fixed) vs casters (mobile). */
  feet: FootTypeSchema,
  /** Include a solid work-surface panel on the top rails. */
  topPanel: z.boolean(),
});
export type WorkbenchIntent = z.infer<typeof WorkbenchIntentSchema>;

/**
 * DesignIntent is a discriminated union on `family` so new product families
 * (cnc-frame, enclosure, ...) slot in without touching the pipeline.
 */
export const DesignIntentSchema = z.discriminatedUnion("family", [WorkbenchIntentSchema]);
export type DesignIntent = z.infer<typeof DesignIntentSchema>;

export const DEFAULT_WORKBENCH_INTENT: WorkbenchIntent = {
  family: "workbench",
  width: WORKBENCH_LIMITS.width.default,
  depth: WORKBENCH_LIMITS.depth.default,
  height: WORKBENCH_LIMITS.height.default,
  profileSize: "2040",
  shelfCount: WORKBENCH_LIMITS.shelfCount.default,
  feet: "feet",
  topPanel: true,
};

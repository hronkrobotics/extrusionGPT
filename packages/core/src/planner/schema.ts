import { z } from "zod";
import { FOOT_TYPES, PROFILE_SIZES } from "../schema/design-intent.js";

/**
 * The schema the LLM is constrained to. Every field is nullable (not omitted)
 * so it maps cleanly onto OpenAI Structured Outputs "strict" mode, where all
 * properties must be present. `null` means "user did not specify" and the
 * deterministic normalizer fills a default.
 *
 * The LLM extracts intent only; it never picks final defaults or geometry.
 */
export const PlannerExtractionSchema = z.object({
  family: z.literal("workbench"),
  widthMm: z.number().nullable(),
  depthMm: z.number().nullable(),
  heightMm: z.number().nullable(),
  profileSize: z.enum(PROFILE_SIZES).nullable(),
  shelfCount: z.number().int().nullable(),
  feet: z.enum(FOOT_TYPES).nullable(),
  topPanel: z.boolean().nullable(),
  /** Short human-readable notes on how the text was interpreted. */
  assumptions: z.array(z.string()),
});
export type PlannerExtraction = z.infer<typeof PlannerExtractionSchema>;

/**
 * Hand-written JSON Schema for the OpenAI `response_format` call, kept in sync
 * with PlannerExtractionSchema. Avoids a zod-to-json-schema dependency and
 * keeps the strict-mode requirements (all props required, additionalProperties
 * false) explicit.
 */
export const PLANNER_JSON_SCHEMA = {
  name: "workbench_intent",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      family: { type: "string", enum: ["workbench"] },
      widthMm: { type: ["number", "null"] },
      depthMm: { type: ["number", "null"] },
      heightMm: { type: ["number", "null"] },
      profileSize: { type: ["string", "null"], enum: ["2020", "2040", null] },
      shelfCount: { type: ["integer", "null"] },
      feet: { type: ["string", "null"], enum: ["feet", "casters", null] },
      topPanel: { type: ["boolean", "null"] },
      assumptions: { type: "array", items: { type: "string" } },
    },
    required: [
      "family",
      "widthMm",
      "depthMm",
      "heightMm",
      "profileSize",
      "shelfCount",
      "feet",
      "topPanel",
      "assumptions",
    ],
  },
} as const;

export const PLANNER_SYSTEM_PROMPT = `You extract structured design intent for a modular aluminum extrusion WORKBENCH from a user's natural-language request.

Rules:
- Output ONLY the structured fields. Do not invent geometry.
- All dimensions are millimetres. Convert other units (inches -> x25.4, cm -> x10, m -> x1000, feet -> x304.8).
- If the user does not specify a field, return null for it. Do NOT guess defaults; the downstream system fills sensible defaults deterministically.
- widthMm is the left-to-right span, depthMm is front-to-back, heightMm is the top work-surface height.
- "mobile", "rolling", "on wheels" => feet = "casters". "fixed", "stationary" => feet = "feet".
- "shelf"/"lower shelf" (singular) => shelfCount = 1; "two shelves" => 2, etc.
- Heavier/larger benches or explicit "heavy duty" hint profileSize = "2040"; light/small hint "2020". If unclear, null.
- Put brief interpretation notes in "assumptions" (e.g. "converted 48in to 1219mm").`;

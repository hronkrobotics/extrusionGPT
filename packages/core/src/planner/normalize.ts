import {
  DEFAULT_WORKBENCH_INTENT,
  WORKBENCH_LIMITS,
  WorkbenchIntentSchema,
  type WorkbenchIntent,
} from "../schema/design-intent.js";
import type { PlannerExtraction } from "./schema.js";

/**
 * Deterministic normalization: turn a loose (possibly-null) LLM extraction into
 * a valid, clamped WorkbenchIntent. This is where domain defaults and safety
 * limits live -- never in the prompt -- so behavior is testable and stable.
 */

export interface NormalizeResult {
  intent: WorkbenchIntent;
  assumptions: string[];
}

function clamp(
  value: number | null | undefined,
  limit: { min: number; max: number; default: number },
  label: string,
  assumptions: string[],
): number {
  if (value == null || Number.isNaN(value)) {
    assumptions.push(`${label} not specified; defaulted to ${limit.default} mm.`);
    return limit.default;
  }
  if (value < limit.min) {
    assumptions.push(`${label} ${value} mm below minimum; clamped to ${limit.min} mm.`);
    return limit.min;
  }
  if (value > limit.max) {
    assumptions.push(`${label} ${value} mm above maximum; clamped to ${limit.max} mm.`);
    return limit.max;
  }
  return Math.round(value);
}

export function normalizeWorkbenchIntent(extraction: Partial<PlannerExtraction>): NormalizeResult {
  const assumptions: string[] = [...(extraction.assumptions ?? [])];

  const width = clamp(extraction.widthMm, WORKBENCH_LIMITS.width, "Width", assumptions);
  const depth = clamp(extraction.depthMm, WORKBENCH_LIMITS.depth, "Depth", assumptions);
  const height = clamp(extraction.heightMm, WORKBENCH_LIMITS.height, "Height", assumptions);

  let shelfCount = extraction.shelfCount ?? WORKBENCH_LIMITS.shelfCount.default;
  if (shelfCount < WORKBENCH_LIMITS.shelfCount.min) shelfCount = WORKBENCH_LIMITS.shelfCount.min;
  if (shelfCount > WORKBENCH_LIMITS.shelfCount.max) {
    assumptions.push(`Shelf count clamped to ${WORKBENCH_LIMITS.shelfCount.max}.`);
    shelfCount = WORKBENCH_LIMITS.shelfCount.max;
  }

  // Profile heuristic lives in deterministic code, not the prompt.
  let profileSize = extraction.profileSize ?? null;
  if (profileSize == null) {
    profileSize = width > 1500 || depth > 900 ? "2040" : "2020";
    assumptions.push(`Profile size not specified; chose ${profileSize} based on span.`);
  }

  const feet = extraction.feet ?? DEFAULT_WORKBENCH_INTENT.feet;
  const topPanel = extraction.topPanel ?? DEFAULT_WORKBENCH_INTENT.topPanel;

  const intent = WorkbenchIntentSchema.parse({
    family: "workbench",
    width,
    depth,
    height,
    profileSize,
    shelfCount,
    feet,
    topPanel,
  });

  return { intent, assumptions };
}

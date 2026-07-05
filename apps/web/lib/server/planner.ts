import "server-only";
import OpenAI from "openai";
import {
  PLANNER_JSON_SCHEMA,
  PLANNER_SYSTEM_PROMPT,
  PlannerExtractionSchema,
  type PlannerExtraction,
} from "@extrusiongpt/core";

/**
 * The planner's LLM boundary. The model is constrained to PlannerExtraction
 * via Structured Outputs; when no API key is present we fall back to a small
 * deterministic parser so the app is fully usable offline.
 */

export async function extractIntent(
  text: string,
): Promise<{ extraction: PlannerExtraction; usedLlm: boolean }> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return { extraction: await extractWithLlm(text), usedLlm: true };
    } catch {
      // Fall through to the deterministic parser on any LLM error.
    }
  }
  return { extraction: extractFallback(text), usedLlm: false };
}

async function extractWithLlm(text: string): Promise<PlannerExtraction> {
  const client = new OpenAI();
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_PLANNER_MODEL ?? "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: PLANNER_SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    response_format: { type: "json_schema", json_schema: PLANNER_JSON_SCHEMA },
  });
  const content = completion.choices[0]?.message.content ?? "{}";
  return PlannerExtractionSchema.parse(JSON.parse(content));
}

const EMPTY: PlannerExtraction = {
  family: "workbench",
  widthMm: null,
  depthMm: null,
  heightMm: null,
  profileSize: null,
  shelfCount: null,
  feet: null,
  topPanel: null,
  assumptions: [],
};

/** Convert a value + unit token to millimetres. */
function toMm(value: number, unit?: string): number {
  switch ((unit ?? "").toLowerCase()) {
    case "in":
    case "inch":
    case "inches":
    case '"':
      return Math.round(value * 25.4);
    case "cm":
      return Math.round(value * 10);
    case "m":
      return Math.round(value * 1000);
    case "ft":
    case "feet":
      return Math.round(value * 304.8);
    default:
      return Math.round(value);
  }
}

/** Small rule-based extractor mirroring the LLM contract (best-effort). */
export function extractFallback(text: string): PlannerExtraction {
  const t = text.toLowerCase();
  const out: PlannerExtraction = { ...EMPTY, assumptions: ["Parsed without OpenAI (offline mode)."] };
  const unit = "(mm|cm|m|in|inch|inches|ft|feet|\")?";

  // "1200 x 600 x 900" or "1200x600"
  const dims = t.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}\\s*[x×by]+\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}(?:\\s*[x×by]+\\s*(\\d+(?:\\.\\d+)?)\\s*${unit})?`));
  if (dims) {
    const u = dims[2] || dims[4] || dims[6];
    out.widthMm = toMm(Number(dims[1]), u);
    out.depthMm = toMm(Number(dims[3]), u);
    if (dims[5]) out.heightMm = toMm(Number(dims[5]), u);
  }

  const height = t.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unit}\\s*(?:tall|high|height)`));
  if (height) out.heightMm = toMm(Number(height[1]), height[2]);

  const shelfWords: Record<string, number> = { one: 1, two: 2, three: 3, a: 1, "1": 1, "2": 2, "3": 3 };
  const shelf = t.match(/(\d+|one|two|three|a)\s+(?:lower\s+)?shel(?:f|ves)/);
  if (shelf) out.shelfCount = shelfWords[shelf[1] ?? ""] ?? 1;
  else if (/\bshelf\b/.test(t)) out.shelfCount = 1;

  if (/\b(mobile|rolling|wheels|casters?)\b/.test(t)) out.feet = "casters";
  else if (/\b(fixed|stationary|feet)\b/.test(t)) out.feet = "feet";

  if (/\b(heavy[- ]?duty|2040|large|industrial)\b/.test(t)) out.profileSize = "2040";
  else if (/\b(light|small|2020)\b/.test(t)) out.profileSize = "2020";

  if (/\b(no|without)\s+(top|surface|panel)\b/.test(t)) out.topPanel = false;

  return out;
}

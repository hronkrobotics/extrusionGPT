import { NextResponse } from "next/server";
import {
  normalizeWorkbenchIntent,
  type DesignDocument,
  type PlannerExtraction,
  type WorkbenchIntent,
} from "@extrusiongpt/core";
import { extractIntent } from "@/lib/server/planner";

export const runtime = "nodejs";

interface PlanBody {
  text?: string;
  currentDocument?: DesignDocument;
}

/**
 * POST /api/plan
 * Body: { text, currentDocument? } -> { ok, document, assumptions, usedLlm } | { ok:false, clarify }
 *
 * The LLM only produces a PlannerExtraction; the deterministic normalizer fills
 * defaults + clamps. For follow-ups, unspecified fields fall back to the current
 * design so "make it taller" preserves everything else.
 */
export async function POST(req: Request) {
  let body: PlanBody;
  try {
    body = (await req.json()) as PlanBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
  }

  const { extraction, usedLlm } = await extractIntent(text);
  const base = body.currentDocument?.intent as WorkbenchIntent | undefined;

  // Merge: extraction wins, else keep current design, else let normalize default.
  const merged: Partial<PlannerExtraction> = {
    family: "workbench",
    widthMm: extraction.widthMm ?? base?.width ?? null,
    depthMm: extraction.depthMm ?? base?.depth ?? null,
    heightMm: extraction.heightMm ?? base?.height ?? null,
    profileSize: extraction.profileSize ?? base?.profileSize ?? null,
    shelfCount: extraction.shelfCount ?? base?.shelfCount ?? null,
    feet: extraction.feet ?? base?.feet ?? null,
    topPanel: extraction.topPanel ?? base?.topPanel ?? null,
    assumptions: extraction.assumptions,
  };

  const { intent, assumptions } = normalizeWorkbenchIntent(merged);

  const now = new Date().toISOString();
  const document: DesignDocument = body.currentDocument
    ? {
        ...body.currentDocument,
        intent,
        version: body.currentDocument.version + 1,
        meta: { ...body.currentDocument.meta, updatedAt: now },
      }
    : {
        id: crypto.randomUUID(),
        name: deriveName(text),
        version: 1,
        familyId: "workbench",
        intent,
        overrides: [],
        meta: { createdAt: now, updatedAt: now },
      };

  return NextResponse.json({ ok: true, document, assumptions, usedLlm });
}

function deriveName(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 42 ? `${cleaned.slice(0, 42)}...` : cleaned || "Workbench";
}

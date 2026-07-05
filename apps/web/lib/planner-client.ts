"use client";

import type { DesignDocument } from "@extrusiongpt/core";

export interface PlanSuccess {
  ok: true;
  document: DesignDocument;
  assumptions: string[];
  usedLlm: boolean;
}

export interface PlanClarify {
  ok: false;
  clarify: string;
}

export type PlanResponse = PlanSuccess | PlanClarify;

export async function requestPlan(
  text: string,
  currentDocument?: DesignDocument,
): Promise<PlanResponse> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, currentDocument }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Planner failed (${res.status})`);
  }
  return (await res.json()) as PlanResponse;
}

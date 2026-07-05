"use client";

import type { DesignDocument } from "@extrusiongpt/core";

/** Save a design: create it, or append a version if it already exists. */
export async function saveDesign(doc: DesignDocument): Promise<void> {
  const create = await fetch("/api/designs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ document: doc }),
  });

  if (create.status === 201) return;

  if (create.status === 503) {
    const body = await create.json().catch(() => ({}));
    throw new Error(body.error ?? "Persistence not configured.");
  }

  // Already exists (or other) -> append a new version.
  const patch = await fetch(`/api/designs/${doc.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ document: doc }),
  });
  if (!patch.ok) {
    const body = await patch.json().catch(() => ({}));
    throw new Error(body.error ?? `Save failed (${patch.status}).`);
  }
}

export async function loadDesign(id: string): Promise<DesignDocument> {
  const res = await fetch(`/api/designs/${id}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Load failed (${res.status}).`);
  }
  const { document } = (await res.json()) as { document: DesignDocument };
  return document;
}

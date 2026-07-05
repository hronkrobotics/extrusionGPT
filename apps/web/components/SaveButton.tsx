"use client";

import { useState } from "react";
import { useStudio } from "@/lib/store";
import { saveDesign } from "@/lib/persistence-client";

export function SaveButton() {
  const document = useStudio((s) => s.document);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSave() {
    setBusy(true);
    setStatus(null);
    try {
      await saveDesign(document);
      const url = `${window.location.origin}${window.location.pathname}?d=${document.id}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      setStatus("Saved - link copied");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(null), 4000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status && <span className="text-[11px] text-slate-500">{status}</span>}
      <button
        onClick={onSave}
        disabled={busy}
        className="rounded-md border border-ink-500 bg-ink-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-accent disabled:opacity-40"
      >
        {busy ? "Saving..." : "Save / Share"}
      </button>
    </div>
  );
}

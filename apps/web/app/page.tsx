"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { WorkbenchIntent } from "@extrusiongpt/core";
import { useStudio } from "@/lib/store";
import { loadDesign } from "@/lib/persistence-client";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ParamPanel } from "@/components/params/ParamPanel";
import { SelectionPanel } from "@/components/params/SelectionPanel";
import { BomTable } from "@/components/bom/BomTable";
import { SaveButton } from "@/components/SaveButton";

// R3F cannot server-render; load the viewer on the client only.
const Viewer = dynamic(() => import("@/components/viewer/Viewer").then((m) => m.Viewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-600">
      Loading 3D viewer...
    </div>
  ),
});

type Tab = "assistant" | "design";

export default function Page() {
  const [tab, setTab] = useState<Tab>("assistant");
  const name = useStudio((s) => s.document.name);
  const rename = useStudio((s) => s.rename);
  const loadDocument = useStudio((s) => s.loadDocument);
  const intent = useStudio((s) => s.document.intent) as WorkbenchIntent;

  // Shareable links: ?d=<id> loads a saved design (when persistence is enabled).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("d");
    if (!id) return;
    loadDesign(id)
      .then((doc) => loadDocument(doc))
      .catch(() => undefined);
  }, [loadDocument]);

  return (
    <div className="flex h-screen flex-col bg-ink-900">
      <header className="flex items-center justify-between border-b border-ink-600 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent">
            <span className="text-lg font-bold">E</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">ExtrusionGPT</span>
              <span className="rounded bg-ink-600 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                Workbench MVP
              </span>
            </div>
            <input
              value={name}
              onChange={(e) => rename(e.target.value)}
              className="w-64 bg-transparent text-xs text-slate-500 focus:text-slate-300 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden gap-6 font-mono text-xs text-slate-500 md:flex">
            <span>
              W <span className="text-slate-300">{intent.width}</span>
            </span>
            <span>
              D <span className="text-slate-300">{intent.depth}</span>
            </span>
            <span>
              H <span className="text-slate-300">{intent.height}</span>
            </span>
            <span>
              <span className="text-slate-300">{intent.profileSize}</span> profile
            </span>
          </div>
          <SaveButton />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: assistant / design controls */}
        <aside className="flex w-80 flex-col border-r border-ink-600 bg-ink-800">
          <div className="flex border-b border-ink-600">
            {(["assistant", "design"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2.5 text-xs font-medium capitalize transition ${
                  tab === t
                    ? "border-b-2 border-accent text-accent-soft"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "assistant" ? (
            <ChatPanel />
          ) : (
            <div className="scroll-slim flex-1 space-y-6 overflow-y-auto p-4">
              <ParamPanel />
              <div className="border-t border-ink-600 pt-4">
                <h3 className="mb-2 text-xs font-medium text-slate-400">Selection</h3>
                <SelectionPanel />
              </div>
            </div>
          )}
        </aside>

        {/* Center: 3D viewer */}
        <main className="relative min-w-0 flex-1 bg-ink-900">
          <Viewer />
          <div className="pointer-events-none absolute left-4 top-4 rounded-md bg-ink-800/70 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">
            Drag to orbit - scroll to zoom - click a part to select
          </div>
        </main>

        {/* Right: BOM */}
        <aside className="w-80 border-l border-ink-600 bg-ink-800">
          <BomTable />
        </aside>
      </div>
    </div>
  );
}

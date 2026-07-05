"use client";

import { useStudio } from "@/lib/store";

const SWAP: Record<string, string> = {
  foot: "caster",
  caster: "foot",
  "corner-bracket": "gusset",
  gusset: "corner-bracket",
};

/**
 * Surfaces the selected part and its non-destructive override actions. Edits
 * here layer on top of the generated graph (keyed by stable node id) without
 * discarding parametric intent.
 */
export function SelectionPanel() {
  const selectedNodeId = useStudio((s) => s.selectedNodeId);
  const nodes = useStudio((s) => s.compiled.graph.nodes);
  const overrides = useStudio((s) => s.document.overrides);
  const applyOverride = useStudio((s) => s.applyOverride);
  const removeOverride = useStudio((s) => s.removeOverride);
  const select = useStudio((s) => s.select);

  if (!selectedNodeId) {
    return (
      <p className="text-xs leading-relaxed text-slate-500">
        Click any part in the 3D view to select it. You can swap or hide individual parts here;
        these are non-destructive overrides that survive parameter changes.
      </p>
    );
  }

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) {
    return <p className="text-xs text-slate-500">Selected part no longer exists.</p>;
  }

  const override = overrides.find((o) => o.nodeId === selectedNodeId);
  const swapTarget = SWAP[node.moduleId];

  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-md border border-ink-500 bg-ink-700 p-3">
        <div className="font-mono text-xs text-accent-soft">{node.id}</div>
        <div className="mt-1 text-slate-300">{node.role}</div>
        <div className="mt-1 text-xs text-slate-500">module: {node.moduleId}</div>
        {override && (
          <div className="mt-1 text-xs text-amber-400/80">overridden</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {swapTarget && (
          <button
            onClick={() => applyOverride({ nodeId: node.id, moduleId: swapTarget })}
            className="rounded-md border border-ink-500 bg-ink-700 px-3 py-1.5 text-xs text-slate-200 hover:border-accent"
          >
            Swap to {swapTarget}
          </button>
        )}
        <button
          onClick={() => applyOverride({ nodeId: node.id, hidden: true })}
          className="rounded-md border border-ink-500 bg-ink-700 px-3 py-1.5 text-xs text-slate-200 hover:border-accent"
        >
          Hide part
        </button>
        {override && (
          <button
            onClick={() => removeOverride(node.id)}
            className="rounded-md border border-ink-500 bg-ink-700 px-3 py-1.5 text-xs text-slate-400 hover:border-red-400 hover:text-red-300"
          >
            Reset
          </button>
        )}
        <button
          onClick={() => select(null)}
          className="rounded-md px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300"
        >
          Deselect
        </button>
      </div>
    </div>
  );
}

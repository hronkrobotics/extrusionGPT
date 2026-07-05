"use client";

import type { Bom } from "@extrusiongpt/core";
import { useStudio } from "@/lib/store";

function toCsv(bom: Bom): string {
  const header = ["qty", "description", "length_mm", "unit_cost", "line_cost", "line_weight_g", "vendor", "sku"];
  const rows = bom.lines.map((l) =>
    [l.qty, l.description, l.lengthMm ?? "", l.unitCost, l.lineCost, l.lineWeight, l.vendor ?? "", l.sku ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BomTable() {
  const bom = useStudio((s) => s.compiled.bom);
  const name = useStudio((s) => s.document.name);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workbench";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-600 px-4 py-3">
        <h2 className="text-sm font-medium text-slate-200">Bill of Materials</h2>
        <div className="flex gap-2">
          <button
            onClick={() => download(`${slug}-bom.csv`, toCsv(bom), "text/csv")}
            className="rounded border border-ink-500 bg-ink-700 px-2.5 py-1 text-xs text-slate-300 hover:border-accent"
          >
            CSV
          </button>
          <button
            onClick={() => download(`${slug}-bom.json`, JSON.stringify(bom, null, 2), "application/json")}
            className="rounded border border-ink-500 bg-ink-700 px-2.5 py-1 text-xs text-slate-300 hover:border-accent"
          >
            JSON
          </button>
        </div>
      </div>

      <div className="scroll-slim flex-1 overflow-y-auto px-4 py-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="w-10 pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Part</th>
              <th className="pb-2 text-right font-medium">Unit</th>
              <th className="pb-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700">
            {bom.lines.map((l) => (
              <tr key={l.key} className="align-top">
                <td className="py-2 font-mono text-slate-300">{l.qty}x</td>
                <td className="py-2 pr-2 text-slate-300">
                  {l.description}
                  <div className="text-[10px] text-slate-600">{l.category}</div>
                </td>
                <td className="py-2 text-right font-mono text-slate-500">${l.unitCost.toFixed(2)}</td>
                <td className="py-2 text-right font-mono text-slate-200">${l.lineCost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {bom.cutList.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-medium text-slate-400">Cut list</h3>
            <ul className="space-y-1 font-mono text-[11px] text-slate-400">
              {bom.cutList.map((c, i) => (
                <li key={i} className="flex justify-between">
                  <span>{c.profile}</span>
                  <span className="text-slate-300">
                    {c.qty} x {c.lengthMm} mm
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-ink-600 px-4 py-3 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Parts</span>
          <span className="font-mono text-slate-200">{bom.totals.partCount}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Weight</span>
          <span className="font-mono text-slate-200">{(bom.totals.weight / 1000).toFixed(2)} kg</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-slate-300">Estimated cost</span>
          <span className="font-mono font-semibold text-accent-soft">
            ${bom.totals.cost.toFixed(2)}
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-600">{bom.disclaimer}</p>
      </div>
    </div>
  );
}

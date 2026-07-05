"use client";

import {
  PROFILE_SIZES,
  WORKBENCH_LIMITS,
  type ProfileSize,
  type WorkbenchIntent,
} from "@extrusiongpt/core";
import { useStudio } from "@/lib/store";

function Slider({
  label,
  value,
  min,
  max,
  step = 10,
  unit = "mm",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-mono text-slate-200">
          {value}
          <span className="text-slate-500"> {unit}</span>
        </span>
      </div>
      <input
        type="range"
        className="range-accent w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function ParamPanel() {
  const intent = useStudio((s) => s.document.intent) as WorkbenchIntent;
  const setIntent = useStudio((s) => s.setIntent);

  return (
    <div className="space-y-5">
      <Slider
        label="Width"
        value={intent.width}
        min={WORKBENCH_LIMITS.width.min}
        max={WORKBENCH_LIMITS.width.max}
        onChange={(width) => setIntent({ width })}
      />
      <Slider
        label="Depth"
        value={intent.depth}
        min={WORKBENCH_LIMITS.depth.min}
        max={WORKBENCH_LIMITS.depth.max}
        onChange={(depth) => setIntent({ depth })}
      />
      <Slider
        label="Height"
        value={intent.height}
        min={WORKBENCH_LIMITS.height.min}
        max={WORKBENCH_LIMITS.height.max}
        onChange={(height) => setIntent({ height })}
      />
      <Slider
        label="Shelves"
        value={intent.shelfCount}
        min={WORKBENCH_LIMITS.shelfCount.min}
        max={WORKBENCH_LIMITS.shelfCount.max}
        step={1}
        unit=""
        onChange={(shelfCount) => setIntent({ shelfCount })}
      />

      <div className="space-y-1.5">
        <span className="text-xs text-slate-400">Profile size</span>
        <div className="grid grid-cols-2 gap-2">
          {PROFILE_SIZES.map((size: ProfileSize) => (
            <button
              key={size}
              onClick={() => setIntent({ profileSize: size })}
              className={`rounded-md border px-3 py-2 text-sm transition ${
                intent.profileSize === size
                  ? "border-accent bg-accent/10 text-accent-soft"
                  : "border-ink-500 bg-ink-700 text-slate-300 hover:border-ink-400"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs text-slate-400">Base</span>
        <div className="grid grid-cols-2 gap-2">
          {(["feet", "casters"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setIntent({ feet: f })}
              className={`rounded-md border px-3 py-2 text-sm capitalize transition ${
                intent.feet === f
                  ? "border-accent bg-accent/10 text-accent-soft"
                  : "border-ink-500 bg-ink-700 text-slate-300 hover:border-ink-400"
              }`}
            >
              {f === "feet" ? "Fixed feet" : "Casters"}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-md border border-ink-500 bg-ink-700 px-3 py-2 text-sm">
        <span className="text-slate-300">Top work surface</span>
        <input
          type="checkbox"
          className="range-accent h-4 w-4"
          checked={intent.topPanel}
          onChange={(e) => setIntent({ topPanel: e.target.checked })}
        />
      </label>
    </div>
  );
}

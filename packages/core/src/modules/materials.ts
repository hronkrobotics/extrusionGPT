/**
 * Material + vendor catalog, kept separate from geometry so cost/weight/SKU
 * can be swapped (Misumi vs 8020 vs OpenBuilds) without touching shapes.
 *
 * All costs are rough ESTIMATES in USD, not live quotes.
 */

export interface ProfileSpec {
  /** Cross-section extent, mm. */
  section: { x: number; y: number };
  /** Mass per unit length, grams / mm. */
  gramsPerMm: number;
  /** Cost per unit length, USD / mm. */
  costPerMm: number;
  vendor: string;
  sku: string;
}

export const PROFILE_SPECS: Record<"2020" | "2040", ProfileSpec> = {
  "2020": {
    section: { x: 20, y: 20 },
    gramsPerMm: 0.45,
    costPerMm: 0.02,
    vendor: "Generic T-slot",
    sku: "TS-2020",
  },
  "2040": {
    section: { x: 20, y: 40 },
    gramsPerMm: 0.88,
    costPerMm: 0.035,
    vendor: "Generic T-slot",
    sku: "TS-2040",
  },
};

/** Aluminum density, g/mm^3. */
export const ALUMINUM_DENSITY = 2.7e-3;
/** MDF / plywood panel density, g/mm^3. */
export const PANEL_DENSITY = 7.5e-4;

export const HARDWARE_SPECS = {
  "corner-bracket": {
    unitCost: 1.5,
    unitWeight: 45,
    vendor: "Generic T-slot",
    sku: "BR-CORNER-20",
    material: "die-cast zinc",
  },
  gusset: {
    unitCost: 3.25,
    unitWeight: 70,
    vendor: "Generic T-slot",
    sku: "BR-GUSSET-20",
    material: "die-cast aluminum",
  },
  tnut: {
    unitCost: 0.22,
    unitWeight: 4,
    vendor: "Generic T-slot",
    sku: "HW-TNUT-M5",
    material: "steel",
  },
  foot: {
    unitCost: 2.1,
    unitWeight: 60,
    vendor: "Generic T-slot",
    sku: "HW-FOOT-M8",
    material: "steel + rubber",
  },
  caster: {
    unitCost: 6.5,
    unitWeight: 240,
    vendor: "Generic T-slot",
    sku: "HW-CASTER-2IN",
    material: "steel + polyurethane",
  },
  "shelf-panel": {
    /** Cost per square millimetre of panel face, USD/mm^2. */
    costPerMm2: 6.5e-5,
    vendor: "Generic panel",
    sku: "PANEL-MDF-18",
    material: "MDF",
  },
} as const;

export const DEFAULT_CURRENCY = "USD";

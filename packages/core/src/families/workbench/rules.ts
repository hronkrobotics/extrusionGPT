import type { WorkbenchIntent } from "../../schema/design-intent.js";
import { PROFILE_SPECS } from "../../modules/materials.js";

/**
 * Deterministic layout decisions for a workbench. Kept separate from node
 * construction so the "design rules" (bracing, shelf placement, foot height)
 * are easy to read, test, and tune.
 */

export const FOOT_HEIGHT = 40;
export const CASTER_HEIGHT = 80;
export const TOP_PANEL_THICKNESS = 18;
export const SHELF_PANEL_THICKNESS = 18;

/** Height above which we add corner gussets to the top frame for rigidity. */
export const GUSSET_HEIGHT_THRESHOLD = 1200;

export interface CornerSpec {
  /** "front-left" etc. front = +Z, back = -Z, left = -X, right = +X. */
  id: string;
  sx: -1 | 1;
  sz: -1 | 1;
}

export const CORNERS: CornerSpec[] = [
  { id: "front-left", sx: -1, sz: 1 },
  { id: "front-right", sx: 1, sz: 1 },
  { id: "back-left", sx: -1, sz: -1 },
  { id: "back-right", sx: 1, sz: -1 },
];

export interface WorkbenchLayout {
  W: number;
  D: number;
  H: number;
  profileModuleId: "extrusion-2020" | "extrusion-2040";
  section: { x: number; y: number };
  s: number;
  insetX: number;
  insetZ: number;
  footModuleId: "foot" | "caster";
  footHeight: number;
  panelThk: number;
  /** Center Y of the top frame rails. */
  railY: number;
  legTopY: number;
  legLen: number;
  legX: number;
  legZ: number;
  /** X-rail (front/back) cut length. */
  railLenX: number;
  /** Z-rail (left/right) cut length. */
  railLenZ: number;
  shelves: { index: number; railY: number }[];
  useGussets: boolean;
}

export function computeLayout(intent: WorkbenchIntent): WorkbenchLayout {
  const { width: W, depth: D, height: H, profileSize } = intent;
  const section = PROFILE_SPECS[profileSize].section;
  const s = section.x;
  const insetX = section.x / 2;
  const insetZ = section.y / 2;

  const footModuleId = intent.feet === "casters" ? "caster" : "foot";
  const footHeight = footModuleId === "caster" ? CASTER_HEIGHT : FOOT_HEIGHT;

  const panelThk = intent.topPanel ? TOP_PANEL_THICKNESS : 0;

  const railY = H - panelThk - s / 2;
  const legTopY = railY - s / 2;
  const legLen = Math.max(50, legTopY - footHeight);

  const legX = W / 2 - insetX;
  const legZ = D / 2 - insetZ;

  const railLenX = W;
  const railLenZ = Math.max(20, D - 2 * section.y);

  const yBottom = footHeight + 80;
  const yTop = legTopY - 80;
  const span = Math.max(0, yTop - yBottom);
  const shelves = Array.from({ length: Math.max(0, intent.shelfCount) }, (_, i) => ({
    index: i + 1,
    railY: yBottom + (span * (i + 1)) / (intent.shelfCount + 1),
  }));

  return {
    W,
    D,
    H,
    profileModuleId: `extrusion-${profileSize}`,
    section,
    s,
    insetX,
    insetZ,
    footModuleId,
    footHeight,
    panelThk,
    railY,
    legTopY,
    legLen,
    legX,
    legZ,
    railLenX,
    railLenZ,
    shelves,
    useGussets: H >= GUSSET_HEIGHT_THRESHOLD,
  };
}

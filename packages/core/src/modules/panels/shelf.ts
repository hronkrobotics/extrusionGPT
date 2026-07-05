import { z } from "zod";
import type { ConnectionPoint, ModuleDefinition } from "../../schema/module.js";
import { IDENTITY_QUAT, vec3 } from "../../schema/geometry.js";
import { HARDWARE_SPECS, PANEL_DENSITY } from "../materials.js";

/**
 * Flat shelf / work-surface panel. Thickness runs along local +Y; the face
 * spans local X (width) x Z (depth).
 */

const ShelfParamsSchema = z.object({
  width: z.number().positive(),
  depth: z.number().positive(),
  thickness: z.number().positive(),
});
type ShelfParams = z.infer<typeof ShelfParamsSchema>;

const spec = HARDWARE_SPECS["shelf-panel"];

export const shelfPanel: ModuleDefinition<ShelfParams> = {
  id: "shelf-panel",
  category: "panel",
  displayName: "Shelf / work-surface panel",
  paramSchema: ShelfParamsSchema,
  dimensions: ({ width, depth, thickness }) => ({ x: width, y: thickness, z: depth }),
  connectionPoints: ({ width, depth }): ConnectionPoint[] => [
    {
      id: "corner-fl",
      frame: { position: vec3(-width / 2, 0, depth / 2), rotation: { ...IDENTITY_QUAT } },
      kind: "face",
      compatibleWith: ["slot", "face"],
    },
    {
      id: "corner-br",
      frame: { position: vec3(width / 2, 0, -depth / 2), rotation: { ...IDENTITY_QUAT } },
      kind: "face",
      compatibleWith: ["slot", "face"],
    },
  ],
  geometry: ({ width, depth, thickness }) => ({
    kind: "box",
    size: { x: width, y: thickness, z: depth },
  }),
  cost: ({ width, depth }) => ({ amount: width * depth * spec.costPerMm2, currency: "USD" }),
  weight: ({ width, depth, thickness }) => width * depth * thickness * PANEL_DENSITY,
  meta: {
    vendor: spec.vendor,
    sku: spec.sku,
    material: spec.material,
    finish: "raw",
    tags: ["panel", "surface"],
  },
};

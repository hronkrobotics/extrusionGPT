import { z } from "zod";
import type { ConnectionPoint, ModuleDefinition } from "../../schema/module.js";
import { identityTransform, vec3 } from "../../schema/geometry.js";
import { PROFILE_SPECS } from "../materials.js";

/**
 * Aluminum T-slot extrusion. Authored along its local +Y axis, centred at the
 * origin, so length runs from y = -length/2 to y = +length/2. The generator
 * orients each cut piece with `alongAxis(...)`.
 */

const ExtrusionParamsSchema = z.object({
  length: z.number().positive(),
});
type ExtrusionParams = z.infer<typeof ExtrusionParamsSchema>;

function makeExtrusionModule(size: "2020" | "2040"): ModuleDefinition<ExtrusionParams> {
  const spec = PROFILE_SPECS[size];
  return {
    id: `extrusion-${size}`,
    category: "profile",
    displayName: `${size} T-slot extrusion`,
    paramSchema: ExtrusionParamsSchema,
    dimensions: ({ length }) => ({ x: spec.section.x, y: length, z: spec.section.y }),
    connectionPoints: ({ length }): ConnectionPoint[] => [
      {
        id: "end-a",
        frame: { position: vec3(0, -length / 2, 0), rotation: identityTransform().rotation },
        kind: "end",
        compatibleWith: ["end", "face"],
      },
      {
        id: "end-b",
        frame: { position: vec3(0, length / 2, 0), rotation: identityTransform().rotation },
        kind: "end",
        compatibleWith: ["end", "face"],
      },
      {
        id: "slot-mid",
        frame: { position: vec3(0, 0, 0), rotation: identityTransform().rotation },
        kind: "slot",
        compatibleWith: ["slot", "face"],
      },
    ],
    geometry: ({ length }) => ({
      kind: "extrusion",
      profile: size,
      section: { x: spec.section.x, y: spec.section.y },
      length,
    }),
    cost: ({ length }) => ({ amount: length * spec.costPerMm, currency: "USD" }),
    weight: ({ length }) => length * spec.gramsPerMm,
    meta: {
      vendor: spec.vendor,
      sku: spec.sku,
      material: "aluminum 6063-T5",
      finish: "clear anodized",
      tags: ["profile", size],
    },
  };
}

export const extrusion2020 = makeExtrusionModule("2020");
export const extrusion2040 = makeExtrusionModule("2040");

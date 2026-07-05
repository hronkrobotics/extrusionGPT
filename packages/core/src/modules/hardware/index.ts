import { z } from "zod";
import type { ConnectionPoint, ModuleDefinition } from "../../schema/module.js";
import { IDENTITY_QUAT, vec3 } from "../../schema/geometry.js";
import { HARDWARE_SPECS } from "../materials.js";

/**
 * Discrete hardware modules. Geometry is deliberately simplified (boxes /
 * cylinders) for the MVP viewer; true fastener geometry is a future refinement.
 */

const EmptyParams = z.object({});
type EmptyParams = z.infer<typeof EmptyParams>;

const faceCp = (id: string, position = vec3()): ConnectionPoint => ({
  id,
  frame: { position, rotation: { ...IDENTITY_QUAT } },
  kind: "face",
  compatibleWith: ["slot", "face", "end"],
});

export const cornerBracket: ModuleDefinition<EmptyParams> = {
  id: "corner-bracket",
  category: "bracket",
  displayName: "Corner bracket (90 degrees)",
  paramSchema: EmptyParams,
  dimensions: () => ({ x: 20, y: 20, z: 20 }),
  connectionPoints: () => [faceCp("face-a", vec3(0, -10, 0)), faceCp("face-b", vec3(-10, 0, 0))],
  geometry: () => ({ kind: "box", size: { x: 20, y: 20, z: 20 } }),
  cost: () => ({ amount: HARDWARE_SPECS["corner-bracket"].unitCost, currency: "USD" }),
  weight: () => HARDWARE_SPECS["corner-bracket"].unitWeight,
  meta: {
    vendor: HARDWARE_SPECS["corner-bracket"].vendor,
    sku: HARDWARE_SPECS["corner-bracket"].sku,
    material: HARDWARE_SPECS["corner-bracket"].material,
    tags: ["bracket", "joinery"],
  },
};

export const gusset: ModuleDefinition<EmptyParams> = {
  id: "gusset",
  category: "gusset",
  displayName: "Gusset bracing plate",
  paramSchema: EmptyParams,
  dimensions: () => ({ x: 40, y: 40, z: 6 }),
  connectionPoints: () => [faceCp("face-a", vec3(0, -20, 0)), faceCp("face-b", vec3(-20, 0, 0))],
  geometry: () => ({ kind: "box", size: { x: 40, y: 40, z: 6 } }),
  cost: () => ({ amount: HARDWARE_SPECS.gusset.unitCost, currency: "USD" }),
  weight: () => HARDWARE_SPECS.gusset.unitWeight,
  meta: {
    vendor: HARDWARE_SPECS.gusset.vendor,
    sku: HARDWARE_SPECS.gusset.sku,
    material: HARDWARE_SPECS.gusset.material,
    tags: ["bracing"],
  },
};

export const tnut: ModuleDefinition<EmptyParams> = {
  id: "tnut",
  category: "tnut",
  displayName: "T-nut (M5)",
  paramSchema: EmptyParams,
  dimensions: () => ({ x: 10, y: 6, z: 6 }),
  connectionPoints: () => [faceCp("face")],
  geometry: () => ({ kind: "box", size: { x: 10, y: 6, z: 6 } }),
  cost: () => ({ amount: HARDWARE_SPECS.tnut.unitCost, currency: "USD" }),
  weight: () => HARDWARE_SPECS.tnut.unitWeight,
  meta: {
    vendor: HARDWARE_SPECS.tnut.vendor,
    sku: HARDWARE_SPECS.tnut.sku,
    material: HARDWARE_SPECS.tnut.material,
    tags: ["fastener"],
  },
};

export const foot: ModuleDefinition<EmptyParams> = {
  id: "foot",
  category: "foot",
  displayName: "Leveling foot",
  paramSchema: EmptyParams,
  dimensions: () => ({ x: 40, y: 40, z: 40 }),
  connectionPoints: () => [faceCp("mount", vec3(0, 20, 0))],
  geometry: () => ({ kind: "cylinder", radius: 20, height: 40 }),
  cost: () => ({ amount: HARDWARE_SPECS.foot.unitCost, currency: "USD" }),
  weight: () => HARDWARE_SPECS.foot.unitWeight,
  meta: {
    vendor: HARDWARE_SPECS.foot.vendor,
    sku: HARDWARE_SPECS.foot.sku,
    material: HARDWARE_SPECS.foot.material,
    tags: ["foot", "fixed"],
  },
};

export const caster: ModuleDefinition<EmptyParams> = {
  id: "caster",
  category: "caster",
  displayName: "Swivel caster (2 in)",
  paramSchema: EmptyParams,
  dimensions: () => ({ x: 50, y: 80, z: 50 }),
  connectionPoints: () => [faceCp("mount", vec3(0, 40, 0))],
  geometry: () => ({ kind: "cylinder", radius: 25, height: 80 }),
  cost: () => ({ amount: HARDWARE_SPECS.caster.unitCost, currency: "USD" }),
  weight: () => HARDWARE_SPECS.caster.unitWeight,
  meta: {
    vendor: HARDWARE_SPECS.caster.vendor,
    sku: HARDWARE_SPECS.caster.sku,
    material: HARDWARE_SPECS.caster.material,
    tags: ["caster", "mobile"],
  },
};

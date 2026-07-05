import type { AssemblyGraph, PartNode } from "../schema/assembly-graph.js";
import type { GeometryDescriptor, ModuleCategory } from "../schema/module.js";
import type { BBox, Transform, Vec3 } from "../schema/geometry.js";
import { applyQuat } from "../schema/geometry.js";
import { getModule } from "../modules/registry.js";

/**
 * Geometry engine: AssemblyGraph -> instancing-friendly payload.
 *
 * Output is plain data (descriptors + transforms), never three.js objects, so
 * it stays isomorphic and testable. The viewer adapts it to R3F.
 */

export interface MaterialSpec {
  color: string;
  metalness: number;
  roughness: number;
}

export interface InstancePlacement {
  nodeId: string;
  role: string;
  transform: Transform;
}

export interface InstanceGroup {
  /** Stable key: moduleId + geometry signature, so identical parts batch. */
  key: string;
  moduleId: string;
  category: ModuleCategory;
  descriptor: GeometryDescriptor;
  material: MaterialSpec;
  instances: InstancePlacement[];
}

export interface GeometryPayload {
  groups: InstanceGroup[];
  bounds: { min: Vec3; max: Vec3; size: BBox; center: Vec3 };
}

const MATERIALS: Record<ModuleCategory, MaterialSpec> = {
  profile: { color: "#b8bcc2", metalness: 0.85, roughness: 0.35 },
  bracket: { color: "#3f4247", metalness: 0.6, roughness: 0.5 },
  gusset: { color: "#4a4d52", metalness: 0.6, roughness: 0.5 },
  tnut: { color: "#8a8d92", metalness: 0.9, roughness: 0.3 },
  foot: { color: "#222327", metalness: 0.2, roughness: 0.8 },
  caster: { color: "#2a2b2f", metalness: 0.3, roughness: 0.7 },
  panel: { color: "#c9a06a", metalness: 0.05, roughness: 0.9 },
};

function geometrySignature(desc: GeometryDescriptor): string {
  switch (desc.kind) {
    case "extrusion":
      return `extrusion:${desc.profile}:${desc.length.toFixed(3)}`;
    case "box":
      return `box:${desc.size.x}x${desc.size.y}x${desc.size.z}`;
    case "cylinder":
      return `cyl:${desc.radius}x${desc.height}`;
  }
}

/** Local half-extents of a descriptor, used for a cheap bounds estimate. */
function halfExtents(desc: GeometryDescriptor): Vec3 {
  switch (desc.kind) {
    case "extrusion":
      return { x: desc.section.x / 2, y: desc.length / 2, z: desc.section.y / 2 };
    case "box":
      return { x: desc.size.x / 2, y: desc.size.y / 2, z: desc.size.z / 2 };
    case "cylinder":
      return { x: desc.radius, y: desc.height / 2, z: desc.radius };
  }
}

function expandBounds(node: PartNode, desc: GeometryDescriptor, min: Vec3, max: Vec3): void {
  const h = halfExtents(desc);
  const corners = [-1, 1].flatMap((sx) =>
    [-1, 1].flatMap((sy) => [-1, 1].map((sz) => ({ x: sx * h.x, y: sy * h.y, z: sz * h.z }))),
  );
  for (const c of corners) {
    const r = applyQuat(node.transform.rotation, c);
    const wx = node.transform.position.x + r.x;
    const wy = node.transform.position.y + r.y;
    const wz = node.transform.position.z + r.z;
    min.x = Math.min(min.x, wx);
    min.y = Math.min(min.y, wy);
    min.z = Math.min(min.z, wz);
    max.x = Math.max(max.x, wx);
    max.y = Math.max(max.y, wy);
    max.z = Math.max(max.z, wz);
  }
}

export function buildGeometryPayload(graph: AssemblyGraph): GeometryPayload {
  const groups = new Map<string, InstanceGroup>();
  const min: Vec3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: Vec3 = { x: -Infinity, y: -Infinity, z: -Infinity };

  for (const node of graph.nodes) {
    if (node.meta.tags.includes("hidden")) continue;
    const mod = getModule(node.moduleId);
    const desc = mod.geometry(node.params as never);
    const key = `${node.moduleId}#${geometrySignature(desc)}`;

    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        moduleId: node.moduleId,
        category: mod.category,
        descriptor: desc,
        material: MATERIALS[mod.category],
        instances: [],
      };
      groups.set(key, group);
    }
    group.instances.push({ nodeId: node.id, role: node.role, transform: node.transform });
    expandBounds(node, desc, min, max);
  }

  const hasNodes = graph.nodes.length > 0;
  const safeMin = hasNodes ? min : { x: 0, y: 0, z: 0 };
  const safeMax = hasNodes ? max : { x: 0, y: 0, z: 0 };

  return {
    groups: [...groups.values()],
    bounds: {
      min: safeMin,
      max: safeMax,
      size: {
        x: safeMax.x - safeMin.x,
        y: safeMax.y - safeMin.y,
        z: safeMax.z - safeMin.z,
      },
      center: {
        x: (safeMin.x + safeMax.x) / 2,
        y: (safeMin.y + safeMax.y) / 2,
        z: (safeMin.z + safeMax.z) / 2,
      },
    },
  };
}

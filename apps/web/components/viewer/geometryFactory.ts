import * as THREE from "three";
import type { GeometryDescriptor } from "@extrusiongpt/core";

/**
 * Turns the engine's plain-data GeometryDescriptors into Three.js geometry.
 *
 * Extrusions are authored along local +Y (matching the core convention): a
 * T-slot cross-section is built in the XY plane, extruded along Z, then rotated
 * so its length runs along Y and centered at the origin.
 */

const SLOT_OPENING = 11; // mm, visible slot mouth width
const SLOT_DEPTH = 4; // mm, how far the slot cuts inward

function cellCenters(count: number, size: number): number[] {
  return Array.from({ length: count }, (_, i) => -size / 2 + (i + 0.5) * (size / count));
}

/** Build a recognizable T-slot profile outline with a center bore. */
function tSlotShape(w: number, h: number): THREE.Shape {
  const hx = w / 2;
  const hy = h / 2;
  const nx = Math.max(1, Math.round(w / 20));
  const ny = Math.max(1, Math.round(h / 20));
  const cx = cellCenters(nx, w);
  const cy = cellCenters(ny, h);
  const sw = SLOT_OPENING / 2;
  const sd = SLOT_DEPTH;

  const pts: THREE.Vector2[] = [];
  const v = (x: number, y: number) => pts.push(new THREE.Vector2(x, y));

  v(-hx, -hy);
  for (const c of cx) {
    v(c - sw, -hy);
    v(c - sw, -hy + sd);
    v(c + sw, -hy + sd);
    v(c + sw, -hy);
  }
  v(hx, -hy);
  for (const c of cy) {
    v(hx, c - sw);
    v(hx - sd, c - sw);
    v(hx - sd, c + sw);
    v(hx, c + sw);
  }
  v(hx, hy);
  for (const c of [...cx].reverse()) {
    v(c + sw, hy);
    v(c + sw, hy - sd);
    v(c - sw, hy - sd);
    v(c - sw, hy);
  }
  v(-hx, hy);
  for (const c of [...cy].reverse()) {
    v(-hx, c + sw);
    v(-hx + sd, c + sw);
    v(-hx + sd, c - sw);
    v(-hx, c - sw);
  }

  const shape = new THREE.Shape(pts);
  shape.autoClose = true;

  // Center bore(s): one per 20mm cell along the long axis.
  const bores = Math.max(nx, ny);
  const boreCenters = w >= h ? cellCenters(bores, w).map((c) => [c, 0]) : cellCenters(bores, h).map((c) => [0, c]);
  for (const [bx, by] of boreCenters) {
    const hole = new THREE.Path();
    hole.absarc(bx as number, by as number, 2.6, 0, Math.PI * 2, false);
    shape.holes.push(hole);
  }
  return shape;
}

export function buildGeometry(descriptor: GeometryDescriptor): THREE.BufferGeometry {
  switch (descriptor.kind) {
    case "extrusion": {
      const shape = tSlotShape(descriptor.section.x, descriptor.section.y);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: descriptor.length,
        bevelEnabled: false,
        steps: 1,
      });
      geo.translate(0, 0, -descriptor.length / 2);
      geo.rotateX(-Math.PI / 2); // extrude axis (Z) -> world-local +Y
      geo.computeVertexNormals();
      return geo;
    }
    case "box":
      return new THREE.BoxGeometry(descriptor.size.x, descriptor.size.y, descriptor.size.z);
    case "cylinder":
      return new THREE.CylinderGeometry(
        descriptor.radius,
        descriptor.radius,
        descriptor.height,
        24,
      );
  }
}

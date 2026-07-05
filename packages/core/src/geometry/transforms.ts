import {
  applyQuat,
  multiplyQuat,
  type Quat,
  type Transform,
  type Vec3,
} from "../schema/geometry.js";

/**
 * Frame math used to compose part placements. The MVP generator emits absolute
 * world transforms directly, but these helpers keep the option open for a
 * connection-driven solver later.
 */

export function composeTransform(parent: Transform, local: Transform): Transform {
  const rotation = multiplyQuat(parent.rotation, local.rotation);
  const rotatedLocalPos = applyQuat(parent.rotation, local.position);
  return {
    position: {
      x: parent.position.x + rotatedLocalPos.x,
      y: parent.position.y + rotatedLocalPos.y,
      z: parent.position.z + rotatedLocalPos.z,
    },
    rotation,
  };
}

/** Transform a local point into world space using a part transform. */
export function localToWorld(t: Transform, local: Vec3): Vec3 {
  const r = applyQuat(t.rotation, local);
  return {
    x: t.position.x + r.x,
    y: t.position.y + r.y,
    z: t.position.z + r.z,
  };
}

export function quatEquals(a: Quat, b: Quat, eps = 1e-6): boolean {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.z - b.z) < eps &&
    Math.abs(a.w - b.w) < eps
  );
}

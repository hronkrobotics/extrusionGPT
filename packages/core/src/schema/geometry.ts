import { z } from "zod";

/**
 * Geometry primitives shared across the whole engine.
 *
 * Convention (right-handed, millimetres):
 *   +X = width  (left  -> right)
 *   +Y = up     (floor -> ceiling)
 *   +Z = depth  (back  -> front)
 *
 * Rotations are stored as quaternions so orientation composition is
 * unambiguous and interpolatable.
 */

export const Vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});
export type Vec3 = z.infer<typeof Vec3Schema>;

export const QuatSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  w: z.number(),
});
export type Quat = z.infer<typeof QuatSchema>;

export const TransformSchema = z.object({
  position: Vec3Schema,
  rotation: QuatSchema,
});
export type Transform = z.infer<typeof TransformSchema>;

/** Axis-aligned bounding box size (extent along each axis, mm). */
export const BBoxSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  z: z.number().nonnegative(),
});
export type BBox = z.infer<typeof BBoxSchema>;

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const IDENTITY_QUAT: Quat = { x: 0, y: 0, z: 0, w: 1 };

export const identityTransform = (): Transform => ({
  position: vec3(),
  rotation: { ...IDENTITY_QUAT },
});

export function quatFromAxisAngle(axis: Vec3, angleRad: number): Quat {
  const half = angleRad / 2;
  const s = Math.sin(half);
  const len = Math.hypot(axis.x, axis.y, axis.z) || 1;
  return {
    x: (axis.x / len) * s,
    y: (axis.y / len) * s,
    z: (axis.z / len) * s,
    w: Math.cos(half),
  };
}

const HALF_PI = Math.PI / 2;

/**
 * Quaternion that rotates a part authored along its local +Y axis so that its
 * length runs along the requested world axis. Extrusions are authored centred
 * at the origin extending along local +Y, so this is how we orient legs
 * (along "y"), width rails (along "x"), and depth rails (along "z").
 */
export function alongAxis(axis: "x" | "y" | "z"): Quat {
  switch (axis) {
    case "y":
      return { ...IDENTITY_QUAT };
    case "x":
      return quatFromAxisAngle(vec3(0, 0, 1), -HALF_PI);
    case "z":
      return quatFromAxisAngle(vec3(1, 0, 0), HALF_PI);
  }
}

/** Rotate a vector by a quaternion (q * v * q^-1). */
export function applyQuat(q: Quat, v: Vec3): Vec3 {
  const { x, y, z } = v;
  const ix = q.w * x + q.y * z - q.z * y;
  const iy = q.w * y + q.z * x - q.x * z;
  const iz = q.w * z + q.x * y - q.y * x;
  const iw = -q.x * x - q.y * y - q.z * z;
  return {
    x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
    y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
    z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x,
  };
}

export function multiplyQuat(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

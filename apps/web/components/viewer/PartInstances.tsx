"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { InstanceGroup } from "@extrusiongpt/core";
import { buildGeometry } from "./geometryFactory";

const SELECTED_COLOR = new THREE.Color("#5ea9ff");

/**
 * One InstancedMesh per (module + geometry) group. Repeated identical parts
 * (four legs, N shelf brackets) share a single draw call. Clicking maps the
 * instanceId back to the stable nodeId for selection.
 */
export function PartInstances({
  group,
  selectedNodeId,
  onSelect,
}: {
  group: InstanceGroup;
  selectedNodeId: string | null;
  onSelect: (nodeId: string | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => buildGeometry(group.descriptor), [group.key]);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(group.material.color),
        metalness: group.material.metalness,
        roughness: group.material.roughness,
      }),
    [group.key, group.material.color, group.material.metalness, group.material.roughness],
  );

  const baseColor = useMemo(() => new THREE.Color(group.material.color), [group.material.color]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    group.instances.forEach((inst, i) => {
      const { position: p, rotation: r } = inst.transform;
      position.set(p.x, p.y, p.z);
      quaternion.set(r.x, r.y, r.z, r.w);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, inst.nodeId === selectedNodeId ? SELECTED_COLOR : baseColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [group, selectedNodeId, baseColor]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, group.instances.length]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        if (e.instanceId == null) return;
        const inst = group.instances[e.instanceId];
        if (inst) onSelect(inst.nodeId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    />
  );
}

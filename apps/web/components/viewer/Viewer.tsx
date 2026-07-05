"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, GizmoHelper, GizmoViewport, Grid, OrbitControls } from "@react-three/drei";
import { useStudio } from "@/lib/store";
import { PartInstances } from "./PartInstances";

const MM_TO_M = 0.001;

export function Viewer() {
  const geometry = useStudio((s) => s.compiled.geometry);
  const selectedNodeId = useStudio((s) => s.selectedNodeId);
  const select = useStudio((s) => s.select);

  const { center, size } = geometry.bounds;
  const targetY = (size.y / 2) * MM_TO_M;
  const span = Math.max(size.x, size.y, size.z) * MM_TO_M || 1;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [span * 1.4, span * 1.1, span * 1.6], fov: 42, near: 0.01, far: 100 }}
      onPointerMissed={() => select(null)}
      className="h-full w-full"
    >
      <color attach="background" args={["#0b0d10"]} />
      <hemisphereLight intensity={0.5} groundColor="#0b0d10" color="#dfe8ff" />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.4} />

      {/* Model: convert mm -> m and recenter on the footprint. */}
      <group scale={MM_TO_M} position={[0, 0, 0]}>
        <group position={[-center.x, 0, -center.z]}>
          {geometry.groups.map((group) => (
            <PartInstances
              key={group.key}
              group={group}
              selectedNodeId={selectedNodeId}
              onSelect={select}
            />
          ))}
        </group>
      </group>

      <Grid
        args={[20, 20]}
        cellSize={0.1}
        cellThickness={0.6}
        cellColor="#1a1e25"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#2f3641"
        fadeDistance={18}
        fadeStrength={1.5}
        infiniteGrid
        position={[0, 0, 0]}
      />

      <Environment preset="city" />
      <OrbitControls
        makeDefault
        target={[0, targetY, 0]}
        enableDamping
        minDistance={0.3}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.05}
      />
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport axisColors={["#e06c75", "#98c379", "#5ea9ff"]} labelColor="#0b0d10" />
      </GizmoHelper>
    </Canvas>
  );
}

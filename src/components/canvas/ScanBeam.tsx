"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { getScrollState } from "@/lib/scrollStore";

export function ScanBeam() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, delta) => {
    const { progress } = getScrollState();
    const { scan, scatter } = sampleBrainMotion(progress);
    if (!mesh.current || !mat.current) return;

    const z = THREE.MathUtils.lerp(0.95, -0.95, scan);
    mesh.current.position.set(0.45, 0.05, z);
    mesh.current.rotation.y = 0.15;
    const visible = scan > 0.02 && scatter < 0.55;
    mat.current.opacity = THREE.MathUtils.damp(
      mat.current.opacity,
      visible ? 0.35 : 0,
      6,
      delta
    );
  });

  return (
    <mesh ref={mesh} rotation={[0, 0, 0]}>
      <planeGeometry args={[2.2, 1.8]} />
      <meshBasicMaterial
        ref={mat}
        color="#67e8f9"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

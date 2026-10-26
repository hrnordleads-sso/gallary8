"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { getScrollState } from "@/lib/scrollStore";

/** Soft cyan volume behind the point cloud — Neural Monitor holographic aura. */
export function BrainAura() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const { scatter, glow } = sampleBrainMotion(progress);
    if (!mesh.current || !mat.current) return;
    const spin = reducedMotion ? 0.01 : 0.028;
    mesh.current.rotation.y += delta * spin;
    // Soft breath so the aura never feels static
    const breath = 1 + Math.sin(state.clock.elapsedTime * 0.55) * 0.04;
    mesh.current.scale.set(2.05 * breath, 1.65 * breath, 1.25 * breath);
    const target =
      THREE.MathUtils.lerp(0.16, 0.04, scatter) * (0.85 + glow * 0.14);
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, target, 2.6, delta);
  });

  return (
    <mesh ref={mesh} position={[0.62, 0.02, -0.4]}>
      <sphereGeometry args={[1, 32, 24]} />
      <meshBasicMaterial
        ref={mat}
        color="#40e0d0"
        transparent
        opacity={0.14}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

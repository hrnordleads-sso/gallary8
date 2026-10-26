"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { getScrollIdle, getScrollState } from "@/lib/scrollStore";

/** Soft cyan volume behind the point cloud — Neural Monitor holographic aura. */
export function BrainAura() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const { scatter, glow } = sampleBrainMotion(progress);
    const idle = getScrollIdle();
    if (!mesh.current || !mat.current) return;
    const spin = reducedMotion ? 0.008 : 0.022 + idle * 0.01;
    mesh.current.rotation.y += delta * spin;
    const breath =
      1 +
      Math.sin(state.clock.elapsedTime * 0.48) * 0.035 +
      Math.sin(state.clock.elapsedTime * 0.7) * 0.02 * idle;
    // Larger, flatter soft volume — video halo, not a hard ball
    mesh.current.scale.set(2.35 * breath, 1.85 * breath, 1.4 * breath);
    const target =
      THREE.MathUtils.lerp(0.11, 0.03, scatter) * (0.8 + glow * 0.12 + idle * 0.04);
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, target, 2.4, delta);
  });

  return (
    <mesh ref={mesh} position={[0.7, 0.02, -0.45]}>
      <sphereGeometry args={[1, 28, 20]} />
      <meshBasicMaterial
        ref={mat}
        color="#22d3ee"
        transparent
        opacity={0.1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

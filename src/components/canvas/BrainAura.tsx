"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { BRAIN_ORIGIN } from "@/lib/brainOrigin";
import { getScrollIdle, getScrollState } from "@/lib/scrollStore";

/** Barely-there elliptical wash — bloom does the glow, not a hard sphere halo. */
export function BrainAura() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const { scatter, glow } = sampleBrainMotion(progress);
    const idle = getScrollIdle();
    if (!mesh.current || !mat.current) return;
    const spin = reducedMotion ? 0.004 : 0.012 + idle * 0.006;
    mesh.current.rotation.y += delta * spin;
    const breath =
      1 +
      Math.sin(state.clock.elapsedTime * 0.48) * 0.03 +
      Math.sin(state.clock.elapsedTime * 0.7) * 0.015 * idle;
    mesh.current.scale.set(1.35 * breath, 1.5 * breath, 1.2 * breath);
    const target =
      THREE.MathUtils.lerp(0.022, 0.0, scatter) * (0.7 + glow * 0.08 + idle * 0.02);
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, target, 2.8, delta);
  });

  return (
    <mesh ref={mesh} position={[BRAIN_ORIGIN.x, BRAIN_ORIGIN.y, -0.4]}>
      <sphereGeometry args={[0.95, 22, 16]} />
      <meshBasicMaterial
        ref={mat}
        color="#22d3ee"
        transparent
        opacity={0.02}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

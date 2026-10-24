"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getScrollState } from "@/lib/scrollStore";

const COUNT = 1800;

export function Starfield() {
  const points = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i += 1) {
      const r = 8 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.4 + Math.random() * 1.6;
    }
    return { positions, sizes };
  }, []);

  useFrame((_, delta) => {
    if (!points.current) return;
    const { progress, reducedMotion } = getScrollState();
    const speed = reducedMotion ? 0.01 : 0.04 + progress * 0.06;
    points.current.rotation.y += delta * speed;
    points.current.rotation.x = Math.sin(progress * Math.PI) * 0.08;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#9ec9ff"
        transparent
        opacity={0.55}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

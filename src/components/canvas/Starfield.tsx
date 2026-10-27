"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { starfieldScale } from "@/lib/deviceProfile";
import { getScrollState } from "@/lib/scrollStore";

const FAR = 5200;
const NEAR = 900;

/** Soft navy starfield — sparse far dust + a few nearer glints (video look). */
export function Starfield() {
  const farRef = useRef<THREE.Points>(null);
  const nearRef = useRef<THREE.Points>(null);

  const far = useMemo(() => {
    const s = starfieldScale();
    return scatter(Math.floor(FAR * s), 8, 36, 0.7);
  }, []);
  const near = useMemo(() => {
    const s = starfieldScale();
    return scatter(Math.floor(NEAR * s), 4, 14, 0.55);
  }, []);

  useFrame((_, delta) => {
    const { progress, reducedMotion } = getScrollState();
    // Drift accelerates into Release constellation
    const releaseBoost = Math.max(0, (progress - 0.85) / 0.15);
    const speed = reducedMotion
      ? 0.005
      : 0.016 + progress * 0.028 + releaseBoost * 0.04;
    if (farRef.current) {
      farRef.current.rotation.y += delta * speed;
      farRef.current.rotation.x = Math.sin(progress * Math.PI) * 0.035;
    }
    if (nearRef.current) {
      nearRef.current.rotation.y += delta * speed * 1.4;
    }
  });

  return (
    <group>
      <points ref={farRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[far, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          color="#b8d9f5"
          transparent
          opacity={0.62}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={nearRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[near, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color="#e0f2fe"
          transparent
          opacity={0.48}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function scatter(count: number, rMin: number, rSpan: number, yScale: number) {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = rMin + Math.random() * rSpan;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * yScale;
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}

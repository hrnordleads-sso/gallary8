"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { getScrollState } from "@/lib/scrollStore";

export function ScanBeam() {
  const group = useRef<THREE.Group>(null);
  const planeMat = useRef<THREE.MeshBasicMaterial>(null);
  const lineMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, delta) => {
    const { progress } = getScrollState();
    const { scan, scatter } = sampleBrainMotion(progress);
    if (!group.current || !planeMat.current || !lineMat.current) return;

    // Sweep front→back through the cerebrum
    const z = THREE.MathUtils.lerp(0.72, -0.72, scan);
    group.current.position.set(0.55, 0.02, z);
    group.current.rotation.set(0, 0.12, 0);

    const visible = scan > 0.02 && scatter < 0.5;
    const target = visible ? 0.55 : 0;
    planeMat.current.opacity = THREE.MathUtils.damp(
      planeMat.current.opacity,
      target * 0.28,
      7,
      delta
    );
    lineMat.current.opacity = THREE.MathUtils.damp(
      lineMat.current.opacity,
      target,
      7,
      delta
    );
  });

  return (
    <group ref={group}>
      <mesh>
        <planeGeometry args={[2.4, 1.7]} />
        <meshBasicMaterial
          ref={planeMat}
          color="#a5f3fc"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.45, 0.018]} />
        <meshBasicMaterial
          ref={lineMat}
          color="#ecfeff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

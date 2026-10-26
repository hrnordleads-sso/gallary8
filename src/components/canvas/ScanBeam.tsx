"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { getScrollState } from "@/lib/scrollStore";

/**
 * Mapping sweep:
 * - Arrival: slow hold scan
 * - Cortex: tighter surface graze across the folded sheet
 * - Later: story sweep
 */
export function ScanBeam() {
  const group = useRef<THREE.Group>(null);
  const planeMat = useRef<THREE.MeshBasicMaterial>(null);
  const lineMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const { progress } = getScrollState();
    const { scan, scatter } = sampleBrainMotion(progress);
    if (!group.current || !planeMat.current || !lineMat.current) return;

    const arrival = progress < 0.14;
    const cortex = progress >= 0.14 && progress < 0.3;
    const signals = progress >= 0.28 && progress < 0.44;
    const links = progress >= 0.42 && progress < 0.56;
    const vision = progress >= 0.56 && progress < 0.7;
    const balance = progress >= 0.7 && progress < 0.84;

    let z: number;
    let x = 0.58;
    let y = 0.02;
    if (arrival) {
      z = 0.35 + Math.sin(state.clock.elapsedTime * 0.55) * 0.38;
    } else if (cortex) {
      // Graze across cortical ridges
      const t = (progress - 0.14) / 0.16;
      z = THREE.MathUtils.lerp(0.55, -0.25, t);
      y = 0.12 + Math.sin(state.clock.elapsedTime * 1.1) * 0.04;
      x = 0.48;
    } else if (links) {
      // Region pass across temporal flank
      const t = (progress - 0.42) / 0.14;
      z = THREE.MathUtils.lerp(0.4, -0.35, t);
      y = -0.05 + Math.sin(state.clock.elapsedTime * 0.9) * 0.03;
      x = 0.35;
    } else if (vision) {
      // Soft sweep across occipital pole
      const t = (progress - 0.56) / 0.14;
      z = THREE.MathUtils.lerp(0.25, -0.4, t);
      y = 0.02 + Math.sin(state.clock.elapsedTime * 0.7) * 0.03;
      x = 0.55;
    } else if (balance) {
      // Lock pass across cerebellum
      const t = (progress - 0.7) / 0.14;
      z = THREE.MathUtils.lerp(0.15, -0.2, t);
      y = -0.35 + Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
      x = 0.5;
    } else {
      z = THREE.MathUtils.lerp(0.72, -0.72, scan);
    }

    group.current.position.set(x, y, z);
    group.current.rotation.set(
      cortex || links || vision || balance ? 0.08 : 0,
      cortex ? 0.18 : links ? 0.55 : vision ? 0.05 : balance ? 0.12 : 0.1,
      links ? 0.12 : balance ? -0.08 : 0
    );

    // Signals uses SignalThreads; Release dissolves the mapping beam
    const visible =
      !signals &&
      scatter < 0.2 &&
      (arrival || cortex || links || vision || balance || scan > 0.02);
    const strength = arrival
      ? 0.7
      : cortex
        ? 0.75
        : links
          ? 0.55
          : vision
            ? 0.5
            : balance
              ? 0.48
              : 0.55;
    const target = visible ? strength : 0;
    // Arrival wash stays faint so headline/body stay readable (ref: thin scan, not a slab)
    planeMat.current.opacity = THREE.MathUtils.damp(
      planeMat.current.opacity,
      target *
        (arrival
          ? 0.055
          : cortex
            ? 0.07
            : links
              ? 0.03
              : vision
                ? 0.04
                : balance
                  ? 0.035
                  : 0.2),
      7,
      delta
    );
    lineMat.current.opacity = THREE.MathUtils.damp(
      lineMat.current.opacity,
      target *
        (cortex ? 0.85 : links ? 0.45 : vision ? 0.55 : balance ? 0.5 : 0.9),
      7,
      delta
    );
  });

  return (
    <group ref={group}>
      <mesh>
        <planeGeometry args={[2.35, 1.65]} />
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
        <planeGeometry args={[2.4, 0.016]} />
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

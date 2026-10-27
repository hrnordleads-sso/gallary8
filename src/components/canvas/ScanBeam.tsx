"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBrainMotion } from "@/lib/brainGeometry";
import { getBrainLayout } from "@/lib/brainOrigin";
import { getScrollState } from "@/lib/scrollStore";

/**
 * Mapping sweep — P0: thin laser line + faintest wash (video, not a teal slab).
 * - Arrival: slow hold scan across specimen
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
    // Bias toward brain mass (right-of-center) so wash rarely covers copy
    let x = 0.55;
    let y = 0.02;
    if (arrival) {
      z = 0.32 + Math.sin(state.clock.elapsedTime * 0.5) * 0.34;
      x = getBrainLayout().origin.x;
    } else if (cortex) {
      const t = (progress - 0.14) / 0.16;
      z = THREE.MathUtils.lerp(0.55, -0.25, t);
      y = 0.12 + Math.sin(state.clock.elapsedTime * 1.1) * 0.04;
      x = 0.52;
    } else if (links) {
      const t = (progress - 0.42) / 0.14;
      z = THREE.MathUtils.lerp(0.4, -0.35, t);
      y = -0.05 + Math.sin(state.clock.elapsedTime * 0.9) * 0.03;
      x = 0.38;
    } else if (vision) {
      const t = (progress - 0.56) / 0.14;
      z = THREE.MathUtils.lerp(0.25, -0.4, t);
      y = 0.02 + Math.sin(state.clock.elapsedTime * 0.7) * 0.03;
      x = 0.58;
    } else if (balance) {
      const t = (progress - 0.7) / 0.14;
      z = THREE.MathUtils.lerp(0.15, -0.2, t);
      y = -0.35 + Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
      x = 0.52;
    } else {
      z = THREE.MathUtils.lerp(0.72, -0.72, scan);
    }

    group.current.position.set(x, y, z);
    group.current.rotation.set(
      cortex || links || vision || balance ? 0.08 : 0,
      cortex ? 0.18 : links ? 0.55 : vision ? 0.05 : balance ? 0.12 : 0.08,
      links ? 0.12 : balance ? -0.08 : 0
    );

    const visible =
      !signals &&
      scatter < 0.2 &&
      (arrival || cortex || links || vision || balance || scan > 0.02);
    // Arrival scan is a thin laser in the video — keep wash faint
    const strength = arrival
      ? 0.16
      : cortex
        ? 0.62
        : links
          ? 0.5
          : vision
            ? 0.48
            : balance
              ? 0.45
              : 0.5;
    const target = visible ? strength : 0;

    planeMat.current.opacity = THREE.MathUtils.damp(
      planeMat.current.opacity,
      target *
        (arrival
          ? 0.014
          : cortex
            ? 0.032
            : links
              ? 0.02
              : vision
                ? 0.025
                : balance
                  ? 0.022
                  : 0.045),
      8,
      delta
    );
    lineMat.current.opacity = THREE.MathUtils.damp(
      lineMat.current.opacity,
      target *
        (arrival
          ? 0.4
          : cortex
            ? 0.75
            : links
              ? 0.5
              : vision
                ? 0.58
                : balance
                  ? 0.52
                  : 0.7),
      8,
      delta
    );
  });

  return (
    <group ref={group}>
      {/* Narrow wash ribbon — not a full-height teal slab */}
      <mesh>
        <planeGeometry args={[1.65, 0.42]} />
        <meshBasicMaterial
          ref={planeMat}
          color="#67e8f9"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.15, 0.006]} />
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

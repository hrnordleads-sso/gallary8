"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sampleCamera } from "@/lib/brainGeometry";
import { getScrollState } from "@/lib/scrollStore";

export function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0.35, 0.05, 0));
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const cam = sampleCamera(progress);

    pointer.current.x = THREE.MathUtils.damp(
      pointer.current.x,
      reducedMotion ? 0 : state.pointer.x,
      3,
      delta
    );
    pointer.current.y = THREE.MathUtils.damp(
      pointer.current.y,
      reducedMotion ? 0 : state.pointer.y,
      3,
      delta
    );

    const parallax = 0.18 * (1 - progress * 0.35);
    const target = cam.position.clone();
    target.x += pointer.current.x * parallax;
    target.y += pointer.current.y * parallax * 0.6;

    camera.position.lerp(target, 1 - Math.exp(-2.8 * delta));
    look.current.lerp(cam.lookAt, 1 - Math.exp(-2.6 * delta));
    camera.lookAt(look.current);
  });

  return null;
}

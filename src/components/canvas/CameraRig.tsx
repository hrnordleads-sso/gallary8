"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sampleCamera } from "@/lib/brainGeometry";
import { getBrainLayout } from "@/lib/brainOrigin";
import { getSceneElapsed } from "@/lib/sceneTime";
import { getScrollIdle, getScrollState } from "@/lib/scrollStore";

/** Silkier camera follow + idle micro-orbit when scroll is still (P3). */
export function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0.35, 0.05, 0));
  const pointer = useRef({ x: 0, y: 0 });
  const layout = useRef(getBrainLayout());

  useFrame((state, delta) => {
    const { progress, reducedMotion } = getScrollState();
    const cam = sampleCamera(progress);
    const idle = getScrollIdle();
    layout.current = getBrainLayout();

    pointer.current.x = THREE.MathUtils.damp(
      pointer.current.x,
      reducedMotion ? 0 : state.pointer.x,
      2.4,
      delta
    );
    pointer.current.y = THREE.MathUtils.damp(
      pointer.current.y,
      reducedMotion ? 0 : state.pointer.y,
      2.4,
      delta
    );

    // Arrival: responsive framing (phone brain sits under copy)
    const arrivalBlend = 1 - THREE.MathUtils.smoothstep(progress / 0.1, 0, 1);
    const target = cam.position.clone().lerp(layout.current.cameraPos, arrivalBlend);
    const lookTarget = cam.lookAt.clone().lerp(layout.current.lookAt, arrivalBlend);

    // Parallax eases off as we pull into constellation
    const parallax = 0.16 * (1 - progress * 0.55) * (arrivalBlend > 0.5 ? 0.55 : 1);
    target.x += pointer.current.x * parallax;
    target.y += pointer.current.y * parallax * 0.55;

    // Soft idle drift — alive when the viewer pauses on a beat
    const t = getSceneElapsed();
    target.x += Math.sin(t * 0.22) * 0.028 * idle;
    target.y += Math.cos(t * 0.19) * 0.016 * idle;

    if ("fov" in camera) {
      const persp = camera as THREE.PerspectiveCamera;
      persp.fov = THREE.MathUtils.damp(persp.fov, layout.current.fov, 3, delta);
      persp.updateProjectionMatrix();
    }

    const follow = reducedMotion ? 6 : 2.2;
    camera.position.lerp(target, 1 - Math.exp(-follow * delta));
    look.current.lerp(lookTarget, 1 - Math.exp(-(follow * 0.95) * delta));
    camera.lookAt(look.current);
  });

  return null;
}

"use client";

import { useLayoutEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { FiberTimerClock } from "@/lib/fiberTimerClock";
import {
  connectSceneTimer,
  disposeSceneTimer,
  tickSceneTime,
} from "@/lib/sceneTime";

/**
 * B2 · G8-03 — drive scene time with THREE.Timer and keep R3F store clock Timer-backed.
 */
export function TimerClockBridge() {
  const set = useThree((s) => s.set);
  const clock = useThree((s) => s.clock);

  useLayoutEffect(() => {
    connectSceneTimer();

    // Patched THREE.Clock already owns `_timer`. Unpatched Clock gets replaced.
    const hasTimerBackend =
      clock instanceof FiberTimerClock ||
      (clock != null && Object.prototype.hasOwnProperty.call(clock, "_timer"));

    if (hasTimerBackend) {
      return () => {
        disposeSceneTimer();
      };
    }

    const next = new FiberTimerClock(true);
    next.start();
    set({ clock: next as unknown as THREE.Clock });
    return () => {
      next.dispose();
      disposeSceneTimer();
    };
  }, [clock, set]);

  useFrame(() => {
    tickSceneTime();
  }, -1);

  return null;
}

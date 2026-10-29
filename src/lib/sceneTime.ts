/**
 * B2 · G8-03 — frame elapsed time via THREE.Timer (not deprecated Clock).
 * Updated once per frame from TimerClockBridge; read from animation loops.
 */
import * as THREE from "three";

const timer = new THREE.Timer();
let connected = false;
let elapsed = 0;

export function connectSceneTimer(): void {
  if (connected || typeof document === "undefined") return;
  timer.connect(document);
  connected = true;
}

/** Call once per frame with rAF timestamp (ms). */
export function tickSceneTime(timestamp?: number): number {
  timer.update(timestamp);
  elapsed = timer.getElapsed();
  return elapsed;
}

export function getSceneElapsed(): number {
  return elapsed;
}

export function getSceneDelta(): number {
  return timer.getDelta();
}

export function disposeSceneTimer(): void {
  if (!connected) return;
  timer.disconnect();
  connected = false;
}

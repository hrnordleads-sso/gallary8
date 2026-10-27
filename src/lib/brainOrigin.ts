import * as THREE from "three";
import { getClientTier } from "@/lib/deviceProfile";

/**
 * Hero open: brain on the right — cyan lattice cerebrum field.
 */
export const BRAIN_ORIGIN = new THREE.Vector3(1.4, -0.02, 0);

/**
 * Arrival — dorsal / slight 3⁄4 so the longitudinal fissure reads like the reference.
 */
export const BRAIN_ARRIVAL = {
  rotation: new THREE.Euler(0.48, -0.22, 0.04),
  scale: 1.52,
} as const;

export type BrainLayout = {
  origin: THREE.Vector3;
  scale: number;
  cameraPos: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
};

/** Responsive framing — phone: brain lower/center under copy; desktop: right field. */
export function getBrainLayout(): BrainLayout {
  const tier = getClientTier();
  if (tier === "phone") {
    return {
      origin: new THREE.Vector3(0.15, -0.42, 0),
      scale: 1.18,
      cameraPos: new THREE.Vector3(0.05, 0.12, 4.35),
      lookAt: new THREE.Vector3(0.12, -0.28, 0),
      fov: 42,
    };
  }
  if (tier === "tablet") {
    return {
      origin: new THREE.Vector3(0.95, -0.12, 0),
      scale: 1.32,
      cameraPos: new THREE.Vector3(-0.15, 0.08, 4.0),
      lookAt: new THREE.Vector3(0.4, -0.06, 0),
      fov: 40,
    };
  }
  return {
    origin: BRAIN_ORIGIN.clone(),
    scale: BRAIN_ARRIVAL.scale,
    cameraPos: new THREE.Vector3(-0.3, 0.08, 3.8),
    lookAt: new THREE.Vector3(0.45, -0.02, 0),
    fov: 38,
  };
}

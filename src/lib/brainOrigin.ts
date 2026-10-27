import * as THREE from "three";

/**
 * Hero open: brain on the right — soft luminous field, not a specimen slab.
 */
export const BRAIN_ORIGIN = new THREE.Vector3(1.4, -0.02, 0);

/**
 * Arrival — gentle 3/4 (less stark lateral “autopsy” read), still clearly a brain.
 */
export const BRAIN_ARRIVAL = {
  rotation: new THREE.Euler(0.06, -0.42, 0.02),
  scale: 1.48,
} as const;

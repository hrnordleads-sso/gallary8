/**
 * Bake space: longest axis is Z. Remap so L/R sits on X and the face of the
 * cerebrum aims down +Z (Arrival camera). Empirically (z,y,x) yields a clear
 * lateral silhouette; Arrival then yaws ~-90° toward a frontal/3-quarter read.
 */
export function orientBrainPositions(positions: Float32Array): void {
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    positions[i] = z;
    positions[i + 1] = y;
    positions[i + 2] = x;
  }
}

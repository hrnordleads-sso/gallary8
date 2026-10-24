"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/** Very light bloom — preserves point-cloud anatomy. */
export function PostFX() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.2}
        mipmapBlur
        radius={0.35}
      />
      <Vignette offset={0.42} darkness={0.5} />
    </EffectComposer>
  );
}

"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/** Subtle bloom — keeps anatomical point structure readable. */
export function PostFX() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.45}
      />
      <Vignette offset={0.4} darkness={0.45} />
    </EffectComposer>
  );
}

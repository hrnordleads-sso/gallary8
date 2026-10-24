"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/** Isolated so a post-FX failure never blanks the brain scene. */
export function PostFX() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={1.35}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={0.65}
      />
      <Vignette offset={0.35} darkness={0.55} />
    </EffectComposer>
  );
}

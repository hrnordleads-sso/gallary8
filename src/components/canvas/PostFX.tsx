"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/** Soft cyan holographic aura — folds stay readable (Step 1 global look). */
export function PostFX() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.28}
        luminanceThreshold={0.88}
        luminanceSmoothing={0.32}
        mipmapBlur
        radius={0.52}
      />
      <Vignette offset={0.28} darkness={0.48} />
    </EffectComposer>
  );
}

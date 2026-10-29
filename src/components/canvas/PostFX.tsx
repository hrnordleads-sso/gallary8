"use client";

import { useEffect, useState } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { enablePostFX } from "@/lib/deviceProfile";

/** Cyan mesh bloom — luminous cerebrum without a heavy shadow pocket. */
export function PostFX() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // B2 · G8-02 — skip entire composer on mobile (CSS vignette covers atmosphere)
    setEnabled(enablePostFX());
  }, []);

  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.26}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.32}
        mipmapBlur
        radius={0.55}
      />
      <Vignette offset={0.52} darkness={0.14} />
    </EffectComposer>
  );
}

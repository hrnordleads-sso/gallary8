"use client";

import { useEffect, useState } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { isConstrainedClient } from "@/lib/deviceProfile";

/** Soft cyan bloom on desktop; vignette-only on constrained / mobile (P3 perf). */
export function PostFX() {
  const [bloom, setBloom] = useState(true);

  useEffect(() => {
    setBloom(!isConstrainedClient());
  }, []);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {bloom ? (
        <Bloom
          intensity={0.2}
          luminanceThreshold={0.93}
          luminanceSmoothing={0.38}
          mipmapBlur
          radius={0.62}
        />
      ) : null}
      <Vignette offset={0.3} darkness={bloom ? 0.52 : 0.58} />
    </EffectComposer>
  );
}

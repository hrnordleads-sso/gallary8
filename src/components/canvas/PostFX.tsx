"use client";

import { useEffect, useState } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { isConstrainedClient } from "@/lib/deviceProfile";

/** Soft cyan bloom on desktop; light vignette — no heavy shadow pocket. */
export function PostFX() {
  const [bloom, setBloom] = useState(true);

  useEffect(() => {
    setBloom(!isConstrainedClient());
  }, []);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {bloom ? (
        <Bloom
          intensity={0.14}
          luminanceThreshold={0.88}
          luminanceSmoothing={0.35}
          mipmapBlur
          radius={0.4}
        />
      ) : null}
      <Vignette offset={0.55} darkness={bloom ? 0.12 : 0.16} />
    </EffectComposer>
  );
}

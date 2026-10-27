"use client";

import { useEffect, useState } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { isConstrainedClient } from "@/lib/deviceProfile";

/** Cyan mesh bloom — luminous cerebrum without a heavy shadow pocket. */
export function PostFX() {
  const [bloom, setBloom] = useState(true);

  useEffect(() => {
    setBloom(!isConstrainedClient());
  }, []);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {bloom ? (
        <Bloom
          intensity={0.26}
          luminanceThreshold={0.72}
          luminanceSmoothing={0.32}
          mipmapBlur
          radius={0.55}
        />
      ) : null}
      <Vignette offset={0.52} darkness={bloom ? 0.14 : 0.18} />
    </EffectComposer>
  );
}

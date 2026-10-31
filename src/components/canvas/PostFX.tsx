"use client";

import { useEffect, useState } from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { enablePostFX } from "@/lib/deviceProfile";

/** Cyan mesh bloom — luminous cerebrum without a heavy shadow pocket. */
export function PostFX() {
  const [enabled, setEnabled] = useState(() =>
    typeof window !== "undefined" ? enablePostFX() : false
  );

  useEffect(() => {
    const sync = () => setEnabled(enablePostFX());
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
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

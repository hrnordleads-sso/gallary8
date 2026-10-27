"use client";

import { useEffect } from "react";
import { prefetchBrainAssets } from "@/lib/loadBrainPoints";

/** Kick brain asset downloads before the WebGL canvas mounts. */
export function BrainPrefetch() {
  useEffect(() => {
    prefetchBrainAssets();
  }, []);
  return null;
}

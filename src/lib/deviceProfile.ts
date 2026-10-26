/** Client device hints for particle budget + post FX (P3 perf). */

export function isConstrainedClient(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth < 900 ||
    window.devicePixelRatio > 2 ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  );
}

/** Anatomical / procedural point keep ratio (1 = full bake). */
export function brainKeepRatio(): number {
  return isConstrainedClient() ? 0.38 : 1;
}

/** Starfield density multiplier. */
export function starfieldScale(): number {
  return isConstrainedClient() ? 0.45 : 1;
}

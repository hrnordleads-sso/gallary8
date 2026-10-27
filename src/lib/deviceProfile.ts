/** Client device hints for particle budget + post FX (P3 perf). */

export type ClientTier = "phone" | "tablet" | "desktop";

export function getClientTier(): ClientTier {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const mobileUa = /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent);
  const tabletUa = /iPad|Tablet/i.test(navigator.userAgent);
  if (w < 640 || (mobileUa && w < 900)) return "phone";
  if (w < 1024 || tabletUa) return "tablet";
  return "desktop";
}

export function isConstrainedClient(): boolean {
  if (typeof window === "undefined") return false;
  return getClientTier() !== "desktop" || window.devicePixelRatio > 2.25;
}

/** Anatomical / procedural point keep ratio (1 = full bake). Lite bin already thinned. */
export function brainKeepRatio(): number {
  const tier = getClientTier();
  if (tier === "phone") return 1; // lite bin
  if (tier === "tablet") return 0.72;
  return 1;
}

/** Prefer smaller download on phones / constrained clients. */
export function useLiteBrainPoints(): boolean {
  return getClientTier() === "phone" || isConstrainedClient();
}

/** Starfield density multiplier. */
export function starfieldScale(): number {
  const tier = getClientTier();
  if (tier === "phone") return 0.32;
  if (tier === "tablet") return 0.55;
  return 1;
}

export function canvasDprMax(): number {
  const tier = getClientTier();
  if (tier === "phone") return 1.15;
  if (tier === "tablet") return 1.35;
  return Math.min(1.75, typeof window !== "undefined" ? window.devicePixelRatio : 1.5);
}

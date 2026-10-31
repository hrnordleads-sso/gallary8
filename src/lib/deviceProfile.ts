/** Client device hints for particle budget + post FX (B2 · G8-02). */

export type ClientTier = "phone" | "tablet" | "desktop";

/** Mobile performance band — aligned with B1 readability (≤768px). */
export function isMobilePerfBand(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 768;
}

export function getClientTier(): ClientTier {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const mobileUa = /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent);
  const tabletUa = /iPad|Tablet/i.test(navigator.userAgent);
  // Treat ≤768 as phone for GPU budgets (matches B1 / G8-02)
  if (w <= 768 || w < 640 || (mobileUa && w < 900)) return "phone";
  if (w < 1024 || tabletUa) return "tablet";
  return "desktop";
}

export function isConstrainedClient(): boolean {
  if (typeof window === "undefined") return false;
  return getClientTier() !== "desktop" || window.devicePixelRatio > 2.25;
}

/**
 * Point keep ratio after the selected bin loads.
 * Lite bin is already thinned; mobile further thins for GPU fill rate.
 */
export function brainKeepRatio(): number {
  const tier = getClientTier();
  if (isMobilePerfBand() || tier === "phone") return 0.5;
  if (tier === "tablet") return 0.85;
  return 1;
}

/**
 * B5 · when mobile falls back from lite → full bin, thin harder so GPU
 * stays near the lite effective budget (~40k) instead of ~120k.
 */
export function brainKeepRatioForLoaded(
  source: "lite" | "full",
  pointCount: number
): number {
  const base = brainKeepRatio();
  const mobile = isMobilePerfBand() || getClientTier() === "phone";
  if (!mobile || source !== "full" || pointCount <= 0) return base;
  const target = 40_000;
  return Math.min(base, Math.max(0.12, target / pointCount));
}

/** Prefer smaller download on phones / constrained / ≤768 viewports. */
export function preferLiteBrainPoints(): boolean {
  return (
    isMobilePerfBand() ||
    getClientTier() === "phone" ||
    isConstrainedClient()
  );
}

/** Starfield density multiplier. */
export function starfieldScale(): number {
  const tier = getClientTier();
  if (isMobilePerfBand() || tier === "phone") return 0.18;
  if (tier === "tablet") return 0.4;
  return 1;
}

export function canvasDprMax(): number {
  const tier = getClientTier();
  if (isMobilePerfBand() || tier === "phone") return 1;
  if (tier === "tablet") return 1.25;
  return Math.min(
    1.75,
    typeof window !== "undefined" ? window.devicePixelRatio : 1.5
  );
}

/** Full-screen post stack (bloom + vignette pass) — desktop only. */
export function enablePostFX(): boolean {
  return !isMobilePerfBand() && !isConstrainedClient();
}

/** Dense secondary EdgesGeometry — expensive; align with PostFX / threads gates. */
export function enableFineBrainEdges(): boolean {
  return !isMobilePerfBand() && !isConstrainedClient();
}

/** Signal thread overlay — desktop / large tablet only. */
export function enableSignalThreads(): boolean {
  return !isMobilePerfBand() && !isConstrainedClient();
}

/**
 * ScrollTrigger scrub lag by input / motion preference.
 * Desktop mouse keeps cinematic lag; primary touch / coarse pointers get snappier follow.
 */
export function resolveScrollScrub(reducedMotion: boolean): number {
  if (reducedMotion) return 0.12;
  if (typeof window === "undefined") return 1.05;

  const coarsePrimary = window.matchMedia("(pointer: coarse)").matches;
  const finePrimary = window.matchMedia("(pointer: fine)").matches;
  const hoverNone = window.matchMedia("(hover: none)").matches;

  // Prefer snappy scrub when the primary pointer is coarse (phones / most tablets).
  // Hybrid laptops often report fine + touch — keep cinematic mouse scrub there.
  if (coarsePrimary || (hoverNone && !finePrimary)) return 0.55;

  return 1.05;
}

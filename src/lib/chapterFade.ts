import { CHAPTERS } from "@/lib/narrative";

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * Chapter copy opacity.
 * Arrival starts fully visible (no soft-land at progress 0).
 * Soft land only applies when entering chapters after Arrival.
 * Release coda holds full opacity to the end.
 */
export function chapterFadeOpacity(progress: number): number {
  const count = CHAPTERS.length;
  const scaled = progress * count;
  const chapter = Math.min(count - 1, Math.max(0, Math.floor(scaled + 1e-6)));
  const local = scaled % 1;
  const id = CHAPTERS[chapter]?.id;

  if (id === "release") return 1;

  // Soft land after a chapter boundary, solid mid-beat, tight exit.
  // Chapter 0 has no prior chapter — keep Arrival opaque from the first frame.
  if (local < 0.05) {
    if (chapter === 0) return 1;
    return smoothstep(local / 0.05);
  }
  if (local < 0.88) return 1;
  return 1 - smoothstep((local - 0.88) / 0.12);
}

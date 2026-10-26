import { CHAPTERS } from "@/lib/narrative";

/**
 * Step 9 · chapter copy opacity.
 * Solid from chapter start (local=0) through most of the beat;
 * soft fade only in the last ~10% so the next title can land clean.
 * Release coda holds full opacity to the end.
 */
export function chapterFadeOpacity(progress: number): number {
  const count = CHAPTERS.length;
  const scaled = progress * count;
  const chapter = Math.min(count - 1, Math.max(0, Math.floor(scaled + 1e-6)));
  const local = scaled % 1;
  const id = CHAPTERS[chapter]?.id;

  if (id === "release") return 1;
  if (local < 0.9) return 1;
  return Math.max(0, 1 - (local - 0.9) / 0.1);
}

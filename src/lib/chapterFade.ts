import { CHAPTERS } from "@/lib/narrative";

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * P1 · chapter copy opacity — soft land, solid hold, tight exit so next title settles clean.
 * Release coda holds full opacity to the end.
 */
export function chapterFadeOpacity(progress: number): number {
  const count = CHAPTERS.length;
  const scaled = progress * count;
  const chapter = Math.min(count - 1, Math.max(0, Math.floor(scaled + 1e-6)));
  const local = scaled % 1;
  const id = CHAPTERS[chapter]?.id;

  if (id === "release") return 1;

  // Soft land (first ~5%), solid mid-beat, exit in last ~12%
  if (local < 0.05) return smoothstep(local / 0.05);
  if (local < 0.88) return 1;
  return 1 - smoothstep((local - 0.88) / 0.12);
}

export type ScrollState = {
  progress: number;
  chapter: number;
  reducedMotion: boolean;
};

type Listener = (state: ScrollState) => void;

const state: ScrollState = {
  progress: 0,
  chapter: 0,
  reducedMotion: false,
};

const listeners = new Set<Listener>();

/** Timestamp of last meaningful progress change (for idle breath). */
let lastMutatedAt = 0;

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function getScrollState(): ScrollState {
  return state;
}

export function setScrollProgress(progress: number, chapterCount: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  if (Math.abs(clamped - state.progress) > 1e-6) {
    lastMutatedAt = nowMs();
  }
  state.progress = clamped;
  state.chapter = Math.min(
    chapterCount - 1,
    Math.max(0, Math.floor(clamped * chapterCount + 1e-6))
  );
  listeners.forEach((listener) => listener(state));
}

export function setReducedMotion(value: boolean) {
  state.reducedMotion = value;
  listeners.forEach((listener) => listener(state));
}

/**
 * P3 · 0 while scrolling, eases to 1 after ~0.7s stillness.
 * Used for idle micro-breath / camera drift (disabled under reduced-motion).
 */
export function getScrollIdle(now = nowMs()): number {
  if (state.reducedMotion) return 0;
  if (lastMutatedAt === 0) return 1;
  const quiet = now - lastMutatedAt;
  const t = Math.min(1, Math.max(0, (quiet - 220) / 700));
  return t * t * (3 - 2 * t);
}

export function subscribeScroll(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

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

export function getScrollState(): ScrollState {
  return state;
}

export function setScrollProgress(progress: number, chapterCount: number) {
  const clamped = Math.min(1, Math.max(0, progress));
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

export function subscribeScroll(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

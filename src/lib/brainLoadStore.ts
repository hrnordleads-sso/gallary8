/** B4 · G8-05/G8-06 — scene boot status for loader + failure recovery. */

export type BrainLoadPhase = "booting" | "loading" | "ready" | "error";

export type BrainLoadState = {
  phase: BrainLoadPhase;
  message: string | null;
  source: "lite" | "full" | null;
  /** Loaded point count for HUD telemetry (null until ready). */
  pointCount: number | null;
  /** False when shell failed but points still present the field. */
  shellOk: boolean | null;
  attempts: number;
  /** Remount token for Canvas / load effects. */
  reloadToken: number;
};

type Listener = (state: BrainLoadState) => void;

const MAX_ATTEMPTS = 3;

const state: BrainLoadState = {
  phase: "booting",
  message: null,
  source: null,
  pointCount: null,
  shellOk: null,
  attempts: 0,
  reloadToken: 0,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener({ ...state }));
}

export function getBrainLoadState(): BrainLoadState {
  return state;
}

export function getMaxBrainLoadAttempts(): number {
  return MAX_ATTEMPTS;
}

export function setBrainLoadBooting(): void {
  state.phase = "booting";
  state.message = null;
  state.source = null;
  state.pointCount = null;
  state.shellOk = null;
  emit();
}

export function setBrainLoadLoading(): void {
  state.phase = "loading";
  state.message = null;
  emit();
}

export function setBrainLoadReady(
  source: "lite" | "full",
  meta?: { pointCount?: number; shellOk?: boolean }
): void {
  state.phase = "ready";
  state.message = null;
  state.source = source;
  state.pointCount = meta?.pointCount ?? state.pointCount;
  state.shellOk = meta?.shellOk ?? true;
  emit();
}

export function setBrainLoadError(message: string): void {
  state.phase = "error";
  state.message = message;
  state.source = null;
  state.pointCount = null;
  state.shellOk = null;
  emit();
}

/**
 * Queue one retry if under the attempt cap.
 * Returns false when retries are exhausted (no infinite loop).
 */
export function requestBrainLoadRetry(): boolean {
  if (state.attempts >= MAX_ATTEMPTS) {
    state.phase = "error";
    state.message =
      state.message ??
      "Neural field assets could not be recovered. Refresh the page or try again later.";
    emit();
    return false;
  }
  state.attempts += 1;
  state.phase = "loading";
  state.message = null;
  state.source = null;
  state.pointCount = null;
  state.shellOk = null;
  state.reloadToken += 1;
  emit();
  return true;
}

export function subscribeBrainLoad(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

/** Dev/QA only — reset retry budget between forced asset scenarios. */
export function resetBrainLoadAttemptsForQa(): void {
  if (process.env.NODE_ENV === "production") return;
  state.attempts = 0;
  emit();
}

"use client";

import { useEffect, useState } from "react";
import {
  getMaxBrainLoadAttempts,
  requestBrainLoadRetry,
  subscribeBrainLoad,
  type BrainLoadState,
} from "@/lib/brainLoadStore";
import { clearBrainPointsCache } from "@/lib/loadBrainPoints";
import { clearBrainShellCache } from "@/lib/loadBrainShell";
import { getScrollState } from "@/lib/scrollStore";

/**
 * B4 · G8-05/G8-06 — premium boot / recovery overlay.
 * Narrative + HUD stay above this layer so chapters remain usable.
 */
export function MonitorLoader() {
  const [load, setLoad] = useState<BrainLoadState>(() => ({
    phase: "booting",
    message: null,
    source: null,
    attempts: 0,
    reloadToken: 0,
  }));
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    return subscribeBrainLoad(setLoad);
  }, []);

  useEffect(() => {
    setReducedMotion(getScrollState().reducedMotion);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches || getScrollState().reducedMotion);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (load.phase === "ready") return null;

  const isError = load.phase === "error";
  const retriesLeft = getMaxBrainLoadAttempts() - load.attempts;
  const canRetry = isError && retriesLeft > 0;

  const onRetry = () => {
    clearBrainPointsCache();
    clearBrainShellCache();
    if (!requestBrainLoadRetry()) return;
  };

  return (
    <div
      className="monitor-loader pointer-events-none fixed inset-0 z-[15] flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
      aria-busy={!isError}
    >
      <div
        className={`max-w-[22rem] rounded-lg border border-[#67e8f9]/25 bg-[#010814]/88 px-5 py-4 text-center shadow-[0_0_40px_rgba(1,8,20,0.75)] backdrop-blur-md ${
          isError ? "pointer-events-auto" : ""
        }`}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-[#67e8f9]/95">
          {isError ? "> FIELD_ERROR _" : "> SYSTEM _"}
        </p>
        <p className="mt-3 text-[15px] font-medium tracking-[-0.02em] text-white">
          {isError
            ? "Neural Monitor could not initialize the 3D field."
            : "Initializing Neural Monitor…"}
        </p>
        {isError && load.message ? (
          <p className="mt-2 text-[12px] leading-relaxed text-[#a8b8cc]/90">
            {load.message}
          </p>
        ) : (
          <p className="mt-2 text-[12px] leading-relaxed text-[#a8b8cc]/90">
            Mapping the specimen lattice. Scroll narrative remains available.
          </p>
        )}

        {!isError ? (
          <div
            className={`mx-auto mt-4 h-[2px] w-28 overflow-hidden rounded-full bg-[#67e8f9]/15 ${
              reducedMotion ? "" : "monitor-loader-bar"
            }`}
            aria-hidden
          >
            <span
              className={`block h-full w-1/2 bg-[#67e8f9]/80 ${
                reducedMotion ? "ml-[25%]" : "monitor-loader-bar-fill"
              }`}
            />
          </div>
        ) : null}

        {isError ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            {canRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="border border-[#67e8f9]/55 bg-[#010814]/80 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.28em] text-[#e8eef7] transition-colors hover:border-[#67e8f9] hover:text-[#67e8f9]"
              >
                [ RETRY FIELD ]
              </button>
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#fca5a5]/90">
                Retries exhausted — refresh to try again
              </p>
            )}
            <p className="text-[11px] text-[#a8b8cc]/75">
              Chapters 01–07 still scroll below.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

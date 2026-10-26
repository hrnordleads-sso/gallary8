"use client";

import { useEffect, useState } from "react";
import { CHAPTERS, HUD_METRICS } from "@/lib/narrative";
import { subscribeScroll } from "@/lib/scrollStore";

/** Global HUD chrome — thin floating telemetry matching Neural Monitor video. */
export function HUD() {
  const [chapter, setChapter] = useState(0);
  const [coherence, setCoherence] = useState(95.2);
  const [firing, setFiring] = useState(4.21);

  useEffect(() => {
    return subscribeScroll((state) => {
      setChapter(state.chapter);
      const current = CHAPTERS[state.chapter] ?? CHAPTERS[0];
      const base =
        current.id === "balance"
          ? 98.4 + Math.sin(state.progress * 8) * 0.4
          : current.id === "release"
            ? 99.1 + Math.sin(state.progress * 6) * 0.25
            : 88 + state.progress * 10 + Math.sin(state.progress * 12) * 1.1;
      setCoherence(base);
      setFiring(3.4 + state.progress * 2.8 + Math.sin(state.progress * 18) * 0.35);
    });
  }, []);

  const current = CHAPTERS[chapter] ?? CHAPTERS[0];
  const focus = current.specimen.replace(/\s*·\s*/g, "_").replace(/\s+/g, "_");

  return (
    <div className="hud-root pointer-events-none fixed inset-0 z-30 text-[8px] uppercase tracking-[0.2em] text-[#c8e7f5]/72 sm:text-[10px] sm:tracking-[0.22em]">
      <header className="absolute left-0 right-0 top-0 flex flex-wrap items-center gap-x-2 gap-y-1 overflow-hidden px-3 py-2.5 sm:gap-x-4 sm:px-5 sm:py-3">
        <span className="shrink-0 text-[#67e8f9]/95">{HUD_METRICS.brand}</span>
        <Dot className="hidden min-[400px]:inline" />
        <span className="hidden shrink-0 sm:inline">{HUD_METRICS.neurons}</span>
        <Dot className="hidden sm:inline" />
        <span className="hidden shrink-0 md:inline">{HUD_METRICS.particles}</span>
        <Dot className="hidden md:inline" />
        <span className="hidden shrink-0 min-[400px]:inline">
          FIRING: {firing.toFixed(2)} M/S
        </span>
        <Dot className="hidden min-[400px]:inline" />
        <span className="shrink-0">COHERENCE: {coherence.toFixed(1)}%</span>
        <span className="ml-auto hidden shrink-0 lg:inline">FOCUS: {focus}</span>
        <Waveform />
      </header>

      <div className="absolute bottom-9 left-3 right-3 flex flex-wrap items-end justify-between gap-3 sm:bottom-8 sm:left-5 sm:right-5">
        <div className="space-y-0.5 text-[#c8e7f5]/65 sm:space-y-1">
          <p>+ SPECIMEN: {current.specimen}</p>
          <p>+ STATUS: {current.status}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {CHAPTERS.map((item, index) => (
            <span
              key={item.id}
              className={
                index === chapter
                  ? "text-[#67e8f9]"
                  : "text-white/18"
              }
            >
              {item.index}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dot({ className = "" }: { className?: string }) {
  return <span className={`shrink-0 text-white/20 ${className}`} aria-hidden>·</span>;
}

function Waveform() {
  return (
    <div className="ml-1 hidden h-3.5 items-end gap-[2px] sm:flex" aria-hidden>
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="wave-bar w-[2px] rounded-full bg-[#67e8f9]/75"
          style={{ animationDelay: `${i * 0.07}s` }}
        />
      ))}
    </div>
  );
}

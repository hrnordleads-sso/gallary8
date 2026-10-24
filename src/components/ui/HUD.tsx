"use client";

import { useEffect, useState } from "react";
import { CHAPTERS, HUD_METRICS } from "@/lib/narrative";
import { subscribeScroll } from "@/lib/scrollStore";

export function HUD() {
  const [chapter, setChapter] = useState(0);
  const [coherence, setCoherence] = useState(92.5);
  const [firing, setFiring] = useState(4.67);

  useEffect(() => {
    return subscribeScroll((state) => {
      setChapter(state.chapter);
      setCoherence(88 + state.progress * 8 + Math.sin(state.progress * 12) * 1.2);
      setFiring(3.2 + state.progress * 3.8 + Math.sin(state.progress * 20) * 0.4);
    });
  }, []);

  const current = CHAPTERS[chapter] ?? CHAPTERS[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-30 text-[10px] tracking-[0.18em] text-sky-100/75 sm:text-[11px]">
      <header className="absolute left-0 right-0 top-0 flex items-center gap-3 overflow-x-auto border-b border-white/10 bg-[#020617]/55 px-3 py-2 backdrop-blur-md sm:gap-5 sm:px-5">
        <span className="shrink-0 font-medium text-cyan-200">{HUD_METRICS.brand}</span>
        <span className="hidden shrink-0 sm:inline">{HUD_METRICS.neurons}</span>
        <span className="hidden shrink-0 md:inline">{HUD_METRICS.particles}</span>
        <span className="shrink-0">FIRING: {firing.toFixed(2)} M/S</span>
        <span className="shrink-0">COHERENCE: {coherence.toFixed(1)}%</span>
        <span className="ml-auto hidden shrink-0 lg:inline">{HUD_METRICS.focus}</span>
        <Waveform />
      </header>

      <div className="absolute bottom-16 left-3 right-3 flex flex-wrap items-end justify-between gap-3 sm:bottom-14 sm:left-5 sm:right-5">
        <div className="space-y-1 font-mono uppercase">
          <p>+ SPECIMEN: {current.specimen}</p>
          <p>+ STATUS: {current.status}</p>
        </div>
        <div className="flex items-center gap-2 font-mono">
          {CHAPTERS.map((item, index) => (
            <span
              key={item.id}
              className={
                index === chapter
                  ? "text-cyan-200"
                  : "text-white/30"
              }
            >
              {item.index}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
        N
      </div>
    </div>
  );
}

function Waveform() {
  return (
    <div className="ml-1 hidden h-4 items-end gap-[2px] sm:flex" aria-hidden>
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="wave-bar w-[2px] rounded-full bg-cyan-300/80"
          style={{ animationDelay: `${i * 0.07}s` }}
        />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "@/lib/narrative";
import { subscribeScroll } from "@/lib/scrollStore";

export function Narrative() {
  const [chapter, setChapter] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let last = 0;
    return subscribeScroll((state) => {
      setChapter(state.chapter);
      // Soft blink between chapter boundaries
      const local = (state.progress * CHAPTERS.length) % 1;
      setVisible(local > 0.06 && local < 0.92);
      last = state.chapter;
      void last;
    });
  }, []);

  const current = CHAPTERS[chapter] ?? CHAPTERS[0];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex items-center">
      <div
        className={`narrative-panel mx-auto w-full max-w-xl px-6 transition-all duration-700 sm:mx-0 sm:ml-[6%] sm:max-w-lg md:ml-[8%] lg:max-w-xl ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <p className="mb-4 font-mono text-[11px] tracking-[0.28em] text-cyan-200/90 sm:text-xs">
          {current.eyebrow}
        </p>
        <h1 className="whitespace-pre-line text-[clamp(2rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
          {current.title}
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-300/90 sm:text-base">
          {current.body}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "@/lib/narrative";
import { chapterFadeOpacity } from "@/lib/chapterFade";
import { subscribeScroll } from "@/lib/scrollStore";

/** Floating specimen annotations — same fade curve as Narrative (Step 9). */
export function FieldCallouts() {
  const [chapter, setChapter] = useState(0);
  const [fade, setFade] = useState(1);

  useEffect(() => {
    return subscribeScroll((state) => {
      setChapter(state.chapter);
      setFade(chapterFadeOpacity(state.progress));
    });
  }, []);

  const current = CHAPTERS[chapter] ?? CHAPTERS[0];
  const callouts = current.callouts;
  if (!callouts?.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[25] font-mono text-[9px] uppercase tracking-[0.26em] text-[#67e8f9]/80 sm:text-[10px]">
      {callouts.map((item) => (
        <div
          key={item.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-500 ease-out"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            opacity: fade,
            transform: `translate(-50%, -50%) translateY(${(1 - fade) * 8}px)`,
          }}
        >
          <div className="flex flex-col items-start gap-1.5">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute h-px w-3 bg-[#67e8f9]/70" />
              <span className="absolute h-3 w-px bg-[#67e8f9]/70" />
            </span>
            <div className="flex items-center gap-2">
              <span className="h-px w-7 bg-[#67e8f9]/45 sm:w-9" />
              <span className="whitespace-nowrap drop-shadow-[0_0_8px_rgba(1,8,20,0.9)]">
                {item.label}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

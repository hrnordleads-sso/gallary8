"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "@/lib/narrative";
import { chapterFadeOpacity } from "@/lib/chapterFade";
import { subscribeScroll } from "@/lib/scrollStore";

/** Floating specimen annotations — crosshair + leader (video HUD style). Desktop only. */
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
    <div className="pointer-events-none fixed inset-0 z-[25] hidden font-mono text-[10px] uppercase tracking-[0.22em] text-[#67e8f9]/85 min-[769px]:block min-[769px]:tracking-[0.24em]">
      {callouts.map((item) => {
        const side = item.side ?? "right";
        const isLeft = side === "left";
        return (
          <div
            key={item.id}
            className="absolute transition-[opacity,transform] duration-400 ease-out"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: fade,
              transform: `translate(-50%, -50%) translateY(${(1 - fade) * 6}px)`,
            }}
          >
            <div
              className={`flex items-center gap-2 ${
                isLeft ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <span className="relative flex h-3 w-3 shrink-0 items-center justify-center" aria-hidden>
                <span className="absolute h-px w-3.5 bg-[#67e8f9]/75" />
                <span className="absolute h-3.5 w-px bg-[#67e8f9]/75" />
                <span className="absolute h-1 w-1 rounded-full bg-[#67e8f9]/90" />
              </span>
              <span
                className={`h-px shrink-0 bg-[#67e8f9]/40 ${
                  isLeft ? "w-8 sm:w-11" : "w-8 sm:w-11"
                }`}
                aria-hidden
              />
              <span className="whitespace-nowrap drop-shadow-[0_0_10px_rgba(1,8,20,0.95)]">
                {item.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS } from "@/lib/narrative";
import { setReducedMotion, setScrollProgress } from "@/lib/scrollStore";

gsap.registerPlugin(ScrollTrigger);

/** Step 9 · smoother 7-chapter scrub with resize refresh. */
export function ScrollController() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => setReducedMotion(media.matches);
    applyMotion();
    media.addEventListener("change", applyMotion);

    const trigger = ScrollTrigger.create({
      trigger: "#scroll-root",
      start: "top top",
      end: "bottom bottom",
      // Silkier scrub; reduced-motion snaps almost 1:1
      scrub: media.matches ? 0.15 : 0.85,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setScrollProgress(self.progress, CHAPTERS.length);
      },
    });

    setScrollProgress(0, CHAPTERS.length);

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    // Layout settle after fonts / first paint
    const settle = window.setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", onResize);
      media.removeEventListener("change", applyMotion);
      trigger.kill();
    };
  }, []);

  return (
    <div id="scroll-root" className="relative z-10" aria-hidden>
      {CHAPTERS.map((chapter) => (
        <section
          key={chapter.id}
          data-chapter={chapter.id}
          className="h-[100svh] w-full"
        />
      ))}
    </div>
  );
}

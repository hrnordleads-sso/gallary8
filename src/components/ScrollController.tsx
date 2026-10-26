"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS } from "@/lib/narrative";
import { setReducedMotion, setScrollProgress } from "@/lib/scrollStore";

gsap.registerPlugin(ScrollTrigger);

/** P1 · cine scrub — longer beats + silkier lag so camera/FX stay continuous. */
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
      // Higher scrub = smoother video-like follow (reduced-motion stays snappy)
      scrub: media.matches ? 0.12 : 1.15,
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
          className="h-[118svh] w-full"
        />
      ))}
    </div>
  );
}

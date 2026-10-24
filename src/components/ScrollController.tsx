"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CHAPTERS } from "@/lib/narrative";
import { setReducedMotion, setScrollProgress } from "@/lib/scrollStore";

gsap.registerPlugin(ScrollTrigger);

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
      scrub: 0.65,
      onUpdate: (self) => {
        setScrollProgress(self.progress, CHAPTERS.length);
      },
    });

    setScrollProgress(0, CHAPTERS.length);

    return () => {
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

"use client";

import { useEffect, useState } from "react";
import { CHAPTERS } from "@/lib/narrative";
import { chapterFadeOpacity } from "@/lib/chapterFade";
import { subscribeScroll } from "@/lib/scrollStore";

/** Desktop layout unlock — above B1 mobile band (≤768px). */
const desk = "min-[769px]:";

export function Narrative() {
  const [chapter, setChapter] = useState(0);
  const [fade, setFade] = useState(1);

  useEffect(() => {
    return subscribeScroll((state) => {
      setChapter(state.chapter);
      setFade(chapterFadeOpacity(state.progress));
    });
  }, []);

  const current = CHAPTERS[chapter] ?? CHAPTERS[0];
  const showLog = Boolean(current.logCard) && fade > 0.15;
  const align = current.align ?? "left";
  const isArrival = current.id === "arrival";
  const isCortex = current.id === "cortex";
  const isSignals = current.id === "signals";
  const isLinks = current.id === "links";
  const isVision = current.id === "vision";
  const isBalance = current.id === "balance";
  const isRelease = current.id === "release";

  const panelPos =
    align === "right"
      ? isBalance
        ? `${desk}ml-auto ${desk}mr-[7%] lg:mr-[9%] ${desk}self-end ${desk}mb-[20vh]`
        : `${desk}ml-auto ${desk}mr-[7%] lg:mr-[9%] ${desk}self-start ${desk}mt-[16vh]`
      : align === "center"
        ? `${desk}mx-auto text-center`
        : isArrival
          ? // Hero open: copy hugs left edge so brain owns the right field (video)
            `${desk}ml-[1%] lg:ml-[1.5%] xl:ml-[2%]`
          : isVision
            ? `${desk}ml-[4%] lg:ml-[5%]`
            : `${desk}ml-[5%]`;

  const beginAgain = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // B3 · mobile ≤768: keep all chapter copy in the upper safe band (above brain + HUD).
  // Desktop (min-769) restores approved side/vertical placement via panelPos.
  const mobileStack =
    isArrival || isRelease
      ? `items-start pt-[max(4.75rem,env(safe-area-inset-top))] ${desk}items-center ${desk}pt-0`
      : isCortex
        ? `items-start pt-[max(5.25rem,env(safe-area-inset-top))] ${desk}items-start ${desk}pt-0`
        : isSignals
          ? `items-start pt-[max(5rem,env(safe-area-inset-top))] ${desk}pt-[16vh]`
          : isLinks
            ? `items-start pt-[max(5rem,env(safe-area-inset-top))] ${desk}items-center ${desk}pt-0`
            : isVision
              ? `items-start pt-[max(5rem,env(safe-area-inset-top))] ${desk}items-end ${desk}pt-0 ${desk}pb-[22vh]`
              : isBalance
                ? `items-start pt-[max(5rem,env(safe-area-inset-top))] ${desk}items-end ${desk}pt-0 ${desk}pb-0`
                : "items-center";

  return (
    <div className={`pointer-events-none fixed inset-0 z-20 flex ${mobileStack}`}>
      <div
        className={`narrative-panel mx-auto w-full max-w-[min(22rem,92vw)] transition-[opacity,transform] duration-400 ease-out ${desk}mx-0 ${desk}max-w-lg lg:max-w-xl ${
          isArrival ? `px-4 ${desk}px-5` : `px-5 ${desk}px-6`
        } ${panelPos} ${
          isArrival
            ? "lg:max-w-[32rem] xl:max-w-[34rem]"
            : isCortex ||
                isSignals ||
                isLinks ||
                isVision ||
                isBalance ||
                isRelease
              ? "lg:max-w-[36rem]"
              : ""
        } ${isRelease ? "narrative-release drop-shadow-[0_2px_18px_rgba(1,8,20,0.92)]" : ""}`}
        style={{
          opacity: fade,
          transform: `translateY(${(1 - fade) * 8}px)`,
        }}
      >
        <p
          className={`narrative-eyebrow mb-2.5 font-mono text-[10px] uppercase tracking-[0.36em] text-[#67e8f9]/90 ${desk}mb-3 ${desk}text-[11px] ${desk}tracking-[0.4em] ${
            isSignals ? `tracking-[0.42em] ${desk}tracking-[0.48em]` : ""
          }`}
        >
          {current.eyebrow}
        </p>
        <h1
          className={`narrative-title whitespace-pre-line font-semibold leading-[1.02] tracking-[-0.04em] text-white ${
            isSignals
              ? `text-[clamp(1.85rem,5.2vw,3.5rem)] ${desk}text-[clamp(2.1rem,4.6vw,3.5rem)]`
              : `text-[clamp(1.95rem,5.6vw,4rem)] ${desk}text-[clamp(2.25rem,5.2vw,4rem)]`
          }`}
        >
          {current.title}
        </h1>
        {!current.logCard && (
          <p
            className={`narrative-body mt-4 max-w-md leading-relaxed text-[#a8b8cc]/90 ${desk}mt-5 ${
              isArrival ||
              isCortex ||
              isLinks ||
              isVision ||
              isBalance ||
              isRelease
                ? `text-[14px] ${desk}text-base`
                : `text-[13px] ${desk}text-[15px]`
            } ${align === "center" ? "mx-auto" : ""}`}
          >
            {current.body}
          </p>
        )}
      </div>

      {current.logCard && (
        <div
          className={`narrative-log absolute bottom-[max(6.75rem,calc(env(safe-area-inset-bottom)+5.5rem))] left-1/2 w-[min(92vw,460px)] -translate-x-1/2 border border-[#67e8f9]/22 bg-[#010814]/82 px-3.5 py-3 font-mono text-[10px] text-cyan-50/90 backdrop-blur-md transition-[opacity,transform] duration-400 ease-out ${desk}bottom-[11%] ${desk}px-4 ${desk}py-3.5 ${desk}text-xs`}
          style={{
            opacity: showLog ? fade : 0,
            transform: `translateY(${(1 - fade) * 8}px)`,
          }}
        >
          <div className={`mb-2 flex items-center gap-2.5 ${desk}mb-2.5`}>
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-[#67e8f9]/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#67e8f9]/45" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#67e8f9]/25" />
            </span>
            <p className="tracking-[0.22em] text-cyan-200">{current.logCard.title}</p>
          </div>
          <p className="leading-relaxed text-slate-300/95">{current.logCard.body}</p>
          <div
            className={`mt-2.5 flex justify-between gap-4 text-[9px] tracking-[0.16em] text-cyan-200/75 ${desk}mt-3 ${desk}text-[10px]`}
          >
            <span>{current.logCard.rate}</span>
            <span>{current.logCard.channel}</span>
          </div>
        </div>
      )}

      {current.beginAgain && (
        <div
          className={`narrative-cta-wrap absolute bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.25rem))] left-1/2 -translate-x-1/2 transition-[opacity,transform] duration-400 ease-out ${desk}bottom-[12%]`}
          style={{
            opacity: fade,
            transform: `translateY(${(1 - fade) * 8}px)`,
          }}
        >
          <button
            type="button"
            onClick={beginAgain}
            className={`narrative-cta pointer-events-auto border border-white/35 bg-transparent px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.28em] text-white/90 transition-colors hover:border-[#67e8f9]/70 hover:text-[#67e8f9] ${desk}text-xs`}
          >
            [ BEGIN AGAIN ]
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, CircleHelp, MousePointer2, X } from "lucide-react";
import { directoryGuideSteps } from "./directoryGuideSteps";
import {
  getGuideSpotlightRect,
  waitForGuideTarget,
} from "../help-guide/guideTarget";

const STORAGE_KEY = "akseskota-directory-guide-completed-v1";

export default function DirectoryHelpGuide({
  onSetDirectoryOpen,
  onOpenExample,
  onCloseDetail,
  hasDestinations,
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [desktop, setDesktop] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const dialogRef = useRef(null);
  const autoStartedRef = useRef(false);
  const transitionTokenRef = useRef(0);
  const step = directoryGuideSteps[index];
  const finalStep = index === directoryGuideSteps.length - 1;
  const progress = useMemo(() => ((index + 1) / directoryGuideSteps.length) * 100, [index]);

  const updateSpotlight = useCallback(() => {
    if (!open) return;
    setDesktop(window.innerWidth >= 768);
    const target = directoryGuideSteps[index].target;
    const nextRect = getGuideSpotlightRect(target);
    if (!target || nextRect) setSpotlight(nextRect);
  }, [index, open]);

  const applySetup = useCallback((setup) => {
    if (setup === "open-panel") {
      onCloseDetail();
      onSetDirectoryOpen(true);
    }
    if (setup === "close-panel") {
      onCloseDetail();
      onSetDirectoryOpen(false);
    }
    if (setup === "open-place") {
      onOpenExample();
    }
  }, [onCloseDetail, onOpenExample, onSetDirectoryOpen]);

  const goTo = useCallback(async (nextIndex) => {
    const next = directoryGuideSteps[nextIndex];
    if (!next) return;

    const token = transitionTokenRef.current + 1;
    transitionTokenRef.current = token;
    setPreparing(true);
    applySetup(next.setup);

    const nextSpotlight = await waitForGuideTarget(next.target, {
      isCancelled: () => transitionTokenRef.current !== token,
    });
    if (transitionTokenRef.current !== token) return;

    setIndex(nextIndex);
    setSpotlight(nextSpotlight);
    setDesktop(window.innerWidth >= 768);
    setPreparing(false);
  }, [applySetup]);

  const start = useCallback(() => {
    setOpen(true);
    void goTo(0);
  }, [goTo]);

  const close = useCallback((completed = false) => {
    transitionTokenRef.current += 1;
    if (completed) {
      localStorage.setItem(STORAGE_KEY, "true");
      onCloseDetail();
      onSetDirectoryOpen(true);
    }
    setPreparing(false);
    setOpen(false);
    setSpotlight(null);
  }, [onCloseDetail, onSetDirectoryOpen]);

  useEffect(() => {
    if (autoStartedRef.current || localStorage.getItem(STORAGE_KEY) === "true") return undefined;
    autoStartedRef.current = true;
    const timer = window.setTimeout(start, 1000);
    return () => window.clearTimeout(timer);
  }, [start]);

  useEffect(() => {
    if (!open) return undefined;
    const timers = [80, 520, 1000].map((delay) => window.setTimeout(updateSpotlight, delay));
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [index, open, updateSpotlight]);

  useEffect(() => {
    if (!open) return undefined;
    dialogRef.current?.focus();
    function keyboard(event) {
      if (event.key === "Escape") close(false);
      if (event.key === "ArrowLeft" && index > 0 && !preparing) void goTo(index - 1);
      if (event.key === "ArrowRight" && !finalStep && !preparing) void goTo(index + 1);
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [close, finalStep, goTo, index, open, preparing]);

  const targetLowOnMobile = !desktop && spotlight && spotlight.top > window.innerHeight * 0.52;
  const targetOnLeft = desktop && spotlight && spotlight.left + spotlight.width < window.innerWidth * 0.62;

  return (
    <>
      <button type="button" onClick={start} aria-label="Buka panduan Direktori" className="grid size-10 shrink-0 place-items-center rounded-full border border-[#d8e4e5] bg-white text-[#0c6478] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#effaf8]">
        <CircleHelp className="size-4" />
      </button>
      {open && typeof document !== "undefined" && createPortal((
        <div className="pointer-events-none fixed inset-0 z-[220]">
          {spotlight ? (
            <div
              className="pointer-events-none absolute rounded-[18px] border-2 border-[#8ef0dc] transition-all duration-300"
              style={{
                ...spotlight,
                boxShadow:
                  `0 0 0 9999px rgba(6,31,41,${desktop ? ".72" : ".48"}), 0 0 0 5px rgba(142,240,220,.17), 0 18px 60px rgba(0,0,0,.24)`,
              }}
            >
              <span className="absolute -bottom-3 -right-3 grid size-9 animate-bounce place-items-center rounded-full bg-[#8ef0dc] text-[#073c47] shadow-lg motion-reduce:animate-none"><MousePointer2 className="size-4 fill-current" /></span>
            </div>
          ) : <div className="absolute inset-0 bg-[#061f29]/50 backdrop-blur-[1px] md:bg-[#061f29]/78 md:backdrop-blur-[2px]" />}

          <section ref={dialogRef} data-lenis-prevent="true" role="dialog" aria-modal="false" aria-labelledby="directory-guide-title" tabIndex={-1} className={`pointer-events-auto absolute inset-x-3 max-h-[46dvh] overflow-y-auto rounded-[22px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(1,26,35,.3)] outline-none md:inset-x-auto md:bottom-auto md:top-1/2 md:max-h-none md:w-[360px] md:overflow-hidden md:rounded-[24px] md:-translate-y-1/2 ${targetLowOnMobile ? "top-3" : "bottom-[max(12px,env(safe-area-inset-bottom))]"} ${targetOnLeft ? "md:right-7" : "md:left-1/2 md:-translate-x-1/2"}`}>
            <div className="h-1 bg-[#e4f4f1]"><div className="h-full rounded-r-full bg-[#18aa96] transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
            <div className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[9px] font-extrabold tracking-[.16em] text-[#18aa96]">{step.eyebrow}</p><p className="mt-1.5 text-[9px] font-bold text-[#94a0aa]">{index + 1} dari {directoryGuideSteps.length}</p></div>
                <button type="button" onClick={() => close(false)} aria-label="Tutup panduan" className="grid size-9 place-items-center rounded-full bg-[#f2f6f6] text-[#52616b]"><X className="size-4" /></button>
              </div>
              <h2 id="directory-guide-title" className="mt-3 text-[18px] font-extrabold leading-[1.2] tracking-[-.03em] text-[#122d38] md:mt-4 md:text-[21px]">{step.title}</h2>
              <p className="mt-2 text-[10px] font-medium leading-[1.15rem] text-[#667985] md:mt-3 md:text-[11px] md:leading-5">{step.description}</p>
              <p className="mt-3 rounded-[12px] bg-[#f4f8f7] px-3 py-2 text-[8px] font-semibold leading-4 text-[#5f727c] md:mt-4 md:py-2.5 md:text-[9px]"><CircleHelp className="mr-1.5 inline size-3 text-[#18aa96]" />{step.hint}</p>
              {step.setup === "open-place" && !hasDestinations && <p className="mt-2 text-[8px] font-bold text-[#a34b00]">Data tempat masih dimuat. Tunggu sebentar lalu ulangi langkah ini.</p>}
              <div className="mt-5 flex gap-2">
                {index > 0 ? <button type="button" disabled={preparing} onClick={() => void goTo(index - 1)} aria-label="Langkah sebelumnya" className="grid size-11 place-items-center rounded-[13px] border border-[#dbe5e6] text-[#0c6478] disabled:opacity-50"><ArrowLeft className="size-4" /></button> : <button type="button" disabled={preparing} onClick={() => close(true)} className="h-11 px-3 text-[10px] font-extrabold text-[#71818c] disabled:opacity-50">Lewati</button>}
                <button type="button" disabled={preparing || (step.setup === "open-place" && !hasDestinations)} onClick={() => finalStep ? close(true) : void goTo(index + 1)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[13px] bg-[#0c6478] text-[10px] font-extrabold text-white shadow-[0_8px_22px_rgba(12,100,120,.2)] disabled:cursor-wait disabled:opacity-50">
                  {preparing ? "Menyiapkan tampilan…" : finalStep ? <>Selesai <Check className="size-4" /></> : <>Lanjut <ArrowRight className="size-4" /></>}
                </button>
              </div>
            </div>
          </section>
        </div>
      ), document.body)}
    </>
  );
}

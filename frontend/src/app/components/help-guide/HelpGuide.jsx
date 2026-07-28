"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, CircleHelp, MapPin, MousePointer2, Route, X } from "lucide-react";
import { helpGuideSteps } from "./guideSteps";

const STORAGE_KEY = "akseskota-help-guide-completed-v3";
const TARGET_PADDING = 9;

function findVisibleTarget(name) {
  if (!name) return null;
  const elements = Array.from(document.querySelectorAll(`[data-guide="${name}"]`));
  return (
    elements.find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }) || null
  );
}

function getSpotlightRect(targetName) {
  const element = findVisibleTarget(targetName);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: Math.max(8, rect.top - TARGET_PADDING),
    left: Math.max(8, rect.left - TARGET_PADDING),
    width: Math.min(window.innerWidth - 16, rect.width + TARGET_PADDING * 2),
    height: Math.min(window.innerHeight - 16, rect.height + TARGET_PADDING * 2),
  };
}

function StepDemo({ type }) {
  if (type === "search") {
    return (
      <div className="mt-4 overflow-hidden rounded-[14px] border border-[#e1e9ea] bg-[#f8fbfb]">
        <div className="flex items-center gap-2 border-b border-[#e7eeee] px-3 py-2.5 text-[9px] font-bold text-[#52616b]">
          <span className="size-2 rounded-full bg-[#0c6478]" />Lokasi saya
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 text-[9px] font-bold text-[#52616b]">
          <span className="size-2 rounded-full bg-[#f59e0b]" />
          <span className="relative overflow-hidden whitespace-nowrap">
            Kebun Raya Bogor
            <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-[#0c6478]" />
          </span>
        </div>
      </div>
    );
  }
  if (type === "report-steps" || type === "report") {
    return (
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {["Lokasi", "Kondisi", "Foto", "Kirim"].map((label, index) => (
          <div key={label} className="rounded-[10px] bg-[#eff8f6] px-1 py-2 text-center">
            <span className="mx-auto grid size-5 place-items-center rounded-full bg-[#0c6478] text-[8px] font-extrabold text-white">{index + 1}</span>
            <span className="mt-1 block text-[7px] font-bold text-[#52616b]">{label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "camera") {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-[#eff8f6] p-3 text-[#0c6478]">
        <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-white shadow-sm"><Camera className="size-4" /></span>
        <div><b className="block text-[9px]">Kamera belakang</b><span className="text-[8px] text-[#667985]">Ambil bukti tanpa keluar dari laporan</span></div>
      </div>
    );
  }
  if (type === "community-fields") {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ["Ramp", "Ada"],
          ["Tangga", "Tidak"],
          ["Guiding block", "Ada"],
          ["Teduh", "65%"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[11px] bg-[#f2f8f7] p-2.5">
            <span className="block text-[7px] font-bold text-[#7b8b94]">{label}</span>
            <b className="mt-1 block text-[9px] text-[#0c6478]">{value}</b>
          </div>
        ))}
      </div>
    );
  }
  if (type === "quorum") {
    return (
      <div className="mt-4 rounded-[14px] bg-[#eff8f6] p-3">
        <div className="flex items-center justify-between">
          <b className="text-[9px] text-[#0c6478]">Konsensus komunitas</b>
          <span className="rounded-full bg-white px-2 py-1 text-[8px] font-extrabold text-[#0c6478]">3/3</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => <span key={item} className="grid h-7 place-items-center rounded-lg bg-[#18aa96] text-[9px] font-extrabold text-white">✓ {item}</span>)}
        </div>
      </div>
    );
  }
  if (type === "score-impact") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-[14px] border border-[#d8e8e6] p-3">
        <div className="grid size-11 place-items-center rounded-full bg-[#0c6478] text-[12px] font-extrabold text-white">82</div>
        <div className="min-w-0 flex-1">
          <b className="block text-[9px] text-[#173c61]">Skor ruas dihitung ulang</b>
          <span className="mt-1 block text-[8px] leading-4 text-[#667985]">Rute, keteduhan, dan alasan rekomendasi ikut diperbarui.</span>
        </div>
      </div>
    );
  }
  if (type === "overview") {
    return (
      <div className="mt-4 flex items-center gap-2 text-[#0c6478]">
        {[MapPin, Route, Camera].map((Icon, index) => (
          <span key={index} className="grid size-9 place-items-center rounded-[11px] bg-[#eff8f6]"><Icon className="size-4" /></span>
        ))}
        <span className="ml-1 text-[9px] font-bold text-[#667985]">Cari · bandingkan · laporkan</span>
      </div>
    );
  }
  return null;
}

export default function HelpGuide({ onPanelChange }) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState(null);
  const [wideViewport, setWideViewport] = useState(false);
  const dialogRef = useRef(null);
  const step = helpGuideSteps[stepIndex];
  const finalStep = stepIndex === helpGuideSteps.length - 1;
  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / helpGuideSteps.length) * 100),
    [stepIndex],
  );

  const updateSpotlight = useCallback(() => {
    if (!open) return;
    setWideViewport(window.innerWidth >= 640);
    setSpotlight(getSpotlightRect(helpGuideSteps[stepIndex].target));
  }, [open, stepIndex]);

  const closeGuide = useCallback((completed = false) => {
    if (completed) localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    setSpotlight(null);
  }, []);

  const goToStep = useCallback((nextIndex) => {
    const nextStep = helpGuideSteps[nextIndex];
    if (!nextStep) return;
    if (Object.prototype.hasOwnProperty.call(nextStep, "panel")) onPanelChange?.(nextStep.panel);
    if (nextStep.action) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("akseskota:guide-action", { detail: { action: nextStep.action } }));
      }, 0);
    }
    setStepIndex(nextIndex);
  }, [onPanelChange]);

  const startGuide = useCallback(() => {
    goToStep(0);
    setOpen(true);
  }, [goToStep]);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") return undefined;
    const timer = window.setTimeout(startGuide, 1100);
    return () => window.clearTimeout(timer);
  }, [startGuide]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const target = findVisibleTarget(helpGuideSteps[stepIndex].target);
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      updateSpotlight();
    });
    const settleTimer = window.setTimeout(updateSpotlight, 520);
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [open, stepIndex, updateSpotlight]);

  useEffect(() => {
    if (!open) return undefined;
    dialogRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") closeGuide(false);
      if (event.key === "ArrowLeft" && stepIndex > 0) goToStep(stepIndex - 1);
      if (event.key === "ArrowRight" && !finalStep) goToStep(stepIndex + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeGuide, finalStep, goToStep, open, stepIndex]);

  const placeBesideTarget =
    wideViewport && spotlight && spotlight.left + spotlight.width < window.innerWidth * 0.58;
  const targetNearMobileBottom =
    !wideViewport && spotlight && spotlight.top > window.innerHeight * 0.56;

  return (
    <>
      <button
        type="button"
        onClick={startGuide}
        aria-label="Buka panduan AksesKota"
        className="absolute bottom-[96px] left-4 z-[58] grid size-11 place-items-center rounded-[15px] border border-white/80 bg-white/95 text-[#0c6478] shadow-[0_10px_26px_rgba(23,60,97,.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[#effaf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35cbb0] sm:bottom-[58px] sm:left-[19px] sm:z-[62] sm:size-[42px] sm:rounded-[13px]"
      >
        <CircleHelp className="size-[19px]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200]">
          {spotlight ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-[18px] border-2 border-[#8ef0dc] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{
                ...spotlight,
                boxShadow:
                  "0 0 0 9999px rgba(6,31,41,.72), 0 0 0 5px rgba(142,240,220,.17), 0 18px 60px rgba(0,0,0,.24)",
              }}
            >
              <span className="absolute -bottom-3 -right-3 grid size-9 animate-bounce place-items-center rounded-full bg-[#8ef0dc] text-[#073c47] shadow-lg motion-reduce:animate-none">
                <MousePointer2 className="size-4 fill-current" />
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-[#061f29]/78 backdrop-blur-[2px]" />
          )}

          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-guide-title"
            tabIndex={-1}
            className={`absolute inset-x-3 overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(1,26,35,.3)] outline-none sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:w-[360px] sm:-translate-y-1/2 ${
              targetNearMobileBottom
                ? "top-[max(12px,env(safe-area-inset-top))]"
                : "bottom-[max(12px,env(safe-area-inset-bottom))]"
            } ${
              placeBesideTarget ? "sm:right-7" : "sm:left-1/2 sm:-translate-x-1/2"
            }`}
          >
            <div className="h-1 bg-[#e4f4f1]">
              <div className="h-full rounded-r-full bg-[#18aa96] transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-extrabold tracking-[.18em] text-[#18aa96]">{step.eyebrow}</p>
                  <p className="mt-2 text-[10px] font-bold text-[#8a98a4]">{stepIndex + 1} dari {helpGuideSteps.length}</p>
                </div>
                <button
                  type="button"
                  onClick={() => closeGuide(false)}
                  aria-label="Tutup panduan"
                  className="grid size-9 place-items-center rounded-full bg-[#f2f6f6] text-[#52616b] transition hover:bg-[#e5f2ef] hover:text-[#0c6478]"
                >
                  <X className="size-4" />
                </button>
              </div>

              <h2 id="help-guide-title" className="mt-5 text-[22px] font-extrabold leading-[1.18] tracking-[-.035em] text-[#122d38] sm:text-[24px]">
                {step.title}
              </h2>
              <p className="mt-3 text-[12px] font-medium leading-6 text-[#667985]">{step.description}</p>
              <StepDemo type={step.demo} />
              {step.hint && (
                <p className="mt-4 rounded-[12px] bg-[#f5f8f8] px-3 py-2.5 text-[9px] font-semibold leading-4 text-[#5f727c]">
                  <CircleHelp className="mr-1.5 inline size-3 text-[#18aa96]" />
                  {step.hint}
                </p>
              )}

              <div className="mt-6 flex items-center gap-2">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => goToStep(stepIndex - 1)}
                    className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-[#dce6e7] text-[#0c6478] transition hover:bg-[#f2faf8]"
                    aria-label="Langkah sebelumnya"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => closeGuide(true)}
                    className="h-11 rounded-[14px] px-3 text-[11px] font-extrabold text-[#71818c] transition hover:bg-[#f4f7f7]"
                  >
                    Lewati
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (finalStep ? closeGuide(true) : goToStep(stepIndex + 1))}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#0c6478] px-5 text-[11px] font-extrabold text-white shadow-[0_8px_22px_rgba(12,100,120,.22)] transition hover:-translate-y-0.5 hover:bg-[#09596a] active:translate-y-0"
                >
                  {finalStep ? (
                    <>Mulai menjelajah <Check className="size-4" /></>
                  ) : (
                    <>Lanjut <ArrowRight className="size-4" /></>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

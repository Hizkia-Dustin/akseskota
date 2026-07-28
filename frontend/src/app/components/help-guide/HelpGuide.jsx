"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, CircleHelp, MapPin, MousePointer2, Route, X } from "lucide-react";
import { helpGuideSteps } from "./guideSteps";
import {
  findVisibleGuideTarget,
  getGuideSpotlightRect,
  waitForGuideTarget,
} from "./guideTarget";

const STORAGE_KEY = "akseskota-help-guide-completed-v4";

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
  if (type === "directory-add") {
    return (
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[["1", "Lokasi"], ["2", "Foto"], ["3", "Validasi"]].map(([number, label]) => <div key={number} className="rounded-[11px] bg-[#eff8f6] p-2 text-center"><span className="mx-auto grid size-6 place-items-center rounded-full bg-[#0c6478] text-[8px] font-extrabold text-white">{number}</span><b className="mt-1.5 block text-[7px] text-[#52616b]">{label}</b></div>)}
      </div>
    );
  }
  if (type === "directory-status") {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[["bg-[#eaf8f3] text-[#0c796d]", "✓ Terverifikasi ada"], ["bg-[#fff1f2] text-[#b42318]", "× Terverifikasi tidak"], ["bg-[#fff7ed] text-[#9a3412]", "! Indikasi sumber"], ["bg-[#f2f4f7] text-[#667085]", "? Belum ada bukti"]].map(([classes, label]) => <span key={label} className={`rounded-[10px] px-2 py-2 text-center text-[7px] font-extrabold ${classes}`}>{label}</span>)}
      </div>
    );
  }
  if (type === "directory-correction") {
    return (
      <div className="mt-4 rounded-[14px] border border-[#d8e8e6] p-3"><b className="text-[9px] text-[#173c61]">Parkir aksesibel</b><div className="mt-2 grid grid-cols-2 gap-2"><span className="rounded-lg bg-[#eaf8f3] p-2 text-center text-[8px] font-bold text-[#0c796d]">Ada</span><span className="rounded-lg bg-[#fff1f2] p-2 text-center text-[8px] font-bold text-[#b42318]">Tidak ada</span></div></div>
    );
  }
  if (type === "directory-impact") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-[14px] bg-[#eff8f6] p-3"><span className="grid size-9 place-items-center rounded-full bg-[#18aa96] text-[13px] font-extrabold text-white">3</span><div><b className="block text-[9px] text-[#0c6478]">Konsensus tercapai</b><span className="text-[8px] text-[#667985]">Status fasilitas diperbarui</span></div></div>
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
  const [preparing, setPreparing] = useState(false);
  const dialogRef = useRef(null);
  const transitionTokenRef = useRef(0);
  const step = helpGuideSteps[stepIndex];
  const finalStep = stepIndex === helpGuideSteps.length - 1;
  const progress = useMemo(
    () => Math.round(((stepIndex + 1) / helpGuideSteps.length) * 100),
    [stepIndex],
  );

  const updateSpotlight = useCallback(() => {
    if (!open) return;
    setWideViewport(window.innerWidth >= 640);
    const target = helpGuideSteps[stepIndex].target;
    const nextRect = getGuideSpotlightRect(target);
    if (!target || nextRect) setSpotlight(nextRect);
  }, [open, stepIndex]);

  const closeGuide = useCallback((completed = false) => {
    transitionTokenRef.current += 1;
    if (completed) localStorage.setItem(STORAGE_KEY, "true");
    setPreparing(false);
    setOpen(false);
    setSpotlight(null);
  }, []);

  const goToStep = useCallback(async (nextIndex) => {
    const nextStep = helpGuideSteps[nextIndex];
    if (!nextStep) return;

    const token = transitionTokenRef.current + 1;
    transitionTokenRef.current = token;
    setPreparing(true);
    if (Object.prototype.hasOwnProperty.call(nextStep, "panel")) onPanelChange?.(nextStep.panel);
    if (nextStep.action) {
      window.setTimeout(() => {
        if (transitionTokenRef.current !== token) return;
        window.dispatchEvent(new CustomEvent("akseskota:guide-action", { detail: { action: nextStep.action } }));
      }, 260);
    }

    const nextSpotlight = await waitForGuideTarget(nextStep.target, {
      isCancelled: () => transitionTokenRef.current !== token,
    });
    if (transitionTokenRef.current !== token) return;

    setStepIndex(nextIndex);
    setSpotlight(nextSpotlight);
    setWideViewport(window.innerWidth >= 640);
    setPreparing(false);
  }, [onPanelChange]);

  const startGuide = useCallback(() => {
    setOpen(true);
    void goToStep(0);
  }, [goToStep]);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") return undefined;
    const timer = window.setTimeout(startGuide, 1100);
    return () => window.clearTimeout(timer);
  }, [startGuide]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const target = findVisibleGuideTarget(helpGuideSteps[stepIndex].target);
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      updateSpotlight();
    });
    const settleTimers = [520, 1100, 1700].map((delay) => window.setTimeout(updateSpotlight, delay));
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      window.cancelAnimationFrame(frame);
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [open, stepIndex, updateSpotlight]);

  useEffect(() => {
    if (!open) return undefined;
    dialogRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") closeGuide(false);
      if (event.key === "ArrowLeft" && stepIndex > 0 && !preparing) void goToStep(stepIndex - 1);
      if (event.key === "ArrowRight" && !finalStep && !preparing) void goToStep(stepIndex + 1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeGuide, finalStep, goToStep, open, preparing, stepIndex]);

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
        <div className="pointer-events-none fixed inset-0 z-[200]">
          {spotlight ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-[18px] border-2 border-[#8ef0dc] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{
                ...spotlight,
                boxShadow:
                  `0 0 0 9999px rgba(6,31,41,${wideViewport ? ".72" : ".48"}), 0 0 0 5px rgba(142,240,220,.17), 0 18px 60px rgba(0,0,0,.24)`,
              }}
            >
              <span className="absolute -bottom-3 -right-3 grid size-9 animate-bounce place-items-center rounded-full bg-[#8ef0dc] text-[#073c47] shadow-lg motion-reduce:animate-none">
                <MousePointer2 className="size-4 fill-current" />
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-[#061f29]/50 backdrop-blur-[1px] sm:bg-[#061f29]/78 sm:backdrop-blur-[2px]" />
          )}

          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby="help-guide-title"
            tabIndex={-1}
            data-lenis-prevent="true"
            className={`pointer-events-auto absolute inset-x-3 max-h-[46dvh] overflow-y-auto rounded-[22px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(1,26,35,.3)] outline-none sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:max-h-none sm:w-[360px] sm:overflow-hidden sm:rounded-[26px] sm:-translate-y-1/2 ${
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
            <div className="p-4 sm:p-6">
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

              <h2 id="help-guide-title" className="mt-3 text-[18px] font-extrabold leading-[1.18] tracking-[-.035em] text-[#122d38] sm:mt-5 sm:text-[24px]">
                {step.title}
              </h2>
              <p className="mt-2 text-[10px] font-medium leading-[1.15rem] text-[#667985] sm:mt-3 sm:text-[12px] sm:leading-6">{step.description}</p>
              <div className="hidden sm:block"><StepDemo type={step.demo} /></div>
              {step.hint && (
                <p className="mt-3 rounded-[12px] bg-[#f5f8f8] px-3 py-2 text-[8px] font-semibold leading-4 text-[#5f727c] sm:mt-4 sm:py-2.5 sm:text-[9px]">
                  <CircleHelp className="mr-1.5 inline size-3 text-[#18aa96]" />
                  {step.hint}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2 sm:mt-6">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    disabled={preparing}
                    onClick={() => void goToStep(stepIndex - 1)}
                    className="grid size-11 shrink-0 place-items-center rounded-[14px] border border-[#dce6e7] text-[#0c6478] transition hover:bg-[#f2faf8] disabled:opacity-50"
                    aria-label="Langkah sebelumnya"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={preparing}
                    onClick={() => closeGuide(true)}
                    className="h-11 rounded-[14px] px-3 text-[11px] font-extrabold text-[#71818c] transition hover:bg-[#f4f7f7] disabled:opacity-50"
                  >
                    Lewati
                  </button>
                )}
                <button
                  type="button"
                  disabled={preparing}
                  onClick={() => (finalStep ? closeGuide(true) : void goToStep(stepIndex + 1))}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#0c6478] px-5 text-[11px] font-extrabold text-white shadow-[0_8px_22px_rgba(12,100,120,.22)] transition hover:-translate-y-0.5 hover:bg-[#09596a] active:translate-y-0 disabled:cursor-wait disabled:opacity-50"
                >
                  {preparing ? "Menyiapkan tampilan…" : finalStep ? (
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

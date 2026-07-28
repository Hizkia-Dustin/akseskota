"use client";

import { MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

export default function SiteIntro() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      const hideTimer = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(hideTimer);
    }

    document.documentElement.classList.add("site-intro-active");
    let cancelled = false;
    let minimumTimer = 0;
    let fallbackTimer = 0;
    let finishTimer = 0;
    let firstFrame = 0;
    let secondFrame = 0;
    let removeLoadListener = () => {};

    const minimumDuration = new Promise((resolve) => {
      minimumTimer = window.setTimeout(resolve, 1650);
    });

    const documentLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => {
            const handleLoad = () => resolve();
            window.addEventListener("load", handleLoad, { once: true });
            removeLoadListener = () => window.removeEventListener("load", handleLoad);
          });

    const fontsLoaded = document.fonts?.ready
      ? document.fonts.ready.catch(() => undefined)
      : Promise.resolve();

    const allInitialAssetsReady = Promise.all([
      minimumDuration,
      documentLoaded,
      fontsLoaded,
    ]);
    const safeFallback = new Promise((resolve) => {
      fallbackTimer = window.setTimeout(resolve, 10000);
    });

    Promise.race([allInitialAssetsReady, safeFallback]).then(() => {
      if (cancelled) return;

      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (cancelled) return;
          setExiting(true);
          finishTimer = window.setTimeout(() => {
            document.documentElement.classList.remove("site-intro-active");
            setVisible(false);
          }, 700);
        });
      });
    });

    return () => {
      cancelled = true;
      removeLoadListener();
      window.clearTimeout(minimumTimer);
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(finishTimer);
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      document.documentElement.classList.remove("site-intro-active");
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`site-intro ${exiting ? "is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Memuat AksesKota"
      data-loading-state={exiting ? "revealing" : "loading"}
    >
      <span aria-hidden="true" className="site-intro-panel site-intro-panel-main" />
      <span aria-hidden="true" className="site-intro-panel site-intro-panel-accent" />
      <span aria-hidden="true" className="site-intro-grid" />

      <header className="site-intro-header">
        <span className="site-intro-logo">
          <MapPinned aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span>AksesKota</span>
        </span>
        <span>06°35′S / 106°48′E</span>
      </header>

      <div className="site-intro-center">
        <div className="site-intro-kicker">
          <span>Entering</span>
          <span className="site-intro-kicker-line" />
          <span>Bogor, Indonesia</span>
        </div>
        <div className="site-intro-wordmark" aria-hidden="true">
          <span className="site-intro-word-mask"><span>AKSES</span></span>
          <span className="site-intro-word-mask site-intro-word-outline"><span>KOTA</span></span>
        </div>
      </div>

      <footer className="site-intro-footer">
        <span>Inclusive urban mobility</span>
        <span className="site-intro-progress"><span /></span>
        <span className="site-intro-counter">AK / 01</span>
      </footer>
    </div>
  );
}

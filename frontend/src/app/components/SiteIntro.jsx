"use client";

import { MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

const INTRO_KEY = "akseskota-intro-v1";

export default function SiteIntro() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const alreadySeen = window.sessionStorage.getItem(INTRO_KEY);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (alreadySeen || reducedMotion) {
      document.documentElement.dataset.introSeen = "true";
      const hideTimer = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(hideTimer);
    }

    document.documentElement.classList.add("site-intro-active");
    const exitTimer = window.setTimeout(() => setExiting(true), 1750);
    const finishTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(INTRO_KEY, "true");
      document.documentElement.dataset.introSeen = "true";
      document.documentElement.classList.remove("site-intro-active");
      setVisible(false);
    }, 2350);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
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

"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const PageTransitionContext = createContext(null);

const routeLabels = {
  "/": "BERANDA",
  "/masuk": "MASUK",
  "/mulai": "MULAI",
  "/navigasi": "NAVIGASI",
  "/destinasi": "DIREKTORI",
  "/admin/laporan": "MODERASI",
};

function getRouteLabel(href) {
  const pathname = href.split("?")[0].split("#")[0] || "/";
  return routeLabels[pathname] || pathname.split("/").filter(Boolean).at(-1)?.toUpperCase() || "AKSESKOTA";
}

export default function PageTransitionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const navigationTimerRef = useRef(null);
  const fallbackRevealRef = useRef(null);
  const fallbackFinishRef = useRef(null);
  const activeRef = useRef(false);
  const [transition, setTransition] = useState(null);

  const navigate = useCallback(
    (href) => {
      if (!href || activeRef.current) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      activeRef.current = true;
      setTransition({
        href,
        label: getRouteLabel(href),
        phase: "cover",
      });

      navigationTimerRef.current = window.setTimeout(() => router.push(href), 680);
      fallbackRevealRef.current = window.setTimeout(() => {
        setTransition((current) => current ? { ...current, phase: "reveal" } : current);
      }, 920);
      fallbackFinishRef.current = window.setTimeout(() => {
        activeRef.current = false;
        setTransition(null);
      }, 1540);
    },
    [router],
  );

  useEffect(() => {
    if (!activeRef.current) return;

    const revealTimer = window.setTimeout(() => {
      setTransition((current) => current ? { ...current, phase: "reveal" } : current);
    }, 30);
    const finishTimer = window.setTimeout(() => {
      activeRef.current = false;
      setTransition(null);
    }, 700);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(finishTimer);
    };
  }, [pathname]);

  useEffect(() => {
    function interceptInternalLink(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest?.("a[href]");
      if (
        !anchor ||
        anchor.dataset.pageTransition === "manual" ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const current = new URL(window.location.href);
      const sameDocument =
        destination.pathname === current.pathname &&
        destination.search === current.search;

      if (sameDocument && destination.hash) return;
      if (destination.href === current.href) return;

      event.preventDefault();
      navigate(`${destination.pathname}${destination.search}${destination.hash}`);
    }

    document.addEventListener("click", interceptInternalLink, true);
    return () => document.removeEventListener("click", interceptInternalLink, true);
  }, [navigate]);

  useEffect(
    () => () => {
      if (navigationTimerRef.current) window.clearTimeout(navigationTimerRef.current);
      if (fallbackRevealRef.current) window.clearTimeout(fallbackRevealRef.current);
      if (fallbackFinishRef.current) window.clearTimeout(fallbackFinishRef.current);
    },
    [],
  );

  return (
    <PageTransitionContext.Provider value={navigate}>
      {children}
      {transition ? (
        <div
          className={`global-page-transition is-${transition.phase}`}
          role="status"
          aria-live="polite"
          aria-label={`Membuka halaman ${transition.label}`}
        >
          <span aria-hidden="true" className="global-page-transition-panel global-page-transition-panel-one" />
          <span aria-hidden="true" className="global-page-transition-panel global-page-transition-panel-two" />
          <div className="global-page-transition-meta">
            <span>AksesKota®</span>
            <span>Page / {transition.label}</span>
          </div>
          <div className="global-page-transition-label" aria-hidden="true">
            <span>{transition.label}</span>
          </div>
          <div className="global-page-transition-footer">
            <span>Inclusive urban mobility</span>
            <span className="global-page-transition-line"><span /></span>
            <span>Bogor / ID</span>
          </div>
        </div>
      ) : null}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const navigate = useContext(PageTransitionContext);
  if (!navigate) {
    throw new Error("usePageTransition must be used inside PageTransitionProvider");
  }
  return navigate;
}

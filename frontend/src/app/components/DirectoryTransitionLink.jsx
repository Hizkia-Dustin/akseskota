"use client";

import { ArrowLeft, BookOpen, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function DirectoryTransitionOverlay({ returning = false }) {
  return createPortal(
    <div
      className={`directory-transition-overlay ${returning ? "directory-transition-overlay-back" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={returning ? "Kembali ke halaman sebelumnya" : "Membuka Direktori Bogor"}
    >
      <div aria-hidden="true" className="directory-transition-orbit directory-transition-orbit-one" />
      <div aria-hidden="true" className="directory-transition-orbit directory-transition-orbit-two" />
      <div className="directory-transition-card">
        <span className="directory-transition-book">
          {returning ? (
            <ArrowLeft aria-hidden="true" className="size-8" strokeWidth={2.2} />
          ) : (
            <BookOpen aria-hidden="true" className="size-8" strokeWidth={2.2} />
          )}
        </span>
        <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9af3e4]">
          AksesKota
        </p>
        <p className="mt-2 text-center text-[22px] font-extrabold tracking-[-.03em] text-white">
          {returning ? "Kembali ke halaman sebelumnya" : "Membuka Direktori Bogor"}
        </p>
        <p className="mt-2 text-center text-[11px] leading-5 text-white/65">
          {returning
            ? "Mengembalikan posisi halamanmu…"
            : "Menyiapkan tempat dan data aksesibilitas…"}
        </p>
        <span aria-hidden="true" className="directory-transition-progress">
          <span />
        </span>
      </div>
    </div>,
    document.body,
  );
}

export default function DirectoryTransitionLink({
  children = "Buka direktori",
  className = "",
  href = "/destinasi",
  showIcon = true,
  source = "directory",
}) {
  const router = useRouter();
  const timerRef = useRef(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    router.prefetch(href);

    const shouldRestore = window.sessionStorage.getItem("akseskota-directory-restore");
    const savedScroll = Number(
      window.sessionStorage.getItem("akseskota-directory-return-scroll"),
    );

    if (shouldRestore && Number.isFinite(savedScroll)) {
      window.sessionStorage.removeItem("akseskota-directory-restore");
      window.sessionStorage.removeItem("akseskota-directory-return");
      window.sessionStorage.removeItem("akseskota-directory-return-scroll");
      window.setTimeout(() => window.scrollTo({ top: savedScroll, behavior: "auto" }), 60);
      window.setTimeout(() => window.scrollTo({ top: savedScroll, behavior: "auto" }), 280);
    }

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [href, router]);

  function openDirectory(event) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (opening) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }

    setOpening(true);
    window.sessionStorage.setItem(
      "akseskota-directory-return",
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
    window.sessionStorage.setItem(
      "akseskota-directory-return-scroll",
      String(window.scrollY),
    );
    timerRef.current = window.setTimeout(() => router.push(href), 720);
  }

  return (
    <>
      <a
        href={href}
        onClick={openDirectory}
        aria-busy={opening}
        data-directory-transition={source}
        className={`${className} group relative items-center justify-center gap-2 overflow-hidden transition duration-300 hover:-translate-y-0.5 active:translate-y-0 ${opening ? "pointer-events-none" : ""}`}
      >
        <span className="relative z-10">{opening ? "Membuka..." : children}</span>
        {opening ? (
          <LoaderCircle aria-hidden="true" className="relative z-10 size-4 animate-spin" />
        ) : showIcon ? (
          <BookOpen aria-hidden="true" className="relative z-10 size-4 transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-110" />
        ) : null}
      </a>

      {opening && <DirectoryTransitionOverlay />}
    </>
  );
}

export function DirectoryTransitionBackButton({ className = "" }) {
  const router = useRouter();
  const timerRef = useRef(null);
  const [returning, setReturning] = useState(false);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function finishBackNavigation() {
    const returnPath = window.sessionStorage.getItem("akseskota-directory-return");
    const sameSiteReferrer = document.referrer.startsWith(window.location.origin);
    const hasSavedScroll =
      window.sessionStorage.getItem("akseskota-directory-return-scroll") !== null;

    if (hasSavedScroll) {
      window.sessionStorage.setItem("akseskota-directory-restore", "true");
    }

    if (sameSiteReferrer) {
      router.back();
    } else {
      router.push(returnPath || "/");
    }
  }

  function goBack() {
    if (returning) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishBackNavigation();
      return;
    }

    setReturning(true);
    timerRef.current = window.setTimeout(finishBackNavigation, 650);
  }

  return (
    <>
      <button
        type="button"
        onClick={goBack}
        aria-label="Kembali ke halaman sebelumnya"
        aria-busy={returning}
        data-directory-transition-back
        className={`${className} transition duration-300 hover:-translate-x-0.5 hover:bg-[#dff5f1] active:translate-x-0`}
      >
        {returning ? (
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <ArrowLeft aria-hidden="true" className="size-5" />
        )}
      </button>
      {returning && <DirectoryTransitionOverlay returning />}
    </>
  );
}

"use client";

import { BookOpen, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function DirectoryTransitionLink({
  children = "Buka direktori",
  className = "",
  href = "/destinasi",
  source = "directory",
}) {
  const router = useRouter();
  const timerRef = useRef(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    router.prefetch(href);

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
        ) : (
          <BookOpen aria-hidden="true" className="relative z-10 size-4 transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-110" />
        )}
      </a>

      {opening &&
        createPortal(
          <div
            className="directory-transition-overlay"
            role="status"
            aria-live="polite"
            aria-label="Membuka Direktori Bogor"
          >
            <div aria-hidden="true" className="directory-transition-orbit directory-transition-orbit-one" />
            <div aria-hidden="true" className="directory-transition-orbit directory-transition-orbit-two" />
            <div className="directory-transition-card">
              <span className="directory-transition-book">
                <BookOpen aria-hidden="true" className="size-8" strokeWidth={2.2} />
              </span>
              <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[.18em] text-[#9af3e4]">
                AksesKota
              </p>
              <p className="mt-2 text-center text-[22px] font-extrabold tracking-[-.03em] text-white">
                Membuka Direktori Bogor
              </p>
              <p className="mt-2 text-center text-[11px] leading-5 text-white/65">
                Menyiapkan tempat dan data aksesibilitas…
              </p>
              <span aria-hidden="true" className="directory-transition-progress">
                <span />
              </span>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

"use client";

import { useLenis } from "lenis/react";

export default function LenisScrollButton({
  target,
  offset = 0,
  children,
  ...props
}) {
  const lenis = useLenis();

  function handleClick() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (lenis) {
      lenis.scrollTo(target, {
        offset,
        immediate: reduceMotion,
      });
      return;
    }

    document.querySelector(target)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

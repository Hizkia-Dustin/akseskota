"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

// React Strict Mode menjalankan layout effect dua kali saat development.
// WeakSet memastikan elemen DOM yang sama tidak memainkan entrance dua kali.
const animatedElements = new WeakSet();

// React Bits-style entrance motion for UI that appears after an interaction.
export default function MotionSurface({
  as: Tag = "div",
  children,
  className = "",
  direction = "up",
  distance = 24,
  duration = 0.55,
  delay = 0,
  scale = 0.985,
  ease = "power3.out",
  staggerSelector,
  stagger = 0.07,
  animate = true,
  ...props
}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { clearProps: "transform,opacity,visibility" });
      return;
    }

    if (animatedElements.has(element)) {
      gsap.set(element, { x: 0, y: 0, autoAlpha: 1, scale: 1, clearProps: "transform,opacity,visibility" });
      return;
    }
    animatedElements.add(element);

    const offset = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
    }[direction] ?? { y: distance };

    const timeline = gsap.timeline({ delay });
      timeline.fromTo(
        element,
        { ...offset, autoAlpha: 0, scale, transformOrigin: "center center" },
        { x: 0, y: 0, autoAlpha: 1, scale: 1, duration, ease, clearProps: "transform,opacity,visibility" },
      );

      if (staggerSelector) {
        const items = gsap.utils.toArray(staggerSelector, element);
        timeline.fromTo(
          items,
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.38, stagger, ease: "power2.out", clearProps: "transform,opacity,visibility" },
          "-=0.3",
        );
      }
    return () => {
      timeline.kill();
      // Jangan revert ke posisi tersembunyi; itu yang menyebabkan kedipan
      // sebelum Strict Mode menjalankan effect untuk kedua kalinya.
      gsap.set(element, { x: 0, y: 0, autoAlpha: 1, scale: 1, clearProps: "transform,opacity,visibility" });
    };
  }, [animate, delay, direction, distance, duration, ease, scale, stagger, staggerSelector]);

  return <Tag ref={ref} className={className} {...props}>{children}</Tag>;
}

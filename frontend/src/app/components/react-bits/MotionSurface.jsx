"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

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
  ...props
}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(element, { clearProps: "all" });
      return;
    }

    const offset = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
    }[direction] ?? { y: distance };

    const context = gsap.context(() => {
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
    }, element);

    return () => context.revert();
  }, [delay, direction, distance, duration, ease, scale, stagger, staggerSelector]);

  return <Tag ref={ref} className={className} {...props}>{children}</Tag>;
}

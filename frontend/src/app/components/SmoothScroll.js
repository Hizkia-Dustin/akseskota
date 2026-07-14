"use client";

import { ReactLenis } from "lenis/react";

export default function SmoothScroll() {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        anchors: true,
      }}
    />
  );
}
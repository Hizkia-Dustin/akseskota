"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

export default function HeroEntrance({ children }) {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const nav = root.querySelector(".hero-nav");
      const badge = root.querySelector(".hero-badge");
      const title = root.querySelector(".hero-title");
      const copy = root.querySelector(".hero-copy");
      const actions = root.querySelector(".hero-actions");
      const stats = root.querySelector(".hero-stats");
      const illustration = root.querySelector(".hero-illustration");
      const callouts = gsap.utils.toArray(".hero-callout", root);
      const animatedElements = [nav, badge, title, copy, actions, stats, illustration].filter(Boolean);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([...animatedElements, ...callouts], { clearProps: "all" });
        return;
      }

      gsap.set(nav, { autoAlpha: 0, y: -18, scale: 0.985 });
      gsap.set(badge, { autoAlpha: 0, y: 14, scale: 0.9 });
      gsap.set(title, { autoAlpha: 0, y: 36, clipPath: "inset(0 0 100% 0)" });
      gsap.set(copy, { autoAlpha: 0, y: 22 });
      gsap.set(actions, { autoAlpha: 0, y: 18 });
      gsap.set(stats, { autoAlpha: 0, y: 16 });
      gsap.set(illustration, { autoAlpha: 0, x: 22, scale: 0.94, transformOrigin: "center center" });
      gsap.set(callouts, { autoAlpha: 0, y: 20, force3D: true });

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .to(nav, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6 }, 0)
        .to(badge, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.8)" }, 0.16)
        .to(title, { autoAlpha: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 0.82 }, 0.24)
        .to(illustration, { autoAlpha: 1, x: 0, scale: 1, duration: 0.9 }, 0.28)
        .to(copy, { autoAlpha: 1, y: 0, duration: 0.62 }, 0.5)
        .to(actions, { autoAlpha: 1, y: 0, duration: 0.58 }, 0.64)
        .to(stats, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.78);

      callouts.forEach((callout, index) => {
        timeline.to(callout, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: "back.out(1.8)",
        }, 0.68 + index * 0.13);
      });

      timeline.call(() => {
        callouts.forEach((callout, index) => {
          gsap.to(callout, {
            y: index === 1 ? -3.5 : -3,
            duration: 3.2 + index * 0.35,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            force3D: true,
          });
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}

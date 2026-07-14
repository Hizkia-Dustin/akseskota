"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CtaMotion({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let media;
    const ctx = gsap.context(() => {
      const stars = gsap.utils.toArray(".cta-star", root);
      const moon = gsap.utils.toArray(".cta-moon", root);
      const treeGroups = gsap.utils.toArray(".cta-tree", root);
      const treeParts = treeGroups.flatMap((group) => Array.from(group.children));

      media = gsap.matchMedia();
      media.add("(min-width: 1200px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.set(stars, { autoAlpha: 0, scale: 0.25, y: 10, transformOrigin: "center center" });
        gsap.set(moon, {
          autoAlpha: 0.35,
          scale: 0.9,
          y: 42,
          filter: "drop-shadow(0 0 0 rgba(93, 230, 211, 0))",
          transformOrigin: "center center",
        });
        gsap.set(treeParts, { autoAlpha: 0.12, scaleX: 0.65, scaleY: 0.04, transformOrigin: "center bottom" });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "bottom 55%",
            scrub: 0.75,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(moon, {
            autoAlpha: 1,
            scale: 1,
            y: -10,
            filter: "drop-shadow(0 0 9px rgba(93, 230, 211, 0.32))",
            duration: 1.25,
            ease: "power2.out",
          }, 0)
          .to(stars, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, stagger: 0.045, ease: "back.out(2)" }, 0.08)
          .to(treeParts, {
            autoAlpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 0.32,
            stagger: 0,
            ease: "back.out(1.7)",
          }, 1.35);
      });

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([...stars, ...moon, ...treeParts], { clearProps: "all" });
      });
    }, root);

    return () => {
      media?.revert();
      ctx.revert();
    };
  }, []);

  return <div ref={rootRef} className="h-full">{children}</div>;
}

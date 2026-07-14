"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProcessBottomWave from "./ProcessBottomWave";
import ProcessLandscape from "./ProcessLandscape";
import ProcessTopWave from "./ProcessTopWave";

gsap.registerPlugin(ScrollTrigger);

export default function ProcessParallax() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let media;
    const ctx = gsap.context(() => {
      const progress = root.querySelector(".process-progress");
      const cards = gsap.utils.toArray(".process-card", root);
      const connectors = gsap.utils.toArray(".process-connector", root);
      const trees = gsap.utils
        .toArray(".process-tree", root)
        .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      const treeBatches = [trees.slice(0, 5), trees.slice(5, 10), trees.slice(10)];
      const markerGroups = gsap.utils.toArray(".process-marker", root);
      const markerParts = markerGroups.map((marker) =>
        Array.from(marker.children).filter(
          (child) => !child.classList.contains("process-connector")
        )
      );
      media = gsap.matchMedia();

      media.add("(min-width: 1200px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.set(progress, {
          clipPath: "inset(0 100% 0 0)",
          transformOrigin: "left center",
        });
        gsap.set(cards, { autoAlpha: 0, y: 34, scale: 0.96 });
        gsap.set(connectors, {
          autoAlpha: 0,
          scaleY: 0,
          transformOrigin: "center bottom",
        });
        gsap.set(trees, {
          autoAlpha: 0.12,
          scaleX: 0.62,
          scaleY: 0.04,
          transformOrigin: "center bottom",
        });
        markerParts.forEach((parts) => {
          gsap.set(parts, { scale: 0.82, opacity: 0.55, transformOrigin: "center center" });
        });

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "+=2200",
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        const revealStep = (index, remainingClip) => {
          timeline
            .to(progress, { clipPath: `inset(0 ${remainingClip}% 0 0)`, duration: 1 })
            .to(treeBatches[index], {
              autoAlpha: 1,
              scaleX: 1,
              scaleY: 1,
              duration: 0.58,
              stagger: 0.08,
              ease: "back.out(1.8)",
            }, "<")
            .to(markerParts[index], {
              keyframes: [
                { scale: 1.35, y: -5, opacity: 1, duration: 0.22, ease: "power2.out" },
                { scale: 1, y: 0, opacity: 1, duration: 0.28, ease: "bounce.out" },
              ],
            })
            .to(connectors[index], {
              autoAlpha: 1,
              scaleY: 1,
              duration: 0.3,
              ease: "power2.out",
            })
            .to(cards[index], {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.55,
              ease: "power3.out",
            });
        };

        revealStep(0, 80);
        revealStep(1, 47);
        revealStep(2, 13);
        timeline.to(progress, { clipPath: "inset(0 0% 0 0)", duration: 0.5 });

        return () => timeline.scrollTrigger?.kill();
      });

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(progress, { clearProps: "all" });
        gsap.set(cards, { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set(connectors, { clearProps: "all" });
        gsap.set(trees, { clearProps: "all" });
        markerParts.forEach((parts) => gsap.set(parts, { clearProps: "all" }));
      });

    }, root);

    return () => {
      media?.revert();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="process-parallax bg-[#f0fdf9]">
      <div className="h-[72px] w-full"><ProcessTopWave /></div>
      <div className="h-[340px] w-full"><ProcessLandscape /></div>
      <div className="h-[72px] w-full"><ProcessBottomWave /></div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function CountUp({ to, from = 0, duration = 1.6, decimals = 0, prefix = "", suffix = "", className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const formatter = new Intl.NumberFormat("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const renderValue = (value) => { el.textContent = `${prefix}${formatter.format(value)}${suffix}`; };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      renderValue(to);
      return;
    }

    const counter = { value: from };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        value: to,
        duration,
        ease: "power2.out",
        snap: decimals === 0 ? { value: 1 } : undefined,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onStart: () => renderValue(from),
        onUpdate: () => renderValue(counter.value),
        onComplete: () => renderValue(to),
      });
    }, el);

    return () => ctx.revert();
  }, [to, from, duration, decimals, prefix, suffix]);

  const initial = new Intl.NumberFormat("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(from);
  return <span ref={ref} className={className} suppressHydrationWarning>{prefix}{initial}{suffix}</span>;
}

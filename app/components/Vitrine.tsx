"use client";

import { useEffect } from "react";

/*
 * The Vitrine: every chapter is a glass plate in a dim case, with the blueprint lanes
 * still visible through it. When a plate's end comes up the screen it stops there,
 * sinks back into the case and dims, and the next plate slides straight over it.
 * A raking light follows the cursor across the plate under it, catching its engraved
 * frame. This only sets CSS variables on the existing sections; nothing is re-rendered.
 * With reduced motion the plates stay flat and still.
 */
export default function Vitrine() {
  useEffect(() => {
    const plates = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
    if (!plates.length) return;
    const root = document.documentElement;
    root.classList.add("vitrine");
    plates.forEach((p, i) => {
      const label = p.querySelector(".chapter-label")?.textContent?.replace(/^\d+\s*/, "").trim() || (i === 0 ? "Aditya Kadlabal Sripad" : p.id);
      p.dataset.plate = `PLATE ${String(i + 1).padStart(2, "0")} · ${label}`;
      p.style.zIndex = String(i + 1);
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let bottoms: number[] = [], vh = 0, raf = 0;

    // Measure where each plate ends in the document, ignoring our own transforms.
    const measure = () => {
      vh = window.innerHeight;
      bottoms = plates.map((p) => p.offsetTop + p.offsetHeight);
    };

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      plates.forEach((p, i) => {
        // How far the plate's end has risen above the bottom of the screen. The last plate never sinks.
        const s = i === plates.length - 1 || reduced.matches ? 0 : Math.max(0, Math.min(vh, y + vh - bottoms[i]));
        if (s === 0) {
          if (p.style.transform) { p.style.transform = ""; p.style.removeProperty("--sink"); }
          return;
        }
        const k = s / vh;
        const ease = 1 - (1 - k) * (1 - k);
        // Pin it (move down as fast as the page moves up), shrink it back, let the next plate cover it.
        p.style.transform = `translate3d(0, ${s}px, 0) scale(${1 - ease * 0.08})`;
        p.style.setProperty("--sink", ease.toFixed(3));
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };

    // The raking light: a soft highlight that sits wherever the cursor is on the plate below it.
    const onMove = (e: PointerEvent) => {
      const p = (e.target as Element).closest?.<HTMLElement>("main > section");
      if (!p) return;
      const r = p.getBoundingClientRect();
      p.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      p.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    const remeasure = () => { measure(); queue(); };
    measure(); update();
    const ro = new ResizeObserver(remeasure);
    plates.forEach((p) => ro.observe(p));
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("pointermove", onMove, { passive: true });
    reduced.addEventListener("change", remeasure);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("pointermove", onMove);
      reduced.removeEventListener("change", remeasure);
      root.classList.remove("vitrine");
      plates.forEach((p) => { p.style.transform = ""; p.style.zIndex = ""; delete p.dataset.plate; });
    };
  }, []);

  return null;
}

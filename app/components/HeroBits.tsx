"use client";

import { useEffect, useRef, useState } from "react";

/** Types out each phrase, holds, erases, moves on. Shows the first phrase without JS. */
export function RotatingWords({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(words[0].length);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setInterval(() => setI((x) => (x + 1) % words.length), 3200);
      return () => clearInterval(id);
    }
    const word = words[i];
    const id = setTimeout(() => {
      if (!deleting && n < word.length) setN(n + 1);
      else if (!deleting) setDeleting(true);
      else if (n > 0) setN(n - 1);
      else { setDeleting(false); setI((i + 1) % words.length); }
    }, !deleting && n === word.length ? 2200 : deleting ? 28 : 55);
    return () => clearTimeout(id);
  }, [i, n, deleting, words]);

  const word = words[i];
  return (
    <span className="rw" aria-live="off">
      <span className="rw-text">{word.slice(0, Math.min(n, word.length))}</span>
      <span className="rw-caret" aria-hidden="true" />
    </span>
  );
}

/** Animated count-up stat cards. Values are parsed from strings like "1,000+" or "~10%". */
/** A deterministic barcode from a string, so each label gets its own. */
function bars(text: string) {
  let h = 2166136261;
  return Array.from({ length: 30 }, (_, i) => {
    h = Math.imul(h ^ text.charCodeAt(i % text.length), 16777619) >>> 0;
    return 1 + (h % 3);
  });
}

/** Animated count-up stats, printed like specimen / lot labels. Values are parsed from strings like "1,000+" or "~10%". */
export function StatCards({ stats }: { stats: { value: string; label: string; href: string; lot: string; source: string }[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const [on, setOn] = useState(false);
  const [t, setT] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!on) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 1600;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  return (
    <ul ref={ref} className="stat-cards">
      {stats.map((s) => {
        const m = s.value.match(/^(\D*)([\d,]+)(.*)$/);
        const shown = m ? `${m[1]}${Math.round(Number(m[2].replace(/,/g, "")) * (on ? t : 1)).toLocaleString("en-US")}${m[3]}` : s.value;
        return (
          <li key={s.label}>
            <a className="stat-card spot" href={s.href}>
              <span className="sc-top" aria-hidden="true"><b>{s.lot}</b>{s.source}</span>
              <div>
                <strong aria-label={s.value}>{shown}</strong>
              </div>
              <span>{s.label}</span>
              <span className="sc-code" aria-hidden="true">{bars(s.label).map((w, i) => <i key={i} style={{ width: w }} />)}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

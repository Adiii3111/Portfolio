"use client";

import { useEffect, useSyncExternalStore } from "react";

/*
 * A bank of four physical-looking keys — morning, afternoon, evening, night — plus an
 * Auto key that follows the visitor's clock. The mood lives on <html data-time>, with
 * data-theme carrying the light/dark tone (both set before first paint in layout.tsx).
 */

export type Time = "morning" | "afternoon" | "evening" | "night";
const TIMES: { id: Time; label: string; icon: React.ReactNode }[] = [
  { id: "morning", label: "Morning", icon: <><path d="M3 17h18M6 17a6 6 0 0 1 12 0" /><path d="M12 6V3.5M5.2 9.2 3.6 7.6M18.8 9.2l1.6-1.6" /><path d="M8 20.5h8" /></> },
  { id: "afternoon", label: "Afternoon", icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></> },
  { id: "evening", label: "Evening", icon: <><path d="M3 15h18M6.5 15a5.5 5.5 0 0 1 11 0" /><path d="M5 18.5h14M8 21.5h8" /><path d="M12 6.5v-3" /></> },
  { id: "night", label: "Night", icon: <><path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7Z" /><path d="M17 3.5v3M15.5 5h3" /></> },
];

export const clockTime = (d = new Date()): Time => {
  const h = d.getHours();
  return h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "afternoon" : h >= 17 && h < 20 ? "evening" : "night";
};

const subscribe = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time", "data-time-mode"] });
  return () => mo.disconnect();
};
const read = () => `${document.documentElement.dataset.time ?? "night"}|${document.documentElement.dataset.timeMode ?? "auto"}`;

function setMood(time: Time, mode: "auto" | "manual", from?: HTMLElement) {
  const root = document.documentElement;
  if (root.dataset.time === time && root.dataset.timeMode === mode) return;
  const apply = () => {
    root.dataset.time = time;
    root.dataset.timeMode = mode;
    root.dataset.theme = time === "morning" || time === "afternoon" ? "light" : "dark";
  };
  try { localStorage.setItem("aks-time", mode === "auto" ? "auto" : time); } catch {}
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!from || !document.startViewTransition || reduced || root.dataset.time === time) return apply();
  // Each mood arrives its own way (see "Mood transitions" in globals.css): morning rises from
  // the bottom like dawn, afternoon flares in like midday glare, evening sinks the old page
  // like a setting sun, night closes the lights in from the edges.
  root.dataset.vt = time;
  document.startViewTransition(apply).finished.finally(() => { delete root.dataset.vt; });
}

export default function TimeKeys() {
  const [time, mode] = useSyncExternalStore(subscribe, read, () => "night|auto").split("|") as [Time, "auto" | "manual"];

  // In auto mode, follow the clock as the day goes on.
  useEffect(() => {
    if (mode !== "auto") return;
    // Read the real mode: during hydration the store briefly reports the server default.
    const tick = () => { if (document.documentElement.dataset.timeMode !== "manual") setMood(clockTime(), "auto"); };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [mode]);

  return (
    <div className="time-keys" role="group" aria-label="Time of day">
      {TIMES.map((t) => (
        <button
          key={t.id}
          className="tk-key"
          aria-pressed={time === t.id}
          aria-label={`${t.label}${time === t.id && mode === "auto" ? " (now, from your clock)" : ""}`}
          title={t.label}
          onClick={(e) => setMood(t.id, "manual", e.currentTarget)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">{t.icon}</svg>
          <i className="tk-led" aria-hidden="true" />
        </button>
      ))}
      <button
        className="tk-key tk-auto"
        aria-pressed={mode === "auto"}
        title="Follow my clock"
        onClick={(e) => setMood(clockTime(), "auto", e.currentTarget)}
      >
        Auto<i className="tk-led" aria-hidden="true" />
      </button>
    </div>
  );
}

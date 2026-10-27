"use client";

import { useSyncExternalStore } from "react";
import { perfuse } from "./moodTransition";

/*
 * One physical-looking key showing the current mood: morning, afternoon, evening or night.
 * The page always opens on the visitor's time of day (set before first paint in layout.tsx);
 * each press moves on to the next mood. The mood lives on <html data-time>, with data-theme
 * carrying the light/dark tone.
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
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-time"] });
  return () => mo.disconnect();
};
const read = () => (document.documentElement.dataset.time ?? "night") as Time;

let busy = false;
function setMood(time: Time) {
  const root = document.documentElement;
  const apply = () => {
    root.dataset.time = time;
    root.dataset.theme = time === "morning" || time === "afternoon" ? "light" : "dark";
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  if (busy) return;
  // The heartbeat (moodTransition.ts): lights down, blood streams in, a heartbeat trace beats and pumps
  // the new mood out across the page.
  busy = true;
  perfuse(time, () => { apply(); setTimeout(() => { busy = false; }, 760); });
}

export default function TimeKeys() {
  const time = useSyncExternalStore(subscribe, read, () => "night" as Time);
  const i = TIMES.findIndex((t) => t.id === time);
  const now = TIMES[Math.max(0, i)], next = TIMES[(Math.max(0, i) + 1) % TIMES.length];

  return (
    <button
      className="tk-key tk-one"
      aria-label={`Mood: ${now.label}. Switch to ${next.label}`}
      title={`${now.label} — click for ${next.label.toLowerCase()}`}
      onClick={() => setMood(next.id)}
    >
      <svg key={now.id} viewBox="0 0 24 24" aria-hidden="true">{now.icon}</svg>
      <span>{now.label}</span>
      <i className="tk-led" aria-hidden="true" />
    </button>
  );
}

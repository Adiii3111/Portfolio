"use client";

import { useEffect, useRef, useState } from "react";
import RoleMatch from "./RoleMatch";
import AeternusAsk from "./AeternusAsk";
import "./aeternus-dock.css";

/*
 * AETERNUS lives in the bottom corner. The launcher opens it over the page with two
 * modes: Ask (questions about Aditya, the default) and Match (a job description read
 * against the portfolio). Both stay mounted while closed or hidden, so a conversation,
 * a report and the Toolkit lens all survive. Any link to #match opens the Match mode,
 * and the jump links inside close the dock so the page can scroll underneath.
 */
type Tab = "ask" | "match";

export default function AeternusDock() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("ask");
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href="#match"]');
      if (a) { e.preventDefault(); setTab("match"); setOpen(true); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      const t = e.target as HTMLElement;
      if (e.key === "/" && !t.closest("input, textarea, [contenteditable]")) { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("aeternus-open", open);
    if (!open) return;
    const field = panel.current?.querySelector<HTMLElement>(tab === "ask" ? "[data-aa-input]" : ".rm textarea");
    field?.focus({ preventScroll: true });
  }, [open, tab]);

  // Click: a dragon leaves the circle, flies to the centre and opens its wings; then AETERNUS opens.
  const [flight, setFlight] = useState<{ x: number; y: number } | null>(null);
  const launch = () => {
    if (open || flight) return;
    const r = launcher.current?.getBoundingClientRect();
    if (!r || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOpen(true); return; }
    setFlight({ x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - window.innerHeight / 2 });
    window.setTimeout(() => setOpen(true), 1550);
    window.setTimeout(() => setFlight(null), 1900);
  };

  const close = () => { setOpen(false); launcher.current?.focus({ preventScroll: true }); };

  // Arrow keys move between the two tabs.
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = tab === "ask" ? "match" : "ask";
    setTab(next);
    panel.current?.querySelector<HTMLElement>(`#ae-tab-${next}`)?.focus();
  };

  return (
    <>
      <button ref={launcher} className={`ae-launch ${open ? "is-open" : ""} ${flight ? "is-launching" : ""}`} onClick={launch} aria-expanded={open} aria-controls="aeternus" aria-label="Open AETERNUS — ask anything about Aditya" title="AETERNUS — ask anything (/)">
        <svg className="ae-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7Z" /><path d="M12 7v10M7.5 9.5l9 5M16.5 9.5l-9 5" /></svg>
      </button>

      {flight && (
        <div className="ae-flight" aria-hidden="true" style={{ "--x0": `${flight.x}px`, "--y0": `${flight.y}px` } as React.CSSProperties}>
          <div className="ae-flyer"><Dragon /></div>
          <div className="ae-flight-word">AETERNUS</div>
        </div>
      )}

      <div className="ae-backdrop" hidden={!open} onClick={close} />
      <div
        id="aeternus"
        ref={panel}
        className="ae-panel"
        role="dialog"
        aria-modal="true"
        aria-label="AETERNUS — Intelligence Beyond Limits"
        hidden={!open}
        onClickCapture={(e) => { if ((e.target as Element).closest(".rm-show, .aa-jump")) setOpen(false); }}
      >
        <div className="ae-inner">
          <div className="ae-bar">
            <span className="ae-bar-id">AETERNUS <em>· Intelligence Beyond Limits</em></span>
            <div className="ae-tabs" role="tablist" aria-label="AETERNUS modes" onKeyDown={onTabKey}>
              {([["ask", "Ask about Aditya"], ["match", "Match a role"]] as const).map(([id, label]) => (
                <button key={id} id={`ae-tab-${id}`} role="tab" type="button" className="ae-tab" aria-selected={tab === id} aria-controls={`ae-pane-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>
                  {label}
                </button>
              ))}
            </div>
            <button className="ae-close" onClick={close} aria-label="Close AETERNUS">Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="ae-body">
            <div id="ae-pane-ask" role="tabpanel" aria-labelledby="ae-tab-ask" hidden={tab !== "ask"}>
              <AeternusAsk onMatchRole={() => setTab("match")} />
            </div>
            <div id="ae-pane-match" role="tabpanel" aria-labelledby="ae-tab-match" hidden={tab !== "match"}>
              <RoleMatch />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* The dragon seen from behind as it climbs: body on the centre line, a bat wing on each
   side hinged at the shoulder (the left one is the right one mirrored). */
function Dragon() {
  const wing = (
    <g className="ae-wing">
      <path d="M16 -48 C40 -70 66 -96 92 -112 L196 -98 C172 -84 168 -68 182 -38 C160 -44 150 -28 150 14 C130 0 116 6 104 34 C84 14 50 8 14 8 Z" />
      <path className="ae-bone" d="M92 -112 L190 -97 M92 -112 L182 -38 M92 -112 L150 14 M92 -112 L104 34 M16 -48 L92 -112" />
      <path d="M92 -112 L97 -126 L101 -110 Z" />
    </g>
  );
  return (
    <svg className="ae-dragon" viewBox="-200 -150 400 310">
      {wing}
      <g transform="scale(-1 1)">{wing}</g>
      <g className="ae-body">
        <path d="M7 -80 C9 -66 15 -58 17 -46 C21 -26 19 -4 13 14 C10 26 7 36 5 48 L-5 48 C-7 36 -10 26 -13 14 C-19 -4 -21 -26 -17 -46 C-15 -58 -9 -66 -7 -80 Z" />
        <path d="M5 44 C6 70 22 84 30 102 C36 116 30 130 16 138 C24 128 26 116 20 104 C12 88 -6 72 -5 44 Z" />
        <path d="M17 136 L2 132 L10 146 L24 152 L22 134 Z" />
        <path d="M0 -132 C7 -125 11 -115 12 -104 L13 -96 C13 -90 10 -84 7 -79 L-7 -79 C-10 -84 -13 -90 -13 -96 L-12 -104 C-11 -115 -7 -125 0 -132 Z" />
        <path d="M9 -101 L32 -122 L14 -93 Z M-9 -101 L-32 -122 L-14 -93 Z" />
        <path d="M13 22 L26 38 L21 39 L27 48 L17 42 L15 47 L8 32 Z M-13 22 L-26 38 L-21 39 L-27 48 L-17 42 L-15 47 L-8 32 Z" />
      </g>
      <path className="ae-bone" d="M0 -60 V30 M-6 -40 H6 M-7 -22 H7 M-6 -4 H6" />
    </svg>
  );
}

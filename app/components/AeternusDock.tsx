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
  const [launching, setLaunching] = useState(false);
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

  // The dragon takes off first, then the panel opens behind it.
  const launch = () => {
    if (open || launching) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setOpen(true); return; }
    setLaunching(true);
    window.setTimeout(() => { setOpen(true); setLaunching(false); }, 520);
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
      <button ref={launcher} className={`ae-launch ${open ? "is-open" : ""} ${launching ? "is-launching" : ""}`} onClick={launch} aria-expanded={open} aria-controls="aeternus" aria-label="Open AETERNUS — ask anything about Aditya">
        <span className="ae-mark" aria-hidden="true">
          <Dragon />
        </span>
        <span className="ae-word"><b>AETERNUS</b><i>Ask me anything</i></span>
      </button>

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

/* AETERNUS's mark: a dragon in flight, cut like a tattoo, breathing fire. */
function Dragon() {
  return (
    <svg className="ae-dragon" viewBox="-4 -4 138 72">
      <g className="ae-dragon-body">
        <path d="M92 22 C86 26 82 30 76 32 C68 35 60 37 52 39 C42 41 34 46 28 52 C22 58 14 60 8 56 C16 64 26 62 33 56 C40 50 48 47 56 47 C64 47 72 44 80 40 C86 36 90 32 94 28 Z" />
        <path d="M10 55 L0 49 L4 57 L-1 65 L10 59 Z" />
        <path d="M92 22 C94 16 98 13 103 13 L115 15 L106 19 L111 21.5 L100 24 C97 27 95 28 94 28 Z" />
        <path d="M96 14 L85 4 L99 12 Z M100.5 13 L97 2 L104 12.5 Z" />
        <path className="ae-dragon-wing" d="M74 32 C72 22 70 12 66 5 L28 1 C39 9 42 13 35 17 C46 19 50 23 43 29 C52 31 56 35 58 40 Z" />
        <path d="M77 40 L80 47 L77 47 L83 52 L84 47 L87 51 L85 44 Z M55 46 L53 54 L50 54 L54 59 L56 55 L58 59 L58 51 Z" />
      </g>
      <path className="ae-dragon-cut" d="M66 6 L35 17 M66 6 L43 29 M66 6 L56 38 M40 46 C48 43 56 42 64 41 M30 54 C34 51 37 49 41 47" />
      <path className="ae-dragon-fire" d="M102 15.5 L105 16 L102.5 17.4 Z M114 19 C119 17 124 15 130 15 C125 18 122 20 120 23 C124 22 127 23 130 25 C124 26 118 25 112 22 Z" />
    </svg>
  );
}

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
      <button ref={launcher} className={`ae-launch ${open ? "is-open" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="aeternus" aria-label="Open AETERNUS — ask anything about Aditya">
        <span className="ae-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 12C9.6 8.4 3.5 8.4 3.5 12C3.5 15.6 9.6 15.6 12 12C14.4 8.4 20.5 8.4 20.5 12C20.5 15.6 14.4 15.6 12 12Z" /><path className="ae-trace" pathLength={1} d="M12 12C9.6 8.4 3.5 8.4 3.5 12C3.5 15.6 9.6 15.6 12 12C14.4 8.4 20.5 8.4 20.5 12C20.5 15.6 14.4 15.6 12 12Z" /></svg>
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

"use client";

import { useEffect, useState } from "react";
import TimeKeys from "./TimeKeys";
import Monogram from "./Monogram";
import { person, sections } from "../content";
import QuickConnect from "./QuickConnect";

const headerLinks = ["about", "journey", "experience", "work", "research", "lab", "contact"];

export default function SiteNav() {
  const [active, setActive] = useState("top");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setProgress(window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Which chapter is under the header line → active link.
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-40px 0px -85% 0px" },
    );
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) spy.observe(el); });

    // Gentle reveal-on-scroll. Content stays visible if this never runs.
    document.documentElement.classList.add("js-reveal");
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); } }),
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));

    return () => { window.removeEventListener("scroll", onScroll); spy.disconnect(); reveal.disconnect(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="tracker" aria-hidden="true">
        <span className="tracker-fill" style={{ transform: `scaleX(${progress})` }} />
        <span className="tracker-vial" style={{ left: `${progress * 100}%` }}><svg viewBox="0 0 12 24"><path d="M3 1h6M4 1v16a2 2 0 0 0 4 0V1" /><path className="tracker-blood" d="M4 10h4v7a2 2 0 0 1-4 0Z" /></svg></span>
      </div>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <a className="brand" href="#top" aria-label={`${person.fullName} — back to top`}>
          <Monogram />
        </a>
        <nav className="header-nav" aria-label="Primary">
          {headerLinks.map((id) => {
            const s = sections.find((x) => x.id === id)!;
            return <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined}>{s.short}</a>;
          })}
        </nav>
        <TimeKeys />
        <QuickConnect className="header-cta">Connect</QuickConnect>
        <button className="menu-toggle" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>
          <span>{open ? "Close" : "Menu"}</span>
        </button>
      </header>

      <div id="site-menu" className={`site-menu ${open ? "open" : ""}`} hidden={!open}>
        <ol>
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setOpen(false)} aria-current={active === s.id ? "true" : undefined}>
                <span>{String(i + 1).padStart(2, "0")}</span>{s.label}
              </a>
            </li>
          ))}
        </ol>
        <QuickConnect className="btn btn-gold menu-connect" onOpen={() => setOpen(false)}>Connect</QuickConnect>
        <p>{person.email}<br />{person.collegeEmail}</p>
      </div>

      <nav className="chapter-rail" aria-label="Chapters">
        {sections.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>
            <span className="rail-label">{String(i + 1).padStart(2, "0")} · {s.label}</span>
            <i />
          </a>
        ))}
      </nav>
    </>
  );
}

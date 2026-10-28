"use client";

import { useEffect, useState } from "react";
import TimeKeys from "./TimeKeys";
import Monogram from "./Monogram";
import { person, sections } from "../content";
import ContactLauncher from "./ContactLauncher";

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
        {/* ECG trace fills in as you scroll; the ambulance rides the leading edge. */}
        <span className="tracker-fill" style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }} />
        <span className="tracker-ambulance" style={{ left: `calc(${progress * 100}% - ${progress * 20}px)` }}>
          <svg viewBox="0 0 20 12">
            <path className="amb-body" d="M1 9.5V3.2C1 2.5 1.5 2 2.2 2H12v7.5ZM12 4h3.4l2.8 3v2.5H12Z" />
            <path className="amb-cross" d="M6.5 3.6v4M4.5 5.6h4" />
            <path className="amb-window" d="M13 5h2l1.8 2H13Z" />
            <circle className="amb-wheel" cx="4.5" cy="10" r="1.5" />
            <circle className="amb-wheel" cx="15" cy="10" r="1.5" />
            <rect className="amb-siren" x="9" y="0.6" width="2" height="1.4" rx=".4" />
          </svg>
        </span>
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
        <ContactLauncher className="header-cta">Connect</ContactLauncher>
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

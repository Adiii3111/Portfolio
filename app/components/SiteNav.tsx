"use client";

import { useEffect, useState } from "react";
import { person, sections } from "../content";
import ContactLauncher from "./ContactLauncher";

const headerLinks = ["about", "journey", "experience", "work", "research", "lab", "running", "resume", "contact"];

export default function SiteNav() {
  const [active, setActive] = useState("top");
  const [theme, setTheme] = useState("dark");
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

    // Which chapter is under the header line → active link + header colouring.
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        setActive(el.id);
        setTheme(el.dataset.theme ?? "dark");
      }),
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
      <div className="progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <header className={`site-header ${scrolled ? "is-scrolled" : ""} theme-${open ? "dark" : theme}`}>
        <a className="brand" href="#top" aria-label={`${person.fullName} — back to top`}>
          <span className="brand-mark">AKS</span>
          <span className="brand-name">{person.fullName}</span>
        </a>
        <nav className="header-nav" aria-label="Primary">
          {headerLinks.map((id) => {
            const s = sections.find((x) => x.id === id)!;
            return <a key={id} href={`#${id}`} aria-current={active === id ? "true" : undefined}>{s.short}</a>;
          })}
        </nav>
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

      <nav className={`chapter-rail theme-${theme}`} aria-label="Chapters">
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

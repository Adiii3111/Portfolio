"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { person } from "../content";

/**
 * The header's "Connect": a short panel for visitors who want to reach Aditya
 * without scrolling to the end. Gmail and Outlook open a new message to him,
 * ready to type; LinkedIn opens his profile; Phone calls or texts. Nothing to
 * copy and paste. The longer "Start a conversation" form stays in the Contact
 * section.
 */
const SUBJECT = "Hello Aditya — via your portfolio";
const BODY = "Hi Aditya,\n\n";
const enc = encodeURIComponent;
export default function QuickConnect({ className, children, onOpen }: { className?: string; children: React.ReactNode; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => firstLink.current?.focus(), 50);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 2000); } catch { setCopied("Copy failed — select the text instead"); }
  };

  const ways: { name: string; value: string; href: string; external?: boolean; copy?: string; copyLabel?: string }[] = [
    { name: "Gmail", value: person.email, href: `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(person.email)}&su=${enc(SUBJECT)}&body=${enc(BODY)}`, external: true },
    { name: "Outlook", value: person.email, href: `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(person.email)}&subject=${enc(SUBJECT)}&body=${enc(BODY)}`, external: true },
    { name: "LinkedIn", value: "Message me on LinkedIn", href: person.linkedin, external: true },
    { name: "Phone", value: `Call or text ${person.phone}`, href: person.phoneHref, copy: person.phone, copyLabel: "Phone number copied" },
  ];

  return (
    <>
      <button type="button" className={className} onClick={() => { onOpen?.(); setOpen(true); }}>{children}</button>
      {open && createPortal(
        <div className="cl-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="cl-panel qc-panel" role="dialog" aria-modal="true" aria-labelledby="qc-title" onClick={(e) => e.stopPropagation()}>
            <button className="cl-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <p className="cl-kicker">Connect</p>
            <h2 id="qc-title">Let’s <em>talk.</em></h2>
            <ul className="qc-list">
              {ways.map((w, i) => (
                <li key={w.name} className="qc-item">
                  <a ref={i === 0 ? firstLink : undefined} className="qc-main" href={w.href} {...(w.external && { target: "_blank", rel: "noreferrer" })}>
                    <b>{w.name}{w.external && " ↗"}</b><span>{w.value}</span>
                  </a>
                  {w.copy && <button type="button" className="qc-copy" onClick={() => copy(w.copy!, w.copyLabel ?? "Copied")} aria-label={`Copy ${w.copy}`}>Copy</button>}
                </li>
              ))}
            </ul>
            <p className="qc-status" aria-live="polite">{copied}</p>
            <a className="qc-more" href="#contact" onClick={() => setOpen(false)}>Prefer to write a message? Start a conversation →</a>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

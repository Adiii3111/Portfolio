"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { person } from "../content";

const topics = ["Full-time role", "Collaboration", "Research", "AgileFlowSprinter", "Just saying hello"];

/**
 * Opens an on-page "start a conversation" panel. The site has no backend, so a
 * message is sent through the visitor's own mail (Gmail / Outlook web),
 * pre-filled and addressed to Aditya — with LinkedIn and phone as
 * alternatives.
 */
export default function ContactLauncher({ className, children }: { className?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"write" | "send">("write");
  const [copied, setCopied] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => firstField.current?.focus(), 50);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const subject = `${topic} — ${name || "Hello"} via your portfolio`;
  const body = `Hi Aditya,\n\n${message}\n\n— ${name}${from ? `\n${from}` : ""}`;
  const enc = encodeURIComponent;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(person.email)}&su=${enc(subject)}&body=${enc(body)}`;
  const outlook = `https://outlook.live.com/mail/0/deeplink/compose?to=${enc(person.collegeEmail)}&subject=${enc(subject)}&body=${enc(body)}`;

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 2000); } catch { setCopied("Copy failed — select the text instead"); }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => { setOpen(true); setStep("write"); }}>{children}</button>
      {/* Portal to <body> so no section's stacking context can trap the dialog under the header. */}
      {open && createPortal(
        <div className="cl-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div className="cl-panel" role="dialog" aria-modal="true" aria-labelledby="cl-title" onClick={(e) => e.stopPropagation()}>
            <button className="cl-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <p className="cl-kicker">Start a conversation</p>
            <h2 id="cl-title">{step === "write" ? <>Tell me what’s <em>on your mind.</em></> : <>Choose how to <em>send it.</em></>}</h2>

            {step === "write" ? (
              <form className="cl-form" onSubmit={(e) => { e.preventDefault(); setStep("send"); }}>
                <div className="cl-topics" role="group" aria-label="Topic">
                  {topics.map((t) => <button type="button" key={t} className={t === topic ? "is-on" : undefined} aria-pressed={t === topic} onClick={() => setTopic(t)}>{t}</button>)}
                </div>
                <div className="cl-row">
                  <label><span>Your name</span><input ref={firstField} required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
                  <label><span>Company or school <i>(optional)</i></span><input value={from} onChange={(e) => setFrom(e.target.value)} autoComplete="organization" /></label>
                </div>
                <label><span>Message</span><textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi Aditya — I’d love to talk about…" /></label>
                <button type="submit" className="btn btn-gold cl-next">Continue →</button>
              </form>
            ) : (
              <div className="cl-send">
                <p className="cl-preview"><strong>{subject}</strong><br />{message.length > 140 ? message.slice(0, 140) + "…" : message}</p>
                <div className="cl-options">
                  <a href={gmail} target="_blank" rel="noreferrer" className="cl-option"><b>Gmail</b><span>Write to {person.email}</span></a>
                  <a href={outlook} target="_blank" rel="noreferrer" className="cl-option"><b>Outlook</b><span>Write to {person.collegeEmail}</span></a>
                  {/* LinkedIn can't be opened with a message filled in, so the message is copied as they click: on the profile they only press Message and paste. */}
                  <a href={person.linkedin} target="_blank" rel="noreferrer" className="cl-option" onClick={() => copy(`${subject}\n\n${body}`, "Your message is copied — press Message on LinkedIn and paste it")}><b>LinkedIn</b><span>Message me on LinkedIn</span></a>
                  <a href={person.phoneHref} className="cl-option"><b>Phone</b><span>Call or text {person.phone}</span></a>
                </div>
                <p className="cl-copy" aria-live="polite">{copied}</p>
                <button type="button" className="cl-back" onClick={() => setStep("write")}>← Edit message</button>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

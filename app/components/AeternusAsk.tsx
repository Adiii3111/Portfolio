"use client";

import "./aeternus-ask.css";
import { useEffect, useRef, useState } from "react";
import * as content from "../content";
import { asset } from "../lib/asset";
import { RESUMES } from "./RoleMatch";
import { ask, buildIndex, newContext, STARTERS, type Answer } from "./aeternusAskEngine";

// Built once: every fact on the site, indexed for retrieval.
const INDEX = buildIndex({ ...content, resumes: RESUMES });

type Msg = { id: number; from: "you" | "ae"; text?: string; answer?: Answer };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll to a section (after the dock closes) and make the matching element pulse. */
function jumpTo(section: string, find?: string) {
  window.setTimeout(() => {
    const root = document.querySelector(section);
    if (!root) return;
    let target: Element = root;
    if (find) {
      for (const el of Array.from(root.querySelectorAll("h3, p, li, button, dt, dd, strong, blockquote"))) {
        if (el.textContent?.includes(find)) { target = el; break; }
      }
    }
    target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: target === root ? "start" : "center" });
    target.classList.remove("rm-pulse");
    void (target as HTMLElement).offsetWidth;
    target.classList.add("rm-pulse");
    window.setTimeout(() => target.classList.remove("rm-pulse"), 2800);
  }, 60);
}

export default function AeternusAsk({ onMatchRole, seed }: { onMatchRole?: () => void; seed?: { q: string; n: number } }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const ctx = useRef(newContext());
  const nextId = useRef(1);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  // Keep the newest message in view.
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [msgs, thinking]);

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q || thinking) return;
    if (/^match a role/i.test(q) && onMatchRole) { onMatchRole(); return; }
    setMsgs((m) => [...m, { id: nextId.current++, from: "you", text: q }]);
    setDraft("");
    setThinking(true);
    const answer = ask(q, INDEX, ctx.current);
    // A short, length-based pause so the reply reads as considered (no randomness).
    const delay = reducedMotion() ? 0 : 420 + Math.min(420, q.length * 7);
    timer.current = window.setTimeout(() => {
      setMsgs((m) => [...m, { id: nextId.current++, from: "ae", answer }]);
      setThinking(false);
      input.current?.focus({ preventScroll: true });
    }, delay);
  };

  // A question picked from the launcher's teaser is asked as soon as the panel opens.
  useEffect(() => { if (seed) send(seed.q); }, [seed?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = [...msgs].reverse().find((m) => m.answer)?.answer;
  const chips = msgs.length ? last?.suggestions ?? [] : STARTERS;

  return (
    <div className="aa">
      <header className="aa-head">
        <p className="aa-wordmark" aria-label="AETERNUS — Intelligence Beyond Limits"><b>AETERNUS</b><i>Intelligence Beyond Limits</i></p>
      </header>

      <div ref={log} className="aa-log" role="log" aria-live="polite" aria-label="Conversation with AETERNUS">
        {!msgs.length && (
          <div className="aa-msg aa-ae aa-welcome">
            <span className="aa-who">AETERNUS · 00</span>
            <p className="aa-lead">Ask me anything about Aditya — his co-op at Vaxxinova, his blood supply chain research, his projects, tools, education, leadership, or how to reach him.</p>
          </div>
        )}
        {msgs.map((m, i) =>
          m.from === "you" ? (
            <div key={m.id} className="aa-msg aa-you"><span className="aa-who">You</span><p>{m.text}</p></div>
          ) : (
            <div key={m.id} className={`aa-msg aa-ae ${m.answer?.unknown ? "is-unknown" : ""}`}>
              <span className="aa-who">AETERNUS · {String(Math.ceil((i + 1) / 2)).padStart(2, "0")}</span>
              <p className="aa-lead">{m.answer!.lead}</p>
              {m.answer!.bullets.length > 0 && <ul className="aa-points">{m.answer!.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
              {m.answer!.resumes && (
                <ul className="aa-cvs">
                  {m.answer!.resumes.map((r, k) => (
                    <li key={r.code}><a href={asset(r.file)} download className={k === 0 ? "is-top" : undefined}><b>{r.code}</b>{r.name}<span aria-hidden="true">↓</span></a></li>
                  ))}
                </ul>
              )}
              {(m.answer!.links.length > 0 || m.answer!.email) && (
                <p className="aa-actions">
                  {m.answer!.links.map((l) => (
                    <button key={l.section} type="button" className="aa-jump" onClick={() => jumpTo(l.section, l.find)}>Jump to {l.label} →</button>
                  ))}
                  {m.answer!.email && <a className="aa-mail" href={`mailto:${content.person.email}`}>Email Aditya</a>}
                </p>
              )}
            </div>
          ),
        )}
        {thinking && <div className="aa-msg aa-ae aa-typing" aria-label="AETERNUS is thinking"><span className="aa-who">AETERNUS</span><span className="aa-dots" aria-hidden="true"><i /><i /><i /></span></div>}
      </div>

      <div className="aa-foot">
        {chips.length > 0 && (
          <div className="aa-chips" aria-label="Suggested questions">
            {chips.map((c) => <button key={c} type="button" onClick={() => send(c)} disabled={thinking}>{c}</button>)}
          </div>
        )}
        <form className="aa-form" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <label htmlFor="aa-input" className="aa-sr">Ask AETERNUS about Aditya</label>
          <input id="aa-input" ref={input} data-aa-input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about his work, research, tools, education…" autoComplete="off" maxLength={300} />
          <button type="submit" disabled={!draft.trim() || thinking}>Ask</button>
        </form>
      </div>
    </div>
  );
}

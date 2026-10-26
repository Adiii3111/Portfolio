"use client";

import "./role-match.css";
import { useEffect, useId, useRef, useState } from "react";
import { person } from "../content";
import { asset } from "../lib/asset";
import { analyze, DIM_LABEL, SAMPLES, tailoredIntro, type Report, type ResumeKey } from "./roleMatchEngine";

/*
 * Role Match: a visitor pastes a job posting and the portfolio reads it, lines every
 * requirement up against evidence on this site, admits what isn't shown, picks the
 * right résumé, and lights up the matching skills across the page ("the lens").
 * Everything runs in the browser; nothing is sent anywhere.
 */

export const RESUMES: Record<ResumeKey, { code: string; name: string; blurb: string; file: string }> = {
  sco: { code: "SCO", name: "Supply Chain & Operations", blurb: "Planning, MRP, logistics, Lean, and operations research.", file: "/resumes/Aditya-Kadlabal-Sripad-Supply-Chain-and-Operations.pdf" },
  bda: { code: "BDA", name: "Business & Data Analytics", blurb: "Forecasting, segmentation, churn scoring, Python and dashboards.", file: "/resumes/Aditya-Kadlabal-Sripad-Business-and-Data-Analytics.pdf" },
  hsc: { code: "HSC", name: "Healthcare Supply Chain", blurb: "Blood and vaccine supply chains, cold chain, hospital planning.", file: "/resumes/Aditya-Kadlabal-Sripad-Healthcare-Supply-Chain.pdf" },
};
const RESUME_ORDER: ResumeKey[] = ["sco", "bda", "hsc"];

function verdict(score: number) {
  if (score >= 75) return "Strong match";
  if (score >= 55) return "Good match";
  if (score >= 35) return "Partial match";
  return "Different field";
}

/** A short, stable reference for the report (derived from the posting text). */
function reportId(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `RM-${(h >>> 0).toString(16).slice(0, 5).toUpperCase()}`;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Scroll to the evidence and make it pulse briefly. */
function showMe(section: string, find?: string) {
  const root = document.querySelector(section);
  if (!root) return;
  let target: Element = root;
  if (find) {
    const candidates = root.querySelectorAll("h3, p, li, button, dt, dd, strong, blockquote");
    for (const el of Array.from(candidates)) {
      if (el.textContent?.includes(find)) { target = el; break; }
    }
  }
  target.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: target === root ? "start" : "center" });
  target.classList.remove("rm-pulse");
  void (target as HTMLElement).offsetWidth;
  target.classList.add("rm-pulse");
  window.setTimeout(() => target.classList.remove("rm-pulse"), 2800);
}

function applyLens(report: Report | null) {
  document.querySelectorAll(".rm-hit").forEach((el) => el.classList.remove("rm-hit"));
  if (!report) { delete document.documentElement.dataset.lens; return; }
  const names = new Set(report.matched.flatMap((m) => m.signal.lens ?? []));
  document.querySelectorAll(".tk-group button").forEach((b) => { if (names.has(b.textContent?.trim() ?? "")) b.classList.add("rm-hit"); });
  document.documentElement.dataset.lens = "on";
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch { return false; }
}

export default function RoleMatch() {
  const [text, setText] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [tried, setTried] = useState(false);
  const [lensOn, setLensOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rid, setRid] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => () => applyLens(null), []);

  const run = (value: string) => {
    const r = analyze(value);
    setTried(true);
    setReport(r);
    setRid(r ? reportId(value) : "");
    setCopied(false);
    applyLens(r);
    setLensOn(!!r);
    if (r && window.innerWidth < 900) window.setTimeout(() => reportRef.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" }), 60);
  };

  const clearLens = () => { applyLens(null); setLensOn(false); };
  const reset = () => { setText(""); setReport(null); setTried(false); clearLens(); };

  const r = report;
  const R = 52, C = 2 * Math.PI * R;
  const resume = r ? RESUMES[r.resume] : null;
  const mail = r
    ? `mailto:${person.email}?subject=${encodeURIComponent("A role that matches your portfolio")}&body=${encodeURIComponent(`Hi Aditya,\n\nI ran a role through AETERNUS on your portfolio (${verdict(r.score).toLowerCase()}, ${r.score}/100) and would like to talk.\n\nRole: \n\n`)}`
    : "";

  return (
    <div className="rm">
      <div className="rm-intake">
        <p className="rm-wordmark" aria-label="AETERNUS — Intelligence Beyond Limits">
          <span className="rm-wordmark-name">AETERNUS</span>
          <span className="rm-wordmark-tag">Intelligence Beyond Limits</span>
        </p>
        <p className="rm-kicker">Step 1 · The specimen</p>
        <label htmlFor={inputId} className="rm-label">Paste a job description</label>
        <textarea
          id={inputId}
          className="rm-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(text); }}
          placeholder="Paste the posting here — responsibilities, requirements, tools…"
          rows={11}
          spellCheck={false}
        />
        <div className="rm-row">
          <button type="button" className="rm-btn rm-btn-gold" onClick={() => run(text)} disabled={!text.trim()}>Run AETERNUS</button>
          {(text || r) && <button type="button" className="rm-btn" onClick={reset}>Clear</button>}
        </div>
        <div className="rm-samples">
          <p>No posting handy? Try a sample:</p>
          <ul>
            {SAMPLES.map((s) => (
              <li key={s.id}><button type="button" onClick={() => { setText(s.text); run(s.text); }}><i>Sample</i>{s.label}</button></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rm-report" ref={reportRef} aria-live="polite">
        {!r ? (
          <div className="rm-empty">
            <p className="rm-kicker">Step 2 · The readout</p>
            <h3>The portfolio reads the role, then rearranges itself around it.</h3>
            <ol>
              <li><span>01</span>Every requirement is lined up against real evidence on this site.</li>
              <li><span>02</span>What isn’t shown is listed honestly — no inflated score.</li>
              <li><span>03</span>Matching skills light up across the page, and the right résumé is picked for you.</li>
            </ol>
            {tried && <p className="rm-warn">That looks too short to read as a job posting — paste a few lines of responsibilities or requirements.</p>}
          </div>
        ) : (
          <div className="rm-sheet" key={rid}>
            <header className="rm-sheet-head">
              <span>AETERNUS report</span>
              <span className="rm-mono">{rid} · {r.words} words read</span>
            </header>

            <div className="rm-score">
              <svg viewBox="0 0 128 128" className="rm-ring" role="img" aria-label={`Match score ${r.score} out of 100`}>
                <circle cx="64" cy="64" r={R} className="rm-ring-track" />
                <circle cx="64" cy="64" r={R} className="rm-ring-fill" strokeDasharray={C} style={{ ["--rm-off" as string]: `${C * (1 - r.score / 100)}`, ["--rm-c" as string]: `${C}` }} />
              </svg>
              <div className="rm-score-num"><strong>{r.score}</strong><span>/ 100</span></div>
              <div className="rm-score-text">
                <p className="rm-verdict">{verdict(r.score)}</p>
                <p>{r.matched.length} requirement{r.matched.length === 1 ? "" : "s"} with evidence here · {r.gaps.length} not shown on this site.</p>
                <details className="rm-how">
                  <summary>How is this scored?</summary>
                  <p>The posting is scanned for requirement terms. Each one either has evidence on this site or it doesn’t. The score is the weighted share that does (domain and methods weigh more than tools; leadership less). Terms the posting repeats count a little more, and very short postings are pulled toward the middle because there’s less to go on.</p>
                </details>
              </div>
            </div>

            <ul className="rm-dims">
              {r.dims.map((d, i) => (
                <li key={d.dim}>
                  <span>{DIM_LABEL[d.dim]}</span>
                  <span className="rm-bar" aria-hidden="true"><i style={{ width: d.asked ? `${(100 * d.matched) / d.asked}%` : "0%", animationDelay: `${0.15 + i * 0.08}s` }} /></span>
                  <span className="rm-mono">{d.asked ? `${d.matched}/${d.asked}` : "not asked"}</span>
                </li>
              ))}
            </ul>

            {r.matched.length > 0 && (
              <section className="rm-block">
                <h4>Evidence</h4>
                <ol className="rm-evidence">
                  {r.matched.map((m, i) => (
                    <li key={m.signal.id} style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                      <div className="rm-ev-head">
                        <strong>{m.signal.label}</strong>
                        <span className="rm-terms">{m.hits.slice(0, 3).map((h) => <em key={h}>“{h}”</em>)}</span>
                      </div>
                      <ul>
                        {m.signal.evidence.map((e) => (
                          <li key={e.source + e.proof}>
                            <p><b>{e.source}.</b> {e.proof}</p>
                            <button type="button" className="rm-show" onClick={() => showMe(e.section, e.find)}>Show me →</button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {(r.gaps.length > 0 || (r.years ?? 0) >= 2) && (
              <section className="rm-block">
                <h4>Honest gaps</h4>
                <ul className="rm-gaps">
                  {r.gaps.map((g) => (
                    <li key={g.gap.id}><span>Not shown on this site:</span> <strong>{g.gap.label}</strong>{g.gap.note ? <> — {g.gap.note}</> : null} <em>Ask me about it.</em></li>
                  ))}
                  {(r.years ?? 0) >= 2 && (
                    <li><span>Experience:</span> the posting mentions {r.years}+ years. I’m completing an M.S. (December 2026) after a co-op at Vaxxinova US, three industry internships, and a client-advisor role at NoBroker.com.</li>
                  )}
                </ul>
              </section>
            )}

            {resume && (
              <section className="rm-block rm-resume">
                <div>
                  <h4>Recommended résumé</h4>
                  <p className="rm-resume-name"><span className="rm-code">{resume.code}</span>{resume.name}</p>
                  <p className="rm-resume-blurb">{resume.blurb}</p>
                </div>
                <div className="rm-resume-actions">
                  <a className="rm-btn rm-btn-gold" href={asset(resume.file)} download>Download {resume.code} ↓</a>
                  <p>Other versions: {RESUME_ORDER.filter((k) => k !== r.resume).map((k, i) => (
                    <span key={k}>{i ? " · " : ""}<a href={asset(RESUMES[k].file)} download>{RESUMES[k].code}</a></span>
                  ))}</p>
                </div>
              </section>
            )}

            <div className="rm-actions">
              <button type="button" className="rm-btn" onClick={async () => setCopied(await copyText(tailoredIntro(r)))}>{copied ? "Copied ✓" : "Copy a tailored intro"}</button>
              <a className="rm-btn" href={mail}>Email Aditya about this role</a>
              {lensOn
                ? <button type="button" className="rm-btn rm-btn-quiet" onClick={clearLens}>Clear the lens</button>
                : <button type="button" className="rm-btn rm-btn-quiet" onClick={() => { applyLens(r); setLensOn(true); }}>Turn the lens back on</button>}
            </div>
            {lensOn && <p className="rm-lens-note">The lens is on: matching skills are highlighted in the Toolkit. Use “Show me” to jump to any piece of evidence.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** "Résumé ↓" with a small menu of the three versions. */
export function ResumePicker({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); };
  }, [open]);

  return (
    <div className="rm-picker" ref={ref}>
      <button type="button" className={className} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>Résumé ↓</button>
      {open && (
        <div className="rm-picker-menu" id={menuId}>
          <p>Pick the version that fits the role</p>
          <ul>
            {RESUME_ORDER.map((k) => (
              <li key={k}>
                <a href={asset(RESUMES[k].file)} download onClick={() => setOpen(false)}>
                  <span className="rm-code">{RESUMES[k].code}</span>
                  <span><strong>{RESUMES[k].name}</strong><em>{RESUMES[k].blurb}</em></span>
                </a>
              </li>
            ))}
          </ul>
          <a className="rm-picker-match" href="#match" onClick={() => setOpen(false)}>Not sure? Let AETERNUS choose →</a>
        </div>
      )}
    </div>
  );
}

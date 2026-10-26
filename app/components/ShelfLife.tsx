"use client";

import "./shelf-life.css";
import { useEffect, useReducer } from "react";

/*
 * Shelf Life — run a hospital blood bank for one 60-second shift.
 * Bags age a day every second; hospital wards ask for units of a given type.
 * Issue compatible bags before requests time out (shortage) and before bags
 * expire (waste) — the trade-off studied in the blood supply chain paper.
 * Everything is synthetic. Randomness is seeded and only runs after "Start shift",
 * so the server and the browser render the same idle screen.
 */

export type Blood = "O−" | "O+" | "A−" | "A+" | "B−" | "B+" | "AB−" | "AB+";
const TYPES: Blood[] = ["O−", "O+", "A−", "A+", "B−", "B+", "AB−", "AB+"];
// Rough population frequencies, so common types are requested and donated more often.
const FREQ: Record<Blood, number> = { "O+": 38, "A+": 34, "B+": 9, "AB+": 3, "O−": 7, "A−": 6, "B−": 2, "AB−": 1 };

const abo = (t: Blood) => t.slice(0, -1);
const neg = (t: Blood) => t.endsWith("−");

/** Red-cell compatibility: can a donor bag of type `donor` go to a patient of type `patient`? */
export function compatible(donor: Blood, patient: Blood) {
  if (neg(patient) && !neg(donor)) return false;
  const d = abo(donor), p = abo(patient);
  return d === "O" || d === p || p === "AB";
}

function why(donor: Blood, patient: Blood) {
  if (neg(patient) && !neg(donor)) return `${patient} patients need Rh-negative blood — ${donor} would sensitise them.`;
  return `${donor} can’t go to a ${patient} patient — their plasma would attack the ${abo(donor)} antigens.`;
}

const SLOTS = 12;
const SHIFT = 60;
const WARDS = ["Trauma bay", "Surgery", "Oncology", "Maternity", "ICU", "Haematology"];

type Bag = { id: number; type: Blood; life: number; max: number; expired?: number };
type Req = { id: number; ward: string; type: Blood; need: number; filled: number; ttl: number; max: number };
type Msg = { text: string; kind: "good" | "bad" | "info"; id: number };

type State = {
  phase: "idle" | "run" | "over";
  t: number;
  seed: number;
  nextId: number;
  slots: (Bag | null)[];
  reqs: Req[];
  selected: number | null;
  nextDonation: number;
  nextRequest: number;
  transshipped: number;
  shake: { id: number; until: number } | null;
  msg: Msg | null;
  plays: number;
  stats: { issued: number; shortage: number; wasted: number; supplied: number; score: number; fefo: number };
};

export const initial: State = {
  phase: "idle", t: 0, seed: 20261207, nextId: 1, slots: Array(SLOTS).fill(null), reqs: [], selected: null,
  nextDonation: 0, nextRequest: 0, transshipped: 0, shake: null, msg: null, plays: 0,
  stats: { issued: 0, shortage: 0, wasted: 0, supplied: 0, score: 0, fefo: 0 },
};

type Action = { type: "start" } | { type: "tick"; dt: number } | { type: "select"; id: number } | { type: "issue"; id: number } | { type: "transship" };

/** Deterministic generator (mulberry32) whose state lives in the reducer. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, seed: () => a };
}

function pickType(r: () => number): Blood {
  const total = TYPES.reduce((s, t) => s + FREQ[t], 0);
  let x = r() * total;
  for (const t of TYPES) { x -= FREQ[t]; if (x < 0) return t; }
  return "O+";
}

function donate(s: State, r: () => number, count: number) {
  const slots = [...s.slots];
  let { nextId } = s;
  let added = 0;
  for (let k = 0; k < count; k++) {
    const free = slots.map((b, i) => (b ? -1 : i)).filter((i) => i >= 0);
    if (!free.length) break;
    const i = free[Math.floor(r() * free.length)];
    const max = 9 + Math.floor(r() * 14);
    slots[i] = { id: nextId++, type: pickType(r), life: max, max };
    added++;
  }
  return { ...s, slots, nextId, stats: { ...s.stats, supplied: s.stats.supplied + added } };
}

function request(s: State, r: () => number): State {
  const ward = WARDS[Math.floor(r() * WARDS.length)];
  const need = r() < 0.35 ? 2 : 1;
  const max = 11 + Math.floor(r() * 5);
  const req: Req = { id: s.nextId, ward, type: pickType(r), need, filled: 0, ttl: max, max };
  return { ...s, nextId: s.nextId + 1, reqs: [...s.reqs, req], selected: s.selected ?? req.id };
}

const say = (s: State, text: string, kind: Msg["kind"]): State => ({ ...s, msg: { text, kind, id: (s.msg?.id ?? 0) + 1 } });

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start": {
      const rng = makeRng(initial.seed + s.plays * 7919);
      let n: State = { ...initial, phase: "run", plays: s.plays + 1, nextDonation: 3, nextRequest: 1.2 };
      n = donate(n, rng.next, 8);
      n = request(n, rng.next);
      return say({ ...n, seed: rng.seed() }, "Shift started. Pick a request, then issue a compatible bag.", "info");
    }
    case "tick": {
      if (s.phase !== "run") return s;
      const rng = makeRng(s.seed);
      const t = s.t + a.dt;
      let n: State = { ...s, t };
      let wasted = 0;
      // Bags age; expired ones linger briefly, crossed out, then free their slot.
      n.slots = s.slots.map((b) => {
        if (!b) return b;
        if (b.expired !== undefined) return t - b.expired > 1.1 ? null : b;
        const life = b.life - a.dt;
        if (life <= 0) { wasted++; return { ...b, life: 0, expired: t }; }
        return { ...b, life };
      });
      let shortage = 0;
      const timedOut: Req[] = [];
      n.reqs = s.reqs.map((q) => ({ ...q, ttl: q.ttl - a.dt })).filter((q) => {
        if (q.ttl > 0) return true;
        shortage += q.need - q.filled; timedOut.push(q); return false;
      });
      n.stats = { ...s.stats, wasted: s.stats.wasted + wasted, shortage: s.stats.shortage + shortage, score: s.stats.score - wasted * 8 - shortage * 12 };
      if (n.selected !== null && !n.reqs.some((q) => q.id === n.selected)) n.selected = n.reqs[0]?.id ?? null;
      if (timedOut.length) n = say(n, `${timedOut[0].ward} ran short of ${timedOut[0].type}. That’s a shortage.`, "bad");
      else if (wasted) n = say(n, `${wasted} unit${wasted > 1 ? "s" : ""} expired on the shelf. That’s waste.`, "bad");
      if (t >= n.nextDonation) {
        n = donate(n, rng.next, 1 + (rng.next() < 0.45 ? 1 : 0));
        n.nextDonation = t + 2.6 + rng.next() * 1.6;
      }
      if (t >= n.nextRequest) {
        if (n.reqs.length < 3) n = request(n, rng.next);
        n.nextRequest = t + 3.4 + rng.next() * 2.2;
      }
      if (n.shake && t > n.shake.until) n.shake = null;
      n.seed = rng.seed();
      if (t >= SHIFT) return say({ ...n, phase: "over", t: SHIFT }, "Shift over.", "info");
      return n;
    }
    case "select":
      return s.phase === "run" ? { ...s, selected: a.id } : s;
    case "issue": {
      if (s.phase !== "run") return s;
      const idx = s.slots.findIndex((b) => b?.id === a.id);
      const bag = idx >= 0 ? s.slots[idx] : null;
      if (!bag || bag.expired !== undefined) return s;
      const req = s.reqs.find((q) => q.id === s.selected);
      if (!req) return say(s, "No open request — wait for a ward to call.", "info");
      if (!compatible(bag.type, req.type)) return say({ ...s, shake: { id: bag.id, until: s.t + 0.5 } }, why(bag.type, req.type), "bad");

      const live = s.slots.filter((b): b is Bag => !!b && b.expired === undefined && compatible(b.type, req.type));
      const soonest = Math.min(...live.map((b) => b.life));
      const fefo = bag.life <= soonest + 0.5;
      const wastedUniversal = bag.type === "O−" && req.type !== "O−" && live.some((b) => b.type !== "O−");
      let gain = 10 + (fefo ? 15 : 0) - (wastedUniversal ? 6 : 0);
      const slots = [...s.slots];
      slots[idx] = null;
      const reqs = s.reqs.map((q) => (q.id === req.id ? { ...q, filled: q.filled + 1 } : q));
      const done = req.filled + 1 >= req.need;
      if (done) gain += 20;
      const left = done ? reqs.filter((q) => q.id !== req.id) : reqs;
      const n: State = {
        ...s, slots, reqs: left,
        selected: done ? left[0]?.id ?? null : s.selected,
        stats: { ...s.stats, issued: s.stats.issued + 1, score: s.stats.score + gain, fefo: s.stats.fefo + (fefo ? 1 : 0) },
      };
      if (wastedUniversal) return say(n, "Delivered — but O− is the universal donor. Save it for when nothing else fits.", "info");
      if (fefo) return say(n, done ? `${req.ward} covered. First-expiring unit used first (FEFO) — bonus.` : "FEFO bonus — oldest compatible unit first.", "good");
      return say(n, done ? `${req.ward} covered.` : `Issued ${bag.type}. ${req.need - req.filled - 1} more for ${req.ward}.`, "good");
    }
    case "transship": {
      if (s.phase !== "run" || s.transshipped) return s;
      const near = s.slots
        .map((b, i) => ({ b, i }))
        .filter((x): x is { b: Bag; i: number } => !!x.b && x.b.expired === undefined && x.b.life < 7);
      near.sort((x, y) => x.b.life - y.b.life);
      const send = near.slice(0, 2);
      if (!send.length) return say(s, "Nothing close to expiry to transship yet.", "info");
      const slots = [...s.slots];
      send.forEach(({ i }) => { slots[i] = null; });
      return say({ ...s, slots, transshipped: send.length, stats: { ...s.stats, score: s.stats.score + 5 * send.length } },
        `Transshipped ${send.length} near-expiry unit${send.length > 1 ? "s" : ""} to a neighbouring hospital — not wasted.`, "good");
    }
  }
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

function BagIcon({ id, type, frac, expired }: { id: number; type: Blood; frac: number; expired: boolean }) {
  const top = 22 + (1 - frac) * 50;
  return (
    <svg viewBox="0 0 60 84" aria-hidden="true" className="sl-bag-svg">
      <path className="sl-bag-tube" d="M30 2v10M24 6h12" />
      <path className="sl-bag-shell" d="M14 14h32a8 8 0 0 1 8 8v44a14 14 0 0 1-14 14H20A14 14 0 0 1 6 66V22a8 8 0 0 1 8-8Z" />
      <clipPath id={`sl-clip-${id}`}><path d="M14 14h32a8 8 0 0 1 8 8v44a14 14 0 0 1-14 14H20A14 14 0 0 1 6 66V22a8 8 0 0 1 8-8Z" /></clipPath>
      <rect className="sl-bag-fill" x="0" y={top} width="60" height="84" clipPath={`url(#sl-clip-${id})`} />
      <rect className="sl-bag-label" x="14" y="30" width="32" height="22" rx="4" />
      <text className="sl-bag-type" x="30" y="45.5">{type}</text>
      {expired && <path className="sl-bag-x" d="M12 20 48 74M48 20 12 74" />}
    </svg>
  );
}

export default function ShelfLife() {
  const [s, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    if (s.phase !== "run") return;
    const id = setInterval(() => dispatch({ type: "tick", dt: 0.25 }), 250);
    return () => clearInterval(id);
  }, [s.phase]);

  const { issued, shortage, wasted, supplied, score, fefo } = s.stats;
  const demand = issued + shortage ? issued / (issued + shortage) : 1;
  const waste = supplied ? wasted / supplied : 0;
  const left = Math.max(0, Math.ceil(SHIFT - s.t));
  const sel = s.reqs.find((q) => q.id === s.selected);

  return (
    <div className={`sl sl-${s.phase}`}>
      <header className="sl-head">
        <div>
          <p className="sl-kicker">A 60-second shift · blood bank</p>
          <h3 className="sl-title">Shelf <em>Life</em></h3>
        </div>
        <div className="sl-thermo" aria-label={`Fridge at 4 degrees Celsius. ${s.phase === "run" ? `${left} seconds left in the shift` : "Shift not running"}`}>
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle className="sl-thermo-track" cx="22" cy="22" r="19" />
            <circle className="sl-thermo-arc" cx="22" cy="22" r="19" pathLength={1} style={{ strokeDashoffset: s.phase === "idle" ? 0 : 1 - left / SHIFT }} />
          </svg>
          <strong>4<small>°C</small></strong>
          <span>{s.phase === "run" ? `${left}s left` : s.phase === "over" ? "closed" : "ready"}</span>
        </div>
      </header>

      <dl className="sl-meters">
        <div><dt>Demand met</dt><dd className={demand < 0.7 ? "is-bad" : ""}>{pct(demand)}</dd><i style={{ transform: `scaleX(${demand})` }} /></div>
        <div><dt>Wastage</dt><dd className={waste > 0.15 ? "is-bad" : ""}>{pct(waste)}</dd><i className="sl-i-waste" style={{ transform: `scaleX(${Math.min(1, waste * 3)})` }} /></div>
        <div><dt>Score</dt><dd>{score}</dd><i className="sl-i-score" style={{ transform: `scaleX(${Math.min(1, Math.max(0, score) / 600)})` }} /></div>
      </dl>

      <section className="sl-board" aria-label="Ward requests">
        <p className="sl-board-label">Ward board</p>
        <ul>
          {s.reqs.map((q) => (
            <li key={q.id}>
              <button className={`sl-req ${q.id === s.selected ? "is-on" : ""} ${q.ttl < 4 ? "is-urgent" : ""}`} onClick={() => dispatch({ type: "select", id: q.id })}
                aria-pressed={q.id === s.selected} aria-label={`${q.ward} needs ${q.need - q.filled} unit${q.need - q.filled > 1 ? "s" : ""} for a ${q.type} patient, ${Math.ceil(q.ttl)} seconds left`}>
                <span className="sl-req-ward">{q.ward}</span>
                <strong className="sl-req-type">{q.type}</strong>
                <span className="sl-req-units">{Array.from({ length: q.need }, (_, k) => <i key={k} className={k < q.filled ? "is-filled" : ""} />)}</span>
                <span className="sl-req-ttl"><i style={{ transform: `scaleX(${q.ttl / q.max})` }} /></span>
              </button>
            </li>
          ))}
          {s.phase === "run" && !s.reqs.length && <li className="sl-req-empty">Quiet for a moment…</li>}
          {s.phase !== "run" && !s.reqs.length && <li className="sl-req-empty">Requests from wards appear here.</li>}
        </ul>
      </section>

      <div className="sl-fridge">
        <div className="sl-fridge-glass" aria-hidden="true" />
        <div className="sl-shelves" role="group" aria-label={sel ? `Blood fridge. Issuing for a ${sel.type} patient at ${sel.ward}.` : "Blood fridge"}>
          {s.slots.map((b, i) => {
            if (!b) return <div key={`e${i}`} className="sl-slot sl-slot-empty" aria-hidden="true" />;
            const days = Math.ceil(b.life);
            const ok = sel ? compatible(b.type, sel.type) : true;
            const cls = ["sl-slot", "sl-bag", b.expired !== undefined && "is-expired", b.life < 4 && b.expired === undefined && "is-ageing", sel && !ok && "is-dim", s.shake?.id === b.id && "is-shake"].filter(Boolean).join(" ");
            return (
              <button key={b.id} className={cls} onClick={() => dispatch({ type: "issue", id: b.id })} disabled={s.phase !== "run" || b.expired !== undefined}
                aria-label={b.expired !== undefined ? `${b.type} unit, expired` : `${b.type} unit, ${days} day${days === 1 ? "" : "s"} left${sel ? (ok ? ", compatible" : ", not compatible") : ""}. Issue.`}>
                <BagIcon id={b.id} type={b.type} frac={b.life / b.max} expired={b.expired !== undefined} />
                <span className="sl-days">{b.expired !== undefined ? "expired" : `${days}d`}</span>
              </button>
            );
          })}
        </div>

        {s.phase === "idle" && (
          <div className="sl-overlay">
            <p className="sl-overlay-title">Keep every unit moving.</p>
            <p>Wards call for blood. Pick a request, then tap a compatible bag. Use the <b>first-expiring</b> unit first, keep O− for emergencies, and don’t let bags expire.</p>
            <button className="sl-start" onClick={() => dispatch({ type: "start" })}>Start shift</button>
          </div>
        )}
        {s.phase === "over" && (
          <div className="sl-overlay">
            <p className="sl-overlay-title">Shift report</p>
            <dl className="sl-report">
              <div><dt>Demand met</dt><dd>{pct(demand)}</dd></div>
              <div><dt>Wastage</dt><dd>{pct(waste)}</dd></div>
              <div><dt>Score</dt><dd>{score}</dd></div>
            </dl>
            <p className="sl-report-line">{issued} units issued · {fefo} first-expiring-first · {wasted} expired · {shortage} short{s.transshipped ? ` · ${s.transshipped} transshipped` : ""}</p>
            <p>That trade-off — wastage vs. demand satisfaction — is exactly what my Winter Simulation Conference paper studies. <a href="#research">Read the research →</a></p>
            <button className="sl-start" onClick={() => dispatch({ type: "start" })}>Play again</button>
          </div>
        )}
      </div>

      <footer className="sl-foot">
        <p className={`sl-msg ${s.msg ? `is-${s.msg.kind}` : ""}`} role="status" aria-live="polite" key={s.msg?.id}>
          {s.msg?.text ?? "Compatibility follows real red-cell rules: O− gives to all; Rh− patients need Rh− blood."}
        </p>
        <button className="sl-transship" onClick={() => dispatch({ type: "transship" })} disabled={s.phase !== "run" || s.transshipped > 0}
          title="Once per shift: send up to 2 near-expiry units to a neighbouring hospital">
          {s.transshipped ? "Transshipped ✓" : "Transship ⇄"}
        </button>
      </footer>
      <p className="sl-fine">Synthetic — a game, not real clinical guidance.</p>
    </div>
  );
}

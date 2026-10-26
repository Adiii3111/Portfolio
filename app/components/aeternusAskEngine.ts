// AETERNUS · Ask mode. Answers questions about Aditya from the facts on this site only.
// Pure functions (no DOM), so it can be tested outside the browser.
//
// How it works: every fact in content.ts becomes a short third-person passage tagged with
// a topic and a page section. A question is tokenized, lightly stemmed, expanded with
// synonyms and typo-corrected against the vocabulary, then passages are ranked with BM25
// plus boosts for what kind of question it is (who / tools / education / "have you used X"…).
// The answer is the best passage as a lead line plus a few supporting ones. Nothing is
// generated beyond those facts; when nothing scores well it says so.

export type Kind = "summary" | "fact" | "metric" | "tools" | "education" | "contact" | "availability" | "resume" | "quote" | "skill" | "award" | "leadership" | "location" | "running";

export type Passage = {
  id: string;
  topic: string;
  kind: Kind;
  text: string;
  section: string;
  find?: string;
  tokens: string[];
};

export type ResumeRef = { code: string; name: string; blurb: string; file: string };

export type Answer = {
  lead: string;
  bullets: string[];
  links: { label: string; section: string; find?: string }[];
  resumes?: ResumeRef[];
  email?: boolean;
  suggestions: string[];
  /** True when AETERNUS could not find this on the site. */
  unknown?: boolean;
};

export type Context = { topic?: string; shown: string[]; lastQuery?: string[] };
export const newContext = (): Context => ({ shown: [] });

/* ───────────── knowledge base input (shaped like content.ts) ───────────── */

type Chapter = { when: string; place: string; kind: string; title: string; body: string; details?: { label: string; value: string }[]; list?: string[]; listLabel?: string };
type Role = { year: string; org: string; role: string; bullets: string[]; tags: string[] };
type Project = { id: string; title: string; category: string; year: string; context: string; challenge: string; role: string; tools: string[]; outcome?: string; caseStudy: string[] };
export type KB = {
  person: { fullName: string; roles: readonly string[] | string[]; email: string; collegeEmail: string; linkedin: string };
  chapters: Chapter[];
  vaxxinova: { highlights: { value: string; label: string }[]; bullets: string[]; tools: string[] };
  mercuryCapabilities: string[];
  otherRoles: Role[];
  projects: Project[];
  paper: { title: string; venue: string; status: string; authors: string; findings: string[]; method: string; topics: string[] };
  community: { when: string; title: string; role: string; body: string; link?: string }[];
  toolkit: { group: string; skills: { name: string; used: string[] }[] }[];
  certifications: { name: string; issuer: string }[];
  recommendations: { quote: string; name: string; title: string; context: string }[];
  resumes: Record<"sco" | "bda" | "hsc", ResumeRef>;
};

/* ───────────── text processing ───────────── */

const STOP = new Set(("a an the and or of to in on at for from by with about as is are was were be been being am do does did done " +
  "i me my mine you your yours he him his she her they them their it its this that these those there here what which who whom whose " +
  "when where why how can could would should will shall may might must please tell show give know let lets let's any some much many " +
  "aditya adityas sripad kadlabal ak aks has have had having into than then so if not no yes just also very really more most " +
  "s t").split(/\s+/));

const SYN: string[][] = [
  ["work", "job", "jobs", "role", "roles", "position", "positions", "employment", "employ", "employer", "career", "experience", "experiences", "professional", "internship", "internships", "intern", "coop", "worked", "working"],
  ["study", "studied", "education", "school", "university", "college", "degree", "degrees", "masters", "master", "bachelor", "bachelors", "graduate", "graduated", "graduation", "academic", "academics", "ms", "be", "msc"],
  ["course", "courses", "coursework", "class", "classes", "subject", "subjects", "curriculum"],
  ["research", "paper", "publication", "publications", "published", "publish", "conference", "wsc", "journal", "proceeding", "proceedings", "author", "coauthor", "coauthored"],
  ["blood", "transfusion", "donor", "donation", "donations", "platelet", "perishable"],
  ["simulation", "simulate", "simulated", "simulating", "discrete", "flexsim", "des"],
  ["forecast", "forecasting", "forecasts", "prediction", "predict", "predictive", "timeseries", "arima", "sarima", "demand"],
  ["dashboard", "dashboards", "dash", "plotly", "visualization", "visualisation", "visualize", "bi", "report", "reporting"],
  ["tool", "tools", "software", "stack", "tech", "technology", "technologies", "skill", "skills", "programming", "language", "languages", "proficiency"],
  ["lead", "leader", "leadership", "led", "leading", "manage", "managed", "management", "officer", "founder", "founded", "mentor", "teach", "teaching", "speaker", "grader", "community", "volunteer", "volunteering", "club"],
  ["award", "awards", "prize", "honor", "honour", "honors", "recognition", "achievement", "achievements", "won", "best"],
  ["recommend", "recommendation", "recommendations", "reference", "references", "testimonial", "testimonials", "endorse", "endorsement", "said", "says", "quote"],
  ["contact", "email", "mail", "reach", "touch", "linkedin", "connect", "message", "hire", "hiring"],
  ["available", "availability", "open", "opportunity", "opportunities", "fulltime", "start", "starting", "looking", "seeking", "graduating", "2027"],
  ["run", "running", "runner", "marathon", "agileflowsprinter", "sprint", "fitness", "wellness"],
  ["vaccine", "vaccines", "poultry", "veterinary", "vaxxinova", "biologic", "biologics", "animal"],
  ["mercury", "decisionassist"],
  ["supply", "chain", "logistics", "logistic", "operations", "operation", "inventory", "distribution", "procurement", "shipment", "shipments", "shipping", "transport", "transportation", "warehouse"],
  ["route", "routing", "routes", "vehicle", "vrp", "tsp", "delivery", "deliveries"],
  ["lean", "kaizen", "5s", "vsm", "a3", "waste", "continuous", "improvement", "sixsigma"],
  ["health", "healthcare", "hospital", "hospitals", "clinic", "clinical", "medical", "patient", "patients"],
  ["cold", "coldchain", "temperature", "refrigerated"],
  ["where", "location", "located", "live", "lives", "based", "city", "from", "hometown", "country"],
  ["certification", "certifications", "certificate", "certificates", "certified", "license", "licence"],
  ["project", "projects", "portfolio", "built", "build", "made", "created", "developed", "design", "designed"],
  ["gpa", "grade", "grades", "cgpa", "score"],
  ["segment", "segmentation", "segments", "churn", "customer", "customers", "accounts", "account"],
  ["mechanical", "cad", "solidworks", "ansys"],
];
const CANON = new Map<string, string>();
for (const g of SYN) for (const w of g) if (!CANON.has(w)) CANON.set(w, g[0]);

function stem(w: string) {
  if (w.length > 5 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 6 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 5 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es") && !w.endsWith("ses")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is")) return w.slice(0, -1);
  return w;
}

export function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/co-?op/g, "coop").replace(/full[- ]time/g, "fulltime").replace(/decision[- ]assist/g, "decisionassist")
    .replace(/cold[- ]chain/g, "coldchain").replace(/six[- ]sigma/g, "sixsigma").replace(/time[- ]series/g, "timeseries")
    .replace(/co-?author(ed)?/g, "coauthor").replace(/[’']s\b/g, "");
}

/** Raw word tokens (no stopword removal), used for phrase checks. */
const words = (s: string) => normalize(s).split(/[^a-z0-9+#]+/).filter(Boolean);

export function tokenize(s: string): string[] {
  const out: string[] = [];
  for (const w of words(s)) {
    if (STOP.has(w)) continue;
    const c = CANON.get(w) ?? CANON.get(stem(w));
    out.push(c ?? stem(w));
  }
  return out;
}

function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/* ───────────── index ───────────── */

const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const endDot = (s: string) => (/[.!?”"]$/.test(s.trim()) ? s.trim() : s.trim() + ".");
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

const ROLE_TOPIC: Record<string, string> = { "NoBroker.com": "nobroker", "Greaves Electric Mobility": "greaves", "Nakshatra Agencies": "nakshatra", "MTR Foods Pvt. Ltd. (Orkla ASA)": "mtr" };
const PROJECT_TOPIC: Record<string, string> = { mercury: "vaxxinova", blood: "research", tipper: "greaves", routing: "nakshatra", library: "rvce", lean: "lean", patients: "patients" };
export const SECTION_LABEL: Record<string, string> = {
  "#top": "Top", "#about": "About", "#journey": "Journey", "#experience": "Experience", "#mercury-demo": "MERCURY demo", "#work": "Projects",
  "#research": "Research", "#lab": "The Lab", "#running": "AgileFlowSprinter", "#community": "Leadership", "#beyond": "Beyond",
  "#recommendations": "Recommendations", "#toolkit": "Toolkit", "#contact": "Contact",
};

export type Index = { passages: Passage[]; df: Map<string, number>; avg: number; vocab: string[]; kb: KB; skills: { name: string; used: string[]; raw: string[]; tokens: string[] }[] };

export function buildIndex(kb: KB): Index {
  const P: Omit<Passage, "tokens">[] = [];
  const add = (p: Omit<Passage, "tokens">) => P.push(p);
  const { person, chapters, vaxxinova, mercuryCapabilities, otherRoles, projects, paper, community, toolkit, certifications, recommendations, resumes } = kb;

  const edu = chapters.filter((c) => c.kind === "Education");
  const ms = edu.find((c) => /Northeastern/.test(c.title));
  const be = edu.find((c) => /R\.?V\./.test(c.title));
  const msDegree = ms?.details?.find((d) => d.label === "Degree")?.value;
  const beDegree = be?.details?.find((d) => d.label === "Degree")?.value;

  add({ id: "who", topic: "about", kind: "summary", section: "#about", text: `${person.fullName} is an ${list([...person.roles].map((r) => r.toLowerCase()))} — he connects engineering, healthcare, supply chains, analytics and research.` });
  if (ms && be) add({ id: "who-path", topic: "about", kind: "summary", section: "#journey", text: `He studied at ${be.title} in ${be.place} (${beDegree}) and is now at ${ms.title} in ${ms.place} (${msDegree}, ${ms.when}).` });

  chapters.forEach((c, i) => {
    const topic = /Northeastern/.test(c.title) ? "northeastern" : /R\.?V\./.test(c.title) ? "rvce" : c.kind === "Research" ? "research" : c.kind === "Next" ? "availability" : /Willmar/.test(c.place) ? "vaxxinova" : "early-industry";
    const kind: Kind = c.kind === "Education" ? "education" : c.kind === "Next" ? "availability" : "fact";
    add({ id: `ch${i}`, topic, kind, section: "#journey", find: c.title, text: `${c.title} (${c.when}, ${c.place}): ${endDot(c.body)}` });
    if (c.details?.length) add({ id: `ch${i}-d`, topic, kind: "education", section: "#journey", find: c.title, text: `At ${c.title}: ${c.details.map((d) => `${d.label.toLowerCase()} — ${d.value}`).join("; ")}.` });
    if (c.list?.length) add({ id: `ch${i}-l`, topic, kind: /award/i.test(c.listLabel ?? "") ? "award" : "education", section: "#journey", find: c.list[0], text: `${c.listLabel ?? "Highlights"} at ${c.title}: ${list(c.list)}.` });
  });

  const vax = "Vaxxinova US";
  add({ id: "vax", topic: "vaxxinova", kind: "summary", section: "#experience", find: vax, text: `From January to August 2026 Aditya was a Data Analyst Co-op at ${vax} in Willmar, Minnesota (animal health and veterinary vaccines), where he architected Project MERCURY — a proprietary Python/Dash decision-assist dashboard.` });
  vaxxinova.bullets.forEach((b, i) => add({ id: `vax-b${i}`, topic: "vaxxinova", kind: "fact", section: "#experience", find: vax, text: `At ${vax}, Aditya ${lc(endDot(b))}` }));
  vaxxinova.highlights.forEach((h, i) => add({ id: `vax-h${i}`, topic: "vaxxinova", kind: "metric", section: "#experience", find: h.value, text: `${h.value} — ${h.label} (${vax}).` }));
  add({ id: "vax-tools", topic: "vaxxinova", kind: "tools", section: "#experience", find: vax, text: `Tools and methods at ${vax}: ${list(vaxxinova.tools)}.` });
  add({ id: "mercury", topic: "vaxxinova", kind: "fact", section: "#mercury-demo", text: `Project MERCURY is a decision-assist dashboard that brought together ${list(mercuryCapabilities.map(lc))}. It is proprietary, so the site describes it only at a high level and shows a demo on synthetic data.` });

  otherRoles.forEach((r) => {
    const topic = ROLE_TOPIC[r.org] ?? r.org.toLowerCase();
    const org = r.org.replace(/ Pvt\. Ltd\. \(Orkla ASA\)/, "");
    add({ id: `role-${topic}`, topic, kind: "summary", section: "#experience", find: r.org, text: `${r.org} (${r.year}): ${r.role}.` });
    r.bullets.forEach((b, i) => add({ id: `role-${topic}-${i}`, topic, kind: "fact", section: "#experience", find: r.org, text: `At ${org}, Aditya ${lc(endDot(b))}` }));
    add({ id: `role-${topic}-t`, topic, kind: "tools", section: "#experience", find: r.org, text: `Skills used at ${org}: ${list(r.tags)}.` });
  });

  projects.forEach((p) => {
    const topic = PROJECT_TOPIC[p.id] ?? p.id;
    add({ id: `pj-${p.id}`, topic, kind: "summary", section: "#work", find: p.title, text: `${p.title} (${p.category}; ${p.year}). ${endDot(p.context)} The challenge: ${lc(endDot(p.challenge))}` });
    add({ id: `pj-${p.id}-r`, topic, kind: "fact", section: "#work", find: p.title, text: `His role on ${p.title}: ${lc(endDot(p.role))}` });
    if (p.outcome) add({ id: `pj-${p.id}-o`, topic, kind: "metric", section: "#work", find: p.title, text: `Outcome of ${p.title}: ${endDot(p.outcome)}` });
    add({ id: `pj-${p.id}-t`, topic, kind: "tools", section: "#work", find: p.title, text: `Tools and methods on ${p.title}: ${list(p.tools)}.` });
    add({ id: `pj-${p.id}-c`, topic, kind: "fact", section: "#work", find: p.title, text: `How ${p.title} was done: ${list(p.caseStudy.map((s) => lc(s.replace(/\.$/, ""))))}.` });
  });

  add({ id: "paper", topic: "research", kind: "summary", section: "#research", find: paper.title, text: `Aditya co-authored “${paper.title}” (${paper.authors}) — ${paper.venue}, ${lc(paper.status)}.` });
  add({ id: "paper-m", topic: "research", kind: "fact", section: "#research", find: "Method.", text: `Method: ${endDot(paper.method)}` });
  paper.findings.forEach((f, i) => add({ id: `paper-f${i}`, topic: "research", kind: "metric", section: "#research", find: f.slice(0, 30), text: `Finding: ${endDot(f)}` }));
  add({ id: "paper-t", topic: "research", kind: "tools", section: "#research", text: `Research topics: ${list(paper.topics)}.` });

  community.forEach((c, i) => {
    const running = /AgileFlowSprinter/.test(c.title);
    add({ id: `cm${i}`, topic: running ? "running" : "community", kind: running ? "running" : "leadership", section: running ? "#running" : "#community", find: c.title, text: `${c.role}, ${c.title} (${c.when}): ${endDot(c.body)}` });
  });
  add({ id: "afs", topic: "running", kind: "running", section: "#running", find: "Sprint Sync Marathon", text: "AgileFlowSprinter is the running and wellness community Aditya founded: weekly group runs for all levels, mindfulness sessions, challenges and milestones, and the annual Sprint Sync Marathon — first held on 21 January 2024 at Ullal Lake, Bengaluru (5K, 10K and 21K)." });
  add({ id: "afs-2", topic: "running", kind: "running", section: "#running", text: "The running community continued at Northeastern and through a running group he started with colleagues at Vaxxinova." });

  toolkit.forEach((g) => g.skills.forEach((s, i) => add({ id: `sk-${g.group}-${i}`, topic: "toolkit", kind: "skill", section: "#toolkit", find: s.name, text: `${s.name} (${g.group.toLowerCase()}) — used in ${list(s.used)}.` })));
  toolkit.forEach((g) => add({ id: `tk-${g.group}`, topic: "toolkit", kind: "tools", section: "#toolkit", find: g.group, text: `${g.group}: ${list(g.skills.map((s) => s.name))}.` }));
  add({ id: "certs", topic: "certs", kind: "award", section: "#toolkit", find: certifications[0]?.name, text: `Certifications: ${list(certifications.map((c) => `${c.name} (${c.issuer})`))}.` });

  recommendations.forEach((r, i) => add({ id: `rec${i}`, topic: "recs", kind: "quote", section: "#recommendations", find: r.name, text: `${r.name}, ${r.title}: “${r.quote}”` }));
  recommendations.forEach((r, i) => add({ id: `rec${i}-c`, topic: "recs", kind: "quote", section: "#recommendations", find: r.name, text: `${r.name} ${lc(endDot(r.context))}` }));

  add({ id: "contact", topic: "contact", kind: "contact", section: "#contact", text: `You can reach Aditya at ${person.email} (personal) or ${person.collegeEmail} (Northeastern), or on LinkedIn: ${person.linkedin}` });
  const next = chapters.find((c) => c.kind === "Next");
  if (next) add({ id: "avail", topic: "availability", kind: "availability", section: "#contact", text: `Yes — Aditya is ${lc(next.body.replace(/^Exploring/, "exploring"))}` });
  if (ms) add({ id: "loc", topic: "location", kind: "location", section: "#journey", text: `Aditya is based in ${ms.place}, studying at ${ms.title}; he is from ${be?.place ?? "Bengaluru, India"}, and his co-op took him to Willmar, Minnesota.` });
  (Object.keys(resumes) as (keyof KB["resumes"])[]).forEach((k) => add({ id: `cv-${k}`, topic: "resume", kind: "resume", section: "#top", text: `${resumes[k].code} — ${resumes[k].name}: ${resumes[k].blurb}` }));

  const passages: Passage[] = P.map((p) => ({ ...p, tokens: tokenize(p.text) }));
  const df = new Map<string, number>();
  for (const p of passages) for (const t of new Set(p.tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = passages.reduce((s, p) => s + p.tokens.length, 0) / passages.length;

  // Every named tool / method on the site, for "have you used X?" questions.
  const skills: Index["skills"] = [];
  const addSkill = (name: string, used: string) => {
    const hit = skills.find((s) => s.name === name);
    if (hit) { if (!hit.used.includes(used)) hit.used.push(used); return; }
    const raw = words(name).filter((w) => !STOP.has(w)).map(stem);
    skills.push({ name, used: [used], raw, tokens: raw.map((w) => CANON.get(w) ?? w) });
  };
  toolkit.forEach((g) => g.skills.forEach((s) => s.used.forEach((u) => addSkill(s.name, u))));
  vaxxinova.tools.forEach((t) => addSkill(t, "Vaxxinova US · Project MERCURY"));
  projects.forEach((p) => p.tools.forEach((t) => addSkill(t, p.title)));
  otherRoles.forEach((r) => r.tags.forEach((t) => addSkill(t, r.org)));
  certifications.forEach((c) => addSkill(c.name, `certification · ${c.issuer}`));

  return { passages, df, avg, vocab: [...df.keys()], kb, skills };
}

/* ───────────── question understanding ───────────── */

type Intent = "authors" | "greet" | "thanks" | "who" | "contact" | "phone" | "availability" | "resume" | "whyhire" | "weakness" | "gpa" | "skill" | "tools" | "education" | "coursework" | "experience" | "research" | "projects" | "leadership" | "awards" | "recs" | "certs" | "running" | "location" | "mercury" | "numbers" | "more" | "age" | "personal" | "visa" | "salary" | "none";

const has = (q: string, re: RegExp) => re.test(q);

function intents(raw: string): Intent[] {
  const q = ` ${normalize(raw).replace(/[^a-z0-9+#\s]/g, " ").replace(/\s+/g, " ")} `;
  const out: Intent[] = [];
  const tokens = q.trim().split(" ");
  if (tokens.length <= 4 && has(q, / (hi|hello|hey|hiya|yo|greetings|good (morning|afternoon|evening)) /)) out.push("greet");
  if (has(q, / (thanks|thank you|thx|cheers|appreciate) /)) out.push("thanks");
  if (has(q, / (who is|who s|who are you|introduce|introduction|summary|summarize|overview|background|elevator pitch|in a nutshell)|tell me about (him|yourself|aditya)\s*$|about (him|aditya|yourself)\s*$|^ (aditya|aditya kadlabal sripad) $/)) out.push("who");
  if (has(q, / (phone|mobile|cell|whatsapp|telephone|call (him|you))/)) out.push("phone");
  if (has(q, / (contact|email|e mail|reach|get in touch|linkedin|connect with|message him|talk to him)/)) out.push("contact");
  if (has(q, / (open to work|available|availability|looking for|job search|start date|when can (he|you) start|full ?time|graduat|next role|hire him|hiring|opportunit|seeking)/)) out.push("availability");
  if (has(q, / (resume|cv|curriculum vitae)/)) out.push("resume");
  if (has(q, / (why (should|would|hire|him|you)|strength|what makes (him|you)|stand out|good fit|best at|unique|value (he|you) bring|superpower|convince)/)) out.push("whyhire");
  if (has(q, / (co ?authors?|coauthor|authors?|who (wrote|worked on) (the|his) paper)/)) out.push("authors");
  if (has(q, / (weakness|weak spot|shortcoming|improve on|areas? (to|of) improv|fail)/)) out.push("weakness");
  if (has(q, / (gpa|cgpa|grade|grades|marks)/)) out.push("gpa");
  if (has(q, / (ha(s|ve) (he|you) (ever )?(used|worked (with|in|on)|touched|tried)|do(es)? (he|you) (know|use|have experience)|experience (with|in|using)|familiar (with)|good (at|with)|skilled (in|at)|proficien|expert (in|at)|can (he|you) (use|do|work))/)) out.push("skill");
  // "cold chain experience", "python skills": a named thing followed by experience/skills.
  else if (has(q, /^ (?!(leadership|work|professional|industry|any|his|your|what|tell|research|teaching|management) )[a-z0-9+# ]{2,40} (experience|skills?|knowledge|background) \?? ?$/)) out.push("skill");
  if (has(q, / (tools?|tech stack|stack|software|skills?|technolog|programming|languages?|toolkit)/)) out.push("tools");
  if (has(q, / (study|studied|education|school|universit|college|degree|masters|bachelor|northeastern|rvce|r v college)/)) out.push("education");
  if (has(q, / (course|coursework|classes|subjects)/)) out.push("coursework");
  if (has(q, / (experience|work(ed)? (history|at)|jobs?|intern|co ?op|employ|career|professional)/)) out.push("experience");
  if (has(q, / (research|paper|publication|publish|conference|wsc|winter simulation|journal|study on blood)/)) out.push("research");
  if (has(q, / (projects?|built|build|made)/)) out.push("projects");
  if (has(q, / (lead|leader|leadership|manage|team|officer|informs|speaker|grader|community|volunteer|osaat|teach)/)) out.push("leadership");
  if (has(q, / (award|prize|honou?r|achievement|won |recognition)/)) out.push("awards");
  if (has(q, / (recommend|reference|testimonial|endorse|what do (others|people)|said about|say about)/)) out.push("recs");
  if (has(q, / (certif|certificate|lean academy|license|licence)/)) out.push("certs");
  if (has(q, / (run|running|runner|marathon|agileflowsprinter|agile flow sprinter|sprint sync|fitness|hobb|free time|outside work|interests?)/)) out.push("running");
  if (has(q, / (where (is|does|do|are)|based|located|live|from|hometown|city|country|relocat)/)) out.push("location");
  if (has(q, / (mercury|dashboard)/)) out.push("mercury");
  if (has(q, / how (many|much|big)|numbers?|metrics?|impact|results?|outcomes?/)) out.push("numbers");
  if (has(q, /^ ((tell me |say |go on|and|what else|anything else|keep going|continue|elaborate|more|details|explain more|expand)( more| on that| about that| please)?)+ ?\??\s*$/)) out.push("more");
  if (has(q, / (how old|age|birthday|born)/)) out.push("age");
  if (has(q, / (married|wife|girlfriend|religion|family|kids|politic)/)) out.push("personal");
  if (has(q, / (visa|sponsor|opt|stem opt|h1b|h 1b|work authori|citizen|green card)/)) out.push("visa");
  if (has(q, / (salary|pay|compensation|expected ctc|ctc|rate|wage)/)) out.push("salary");
  return out.length ? out : ["none"];
}

const BOOST: Partial<Record<Intent, { kinds?: Kind[]; topics?: string[] }>> = {
  tools: { kinds: ["tools", "skill"] },
  education: { kinds: ["education"], topics: ["northeastern", "rvce"] },
  coursework: { kinds: ["education"], topics: ["northeastern"] },
  experience: { kinds: ["summary", "fact"], topics: ["vaxxinova", "nobroker", "greaves", "nakshatra", "mtr", "early-industry"] },
  research: { topics: ["research"] },
  projects: { kinds: ["summary"], topics: ["vaxxinova", "research", "greaves", "nakshatra", "rvce", "lean", "patients"] },
  leadership: { kinds: ["leadership"], topics: ["community", "running"] },
  awards: { kinds: ["award"] },
  recs: { kinds: ["quote"], topics: ["recs"] },
  certs: { topics: ["certs"] },
  running: { kinds: ["running"], topics: ["running"] },
  location: { kinds: ["location"] },
  mercury: { topics: ["vaxxinova"] },
  numbers: { kinds: ["metric"] },
};

/* ───────────── retrieval ───────────── */

function correct(tokens: string[], idx: Index) {
  return tokens.map((t) => {
    if (idx.df.has(t) || t.length < 4 || /\d/.test(t)) return t;
    const max = t.length >= 7 ? 2 : 1;
    let best = t, bd = max + 1;
    for (const v of idx.vocab) {
      if (Math.abs(v.length - t.length) > max) continue;
      const d = editDistance(t, v, max);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  });
}

function bm25(qt: string[], idx: Index, boost?: (p: Passage) => number) {
  const N = idx.passages.length, k1 = 1.4, b = 0.7;
  const uniq = [...new Set(qt)];
  return idx.passages.map((p) => {
    let s = 0;
    for (const t of uniq) {
      const f = p.tokens.reduce((n, x) => n + (x === t ? 1 : 0), 0);
      if (!f) continue;
      const n = idx.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * p.tokens.length / idx.avg));
    }
    return { p, s: s * (boost ? boost(p) : 1) + (s > 0 && boost ? boost(p) - 1 : 0) };
  }).filter((x) => x.s > 0).sort((a, b2) => b2.s - a.s || a.p.id.localeCompare(b2.p.id));
}

/* ───────────── answer composition ───────────── */

const SUGGEST: Record<string, string[]> = {
  about: ["What did he build at Vaxxinova?", "Tell me about the blood supply chain paper", "Why should we hire him?"],
  vaxxinova: ["What tools did he use there?", "What is Project MERCURY?", "Tell me more"],
  research: ["What did the paper find?", "Has he used FlexSim?", "Who are the co-authors?"],
  northeastern: ["What's his GPA?", "What coursework did he take?", "Is he open to work?"],
  rvce: ["What awards did he win?", "What did he study at Northeastern?"],
  toolkit: ["Has he used Python?", "What forecasting methods does he know?", "Which résumé should I download?"],
  running: ["What is the Sprint Sync Marathon?", "What leadership roles has he had?"],
  community: ["What is AgileFlowSprinter?", "What do recommenders say about him?"],
  recs: ["Why should we hire him?", "How can I contact him?"],
  contact: ["Is he open to work?", "Which résumé should I download?"],
  availability: ["Which résumé should I download?", "How can I contact him?"],
  resume: ["Is he open to work?", "What tools does he use?"],
  default: ["Who is Aditya?", "What did he build at Vaxxinova?", "What tools does he use?"],
};
const suggestFor = (topic?: string) => SUGGEST[topic ?? ""] ?? SUGGEST.default;

function linksFor(ps: Passage[]) {
  const seen = new Set<string>();
  const out: Answer["links"] = [];
  for (const p of ps) {
    if (seen.has(p.section) || out.length >= 2) continue;
    seen.add(p.section);
    out.push({ label: SECTION_LABEL[p.section] ?? "Section", section: p.section, find: p.find });
  }
  return out;
}

function compose(ps: Passage[], ctx: Context, extra: Partial<Answer> = {}): Answer {
  const uniq = ps.filter((p, i) => ps.findIndex((q) => q.text === p.text) === i);
  const [lead, ...rest] = uniq;
  ctx.topic = lead.topic;
  ctx.shown = [...new Set([...ctx.shown, ...uniq.map((p) => p.id)])].slice(-40);
  return { lead: lead.text, bullets: rest.slice(0, 4).map((p) => p.text), links: linksFor(uniq), suggestions: suggestFor(lead.topic), ...extra };
}

const byId = (idx: Index, ...ids: string[]) => ids.map((id) => idx.passages.find((p) => p.id === id)).filter((p): p is Passage => !!p);
const byTopic = (idx: Index, topic: string, kinds?: Kind[]) => idx.passages.filter((p) => p.topic === topic && (!kinds || kinds.includes(p.kind)));

function pickResume(text: string, idx: Index): ResumeRef[] {
  const t = normalize(text);
  const r = idx.kb.resumes;
  const scores = {
    hsc: (t.match(/health|hospital|clinic|blood|vaccine|pharma|medical|cold|biolog|life science/g) ?? []).length,
    bda: (t.match(/data|analyt|business|dashboard|bi\b|python|forecast|segment|churn|insight|report/g) ?? []).length,
    sco: (t.match(/supply|operation|logistic|planning|mrp|inventory|lean|procure|manufactur|routing|warehouse/g) ?? []).length,
  };
  const order = (Object.keys(scores) as (keyof typeof scores)[]).sort((a, b) => scores[b] - scores[a]);
  return scores[order[0]] > 0 ? order.map((k) => r[k]) : [r.sco, r.bda, r.hsc];
}

/** The asker's own spelling of X (so "SQL" stays "SQL"). */
function displayName(original: string, obj: string) {
  const o = obj.replace(/\s+/g, " ").trim();
  if (!o) return "";
  const at = normalize(original).indexOf(o);
  const cased = at >= 0 ? original.slice(at, at + o.length) : o;
  return /^[a-z]{2,4}$/.test(cased) ? cased.toUpperCase() : cased.charAt(0).toUpperCase() + cased.slice(1);
}

/** Find "X" in "have you used X" / "do you know X" / "experience with X". */
function skillObject(raw: string) {
  const q = normalize(raw).replace(/[?!.]/g, " ");
  const m = q.match(/(?:used|use|know|knows|worked (?:with|in|on)|experience (?:with|in|using)|familiar with|good (?:at|with)|skilled (?:in|at)|proficient (?:in|at|with)|expert (?:in|at)|tried|touched|work with)\s+(.+)$/);
  const tail = q.match(/^\s*(.+?)\s+(?:experience|skills?|knowledge|background)\s*$/);
  return (m ? m[1] : tail ? tail[1] : q).replace(/\b(any|anything|like|such as|before|ever|at all|tools?|software|please)\b/g, " ").trim();
}

function whyHire(idx: Index, ctx: Context): Answer {
  const ps = byId(idx, "vax-h0", "vax-h1", "paper", "rec0", "cm0");
  ctx.topic = "about";
  ctx.shown = ps.map((p) => p.id);
  return {
    lead: "Here’s the case, straight from his record: he pairs hands-on supply chain analytics with healthcare operations research — and backs it with leadership.",
    bullets: ps.map((p) => p.text),
    links: [{ label: "Experience", section: "#experience" }, { label: "Research", section: "#research" }],
    suggestions: ["What did he build at Vaxxinova?", "What do recommenders say?", "Which résumé should I download?"],
  };
}

export function ask(question: string, idx: Index, ctx: Context): Answer {
  const q = question.trim();
  const { kb } = idx;
  if (!q) return { lead: "Ask me anything about Aditya — his work, research, tools, education, leadership or how to reach him.", bullets: [], links: [], suggestions: SUGGEST.default };
  const it = intents(q);
  const is = (i: Intent) => it.includes(i);

  if (is("greet") && it.length === 1) return { lead: "Hello — I’m AETERNUS. I know everything on Aditya’s portfolio: his co-op at Vaxxinova, his blood supply chain research, his projects, tools, education and leadership. What would you like to know?", bullets: [], links: [], suggestions: SUGGEST.default };
  if (is("thanks") && it.length === 1) return { lead: "You’re welcome. If you’d like to talk to Aditya directly, his email is below.", bullets: [], links: [{ label: "Contact", section: "#contact" }], email: true, suggestions: SUGGEST.contact };

  if (is("phone")) return { lead: "Aditya’s phone number isn’t shared on this site — email is the best way to reach him.", bullets: byId(idx, "contact").map((p) => p.text), links: [{ label: "Contact", section: "#contact" }], email: true, suggestions: SUGGEST.contact };
  if (is("age") || is("personal")) return { lead: "That isn’t something this portfolio covers — it sticks to Aditya’s work, research and community.", bullets: [], links: [], email: true, suggestions: SUGGEST.default, unknown: true };
  if (is("salary")) return { lead: "Compensation isn’t discussed on this site — that’s a conversation to have with Aditya directly.", bullets: [], links: [{ label: "Contact", section: "#contact" }], email: true, suggestions: SUGGEST.availability, unknown: true };
  if (is("visa")) return { lead: "Work authorization isn’t covered on this site, so I can’t answer that — please ask Aditya directly.", bullets: byId(idx, "avail").map((p) => p.text), links: [{ label: "Contact", section: "#contact" }], email: true, suggestions: SUGGEST.availability, unknown: true };

  if (is("more")) {
    const pool = ctx.topic ? byTopic(idx, ctx.topic).filter((p) => !ctx.shown.includes(p.id)) : [];
    if (pool.length) return compose(pool.slice(0, 4), ctx);
    if (ctx.topic) return { lead: "That’s everything this site says on that topic. Want to look at something else?", bullets: [], links: [], suggestions: suggestFor(ctx.topic) };
    return ask("Who is Aditya?", idx, ctx);
  }

  if (is("resume")) {
    const picks = pickResume(q + " " + (ctx.lastQuery?.join(" ") ?? ""), idx);
    ctx.topic = "resume";
    const named = /health|hospital|blood|vaccine|supply|operation|logistic|data|analyt|business/.test(normalize(q));
    return { lead: named ? `For that kind of role, the ${picks[0].code} — ${picks[0].name} — version fits best.` : "Aditya keeps three résumé versions — pick the one closest to the role:", bullets: picks.map((r) => `${r.code} · ${r.name} — ${r.blurb}`), links: [], resumes: picks, suggestions: ["Match a role for me", "Is he open to work?", "How can I contact him?"] };
  }

  if (is("whyhire")) return whyHire(idx, ctx);
  if (is("authors")) return compose(byId(idx, "paper", "paper-m", "ch3"), ctx);
  if (is("mercury") && !is("skill")) return compose(byId(idx, "mercury", "vax", "vax-b1", "vax-h0"), ctx);
  if (is("contact")) return compose(byId(idx, "contact", "avail"), ctx, { email: true });
  if (is("availability") && !is("skill")) return compose(byId(idx, "avail", "contact", "loc"), ctx, { email: true, resumes: [kb.resumes.sco, kb.resumes.bda, kb.resumes.hsc] });
  if (is("gpa")) return compose(idx.passages.filter((p) => p.topic === "northeastern" && p.kind === "education").sort((a) => (/gpa/i.test(a.text) ? -1 : 1)), ctx);
  if (is("who") && !is("research") && !is("experience")) return compose([...byId(idx, "who", "who-path", "vax", "paper", "avail")], ctx);

  if (is("weakness")) {
    const p = byId(idx, "vax-b1")[0];
    return { lead: "The portfolio doesn’t list weaknesses — that’s worth asking Aditya directly. One candid moment it does record:", bullets: p ? [p.text] : [], links: [{ label: "Experience", section: "#experience" }], email: true, suggestions: ["Why should we hire him?", "How can I contact him?"] };
  }

  if (is("skill") || (is("tools") && skillObject(q) !== normalize(q).replace(/[?!.]/g, " ").trim() && /\b(used|use|know|with)\b/.test(normalize(q)))) {
    const obj = skillObject(q);
    const raw = words(obj).filter((w) => !STOP.has(w) && w.length > 1).map(stem);
    const ot = correct(tokenize(obj), idx).filter((t) => t.length > 1);
    if (ot.length) {
      const exact = idx.skills.filter((s) => raw.some((w) => w.length > 2 && s.raw.includes(w)));
      // Rarer words decide: "ARIMA forecasting" should land on ARIMA, not on every forecasting skill.
      const freq = (w: string) => idx.skills.filter((x) => x.raw.includes(w)).length || 1;
      const weight = (x: { raw: string[] }) => raw.filter((w) => x.raw.includes(w)).reduce((n, w) => n + 1 / freq(w), 0);
      const hits = exact.length ? exact.sort((a, b) => weight(b) - weight(a))
        : idx.skills.filter((s) => ot.every((t) => s.tokens.includes(t)) || ot.some((t) => t.length > 2 && s.tokens.includes(t) && s.tokens.length <= 3));
      if (hits.length) {
        const top = hits.slice(0, 4);
        ctx.topic = "toolkit";
        return {
          lead: `Yes — ${top[0].name} shows up in his work: ${list(top[0].used)}.`,
          bullets: top.slice(1).map((s) => `${s.name} — ${list(s.used)}.`),
          links: [{ label: "Toolkit", section: "#toolkit", find: top[0].name.split(" · ")[0] }],
          suggestions: SUGGEST.toolkit,
        };
      }
      const asked = displayName(question, obj);
      if (asked && asked.split(" ").length <= 5 && !is("tools")) {
        ctx.topic = "toolkit";
        const near = byId(idx, `tk-Analytics & programming`, `tk-Simulation & design`);
        return { lead: `${asked} isn’t shown anywhere on this site, so I can’t claim it — worth asking Aditya directly. Here’s what the site does show:`, bullets: near.map((p) => p.text), links: [{ label: "Toolkit", section: "#toolkit" }], email: true, suggestions: SUGGEST.toolkit, unknown: true };
      }
    }
  }

  // General retrieval.
  let qt = correct(tokenize(q), idx);
  const followUp = /\b(there|that|it|this|those|them|he did|his role|same)\b/i.test(q) || qt.length <= 1;
  const boost = (p: Passage) => {
    let m = 1;
    for (const i of it) {
      const B = BOOST[i];
      if (!B) continue;
      if (B.kinds?.includes(p.kind)) m += 0.6;
      if (B.topics?.includes(p.topic)) m += 0.35;
    }
    if (followUp && ctx.topic && p.topic === ctx.topic) m += 2.5;
    if (ctx.shown.includes(p.id)) m *= 0.85;
    return m;
  };
  if (followUp && ctx.topic && qt.length === 0) qt = tokenize(ctx.topic);
  let ranked = bm25(qt, idx, boost);

  // Pure category questions ("what tools does he use?", "leadership experience") use curated pools.
  const CATEGORY_WORDS = new Set(["tool", "use", "work", "lead", "project", "award", "certification", "recommend", "run", "study", "course", "research", "where"]);
  const categoryOnly = qt.every((t) => CATEGORY_WORDS.has(t));
  if (categoryOnly && is("tools")) {
    const pool = followUp && ctx.topic ? byTopic(idx, ctx.topic, ["tools"]) : [];
    return compose(pool.length ? pool : idx.passages.filter((p) => p.id.startsWith("tk-")), ctx);
  }
  if (categoryOnly && is("leadership")) return compose([...byId(idx, "cm0", "cm1", "cm2", "cm3", "role-greaves-0")], ctx);
  if (categoryOnly && is("projects")) return compose(idx.passages.filter((p) => p.id.startsWith("pj-") && p.kind === "summary"), ctx);
  if (categoryOnly && is("experience")) return compose(byId(idx, "vax", "role-greaves", "role-nakshatra", "role-mtr", "role-nobroker"), ctx);
  if (!ranked.length || ranked[0].s < 1.2) {
    const cat = it.find((i) => BOOST[i]);
    if (cat) {
      const B = BOOST[cat]!;
      let pool = idx.passages.filter((p) => (B.kinds?.includes(p.kind) ?? true) && (B.topics ? B.topics.includes(p.topic) : true));
      if (followUp && ctx.topic) pool = [...pool.filter((p) => p.topic === ctx.topic), ...pool.filter((p) => p.topic !== ctx.topic)];
      if (cat === "tools" && !(followUp && ctx.topic)) pool = idx.passages.filter((p) => p.id.startsWith("tk-"));
      if (cat === "experience") pool = byId(idx, "vax", "role-greaves", "role-nakshatra", "role-mtr", "role-nobroker");
      if (cat === "projects") pool = idx.passages.filter((p) => p.id.startsWith("pj-") && p.kind === "summary");
      if (pool.length) return compose(pool.slice(0, 5), ctx);
    }
  }

  ctx.lastQuery = qt;
  if (!ranked.length || ranked[0].s < 2.2) {
    return {
      lead: "I only know what’s on Aditya’s portfolio, and I couldn’t find that here. You could ask about:",
      bullets: ["His co-op at Vaxxinova US and Project MERCURY", "His blood supply chain research (Winter Simulation Conference 2026)", "His projects, tools, education and leadership"],
      links: [{ label: "Contact", section: "#contact" }], email: true, suggestions: SUGGEST.default, unknown: true,
    };
  }
  // Keep the answer focused: lead's topic first, then other strong passages.
  const top = ranked[0].s;
  ranked = ranked.filter((r) => r.s >= top * 0.42);
  const lead = ranked[0].p;
  const same = ranked.filter((r) => r.p.topic === lead.topic).map((r) => r.p);
  const other = ranked.filter((r) => r.p.topic !== lead.topic).map((r) => r.p);
  return compose([...same.slice(0, 3), ...other.slice(0, 2)], ctx);
}

export const STARTERS = [
  "Who is Aditya?",
  "What did he build at Vaxxinova?",
  "Tell me about the blood supply chain paper",
  "What tools does he use?",
  "Is he open to work?",
  "Which résumé should I download?",
  "What is AgileFlowSprinter?",
  "Has he used FlexSim?",
  "Why should we hire him?",
  "What's his GPA?",
];

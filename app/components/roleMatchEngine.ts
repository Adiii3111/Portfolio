// Role Match: reads a job posting and lines it up against what this site actually shows.
// Pure functions only (no DOM), so the scoring can be tested outside the browser.
// Every piece of evidence below is a fact from content.ts — nothing is invented.

export type Dim = "domain" | "methods" | "tools" | "leadership";
export type ResumeKey = "sco" | "bda" | "hsc";

export type Evidence = {
  /** Where it was done. */
  source: string;
  /** The proof, kept close to the wording in content.ts. */
  proof: string;
  /** Section to scroll to. */
  section: string;
  /** Text to look for inside that section when highlighting (first match wins). */
  find?: string;
};

export type Signal = {
  id: string;
  label: string;
  dim: Dim;
  patterns: RegExp[];
  evidence: Evidence[];
  /** Toolkit skill names (exact button text) to keep highlighted while the lens is on. */
  lens?: string[];
  resume: Partial<Record<ResumeKey, number>>;
  /** First-person sentence fragment for the tailored intro. */
  pitch: string;
};

export type GapSignal = { id: string; label: string; dim: Dim; patterns: RegExp[]; note?: string };

const MERCURY = "Vaxxinova US · Project MERCURY";

export const SIGNALS: Signal[] = [
  // ── Domain
  {
    id: "healthcare-sc", label: "Healthcare supply chain", dim: "domain",
    patterns: [/health ?care supply/i, /hospital/i, /\bclinical supply/i, /medical (supply|device|product)/i, /\bpatient/i, /\bhealth ?care\b/i, /\bhealth system/i],
    evidence: [
      { source: "WSC 2026 paper", proof: "Co-authored a FlexSim study of a multi-echelon blood supply chain with inter-hospital transshipment, accepted at the Winter Simulation Conference.", section: "#research", find: "Simulation and Performance Evaluation" },
      { source: "Northeastern coursework", proof: "Healthcare Systems Model Analysis (IE 5400).", section: "#journey", find: "Healthcare Systems Model Analysis" },
    ],
    lens: ["Hospital resource planning", "Medical device logistics"],
    resume: { hsc: 3 },
    pitch: "co-authored a blood supply chain simulation paper accepted at the Winter Simulation Conference 2026",
  },
  {
    id: "blood", label: "Blood / perishable products", dim: "domain",
    patterns: [/\bblood\b/i, /perishab/i, /\bplatelet/i, /\bexpir/i, /shelf[- ]life/i, /\bwastage\b/i, /\bspoil/i],
    evidence: [
      { source: "Blood Supply Chain Simulation", proof: "Measured the trade-off between wastage and demand satisfaction; transshipment reduced wastage under supply–demand imbalance.", section: "#research", find: "Inter-hospital transshipment reduced" },
      { source: MERCURY, proof: "Lot-expiry tracking and waste analysis in a decision-assist dashboard.", section: "#experience", find: "Architected" },
    ],
    lens: ["Lot-expiry tracking", "Waste analysis", "FEFO / FIFO inventory logic"],
    resume: { hsc: 3 },
    pitch: "studied wastage versus demand satisfaction for perishable blood inventory",
  },
  {
    id: "pharma", label: "Vaccines, pharma & life sciences", dim: "domain",
    patterns: [/vaccin/i, /pharma/i, /biolog/i, /life ?science/i, /biotech/i, /\banimal health/i, /\bveterinar/i],
    evidence: [
      { source: "Vaxxinova US · Data Analyst Co-op", proof: "Supply chain analytics for a portfolio of 22 vaccine customer accounts (Jan–Aug 2026).", section: "#experience", find: "Vaxxinova US" },
      { source: "Vaxxinova US", proof: "Documented Fermentation, Downstream Processing, and Blending & Bottling as ISO-standard flow diagrams.", section: "#experience", find: "Documented the full vaccine" },
    ],
    lens: ["Process flow documentation"],
    resume: { hsc: 2, sco: 1 },
    pitch: "spent eight months as a Data Analyst Co-op at Vaxxinova US, a veterinary vaccine company",
  },
  {
    id: "cold-chain", label: "Cold chain", dim: "domain",
    patterns: [/cold[- ]chain/i, /temperature[- ]controlled/i, /\b2\s*[-–]\s*8\s*°?\s*c/i, /refrigerat/i],
    evidence: [{ source: "Vaccine supply chain · Vaxxinova US", proof: "Cold chain management for vaccine products.", section: "#toolkit", find: "Cold chain management" }],
    lens: ["Cold chain management"],
    resume: { hsc: 2 },
    pitch: "worked in a vaccine cold chain",
  },
  {
    id: "supply-chain", label: "Supply chain & operations", dim: "domain",
    patterns: [/supply chain/i, /\boperations\b/i, /\bsupply planning/i, /\bend[- ]to[- ]end/i, /\bprocurement/i, /\bsourcing/i, /\bdistribution/i],
    evidence: [
      { source: "M.S. Engineering Management · Northeastern", proof: "Supply Chain Engineering, Deterministic Operations Research, Lean Concepts & Applications.", section: "#journey", find: "Northeastern University" },
      { source: "MTR Foods (Orkla ASA)", proof: "Mapped procurement workflows and recommended ERP integration, reducing estimated sourcing delays by 5–7%.", section: "#experience", find: "MTR Foods" },
    ],
    resume: { sco: 3 },
    pitch: "studied Supply Chain Engineering and Deterministic Operations Research",
  },
  {
    id: "logistics", label: "Logistics & transportation", dim: "domain",
    patterns: [/logistic/i, /transport/i, /\brout(e|ing)\b/i, /\bshipment/i, /\bshipping/i, /\bfreight/i, /\bdelivery/i, /\bcarrier/i, /\bfleet/i, /\bwarehous/i],
    evidence: [
      { source: "Vaxxinova US", proof: "Analyzed 1,000+ shipments across 30 states and 176 locations; modelled a consolidation approach projected to cut shipments by ~10%.", section: "#experience", find: "1,000+" },
      { source: "Nakshatra Agencies", proof: "Vehicle routing model for 12 suppliers and 30 clients, reducing delivery distances by up to 30 km.", section: "#experience", find: "Nakshatra Agencies" },
    ],
    lens: ["Vehicle routing", "Shipment consolidation"],
    resume: { sco: 3 },
    pitch: "analyzed 1,000+ shipments and modelled a consolidation approach projected to cut shipments by about 10%",
  },
  // ── Methods
  {
    id: "forecasting", label: "Demand forecasting & planning", dim: "methods",
    patterns: [/forecast/i, /demand planning/i, /\bs&op\b/i, /\bs ?& ?op\b/i, /sales and operations planning/i, /time[- ]series/i, /\barima\b/i, /exponential smoothing/i, /\bdemand\b/i],
    evidence: [{ source: MERCURY, proof: "Built and validated 7 forecasting models (MAE / MAPE) on an 18-month train / 9-month test split — and was honest that none was reliable enough for direct production planning.", section: "#experience", find: "Built and validated 7" }],
    lens: ["Demand forecasting", "WMA · Exponential smoothing · ETS", "ARIMA · SARIMA · Holt-Winters damped"],
    resume: { sco: 2, bda: 2, hsc: 1 },
    pitch: "built and validated 7 demand forecasting models",
  },
  {
    id: "inventory", label: "Inventory & materials planning", dim: "methods",
    patterns: [/inventor/i, /\bmrp\b/i, /material requirements/i, /\bfefo\b/i, /\bfifo\b/i, /\beoq\b/i, /safety stock/i, /replenish/i, /\blot (tracking|expir)/i, /stock[- ]?out/i],
    evidence: [{ source: MERCURY, proof: "Decision-assist dashboard covering MRP, lot-expiry tracking, and waste analysis.", section: "#experience", find: "What MERCURY brought together" }],
    lens: ["MRP", "FEFO / FIFO inventory logic", "EOQ", "Lot-expiry tracking"],
    resume: { sco: 2, hsc: 1 },
    pitch: "brought MRP, lot-expiry tracking, and waste analysis into one decision-assist view",
  },
  {
    id: "lean", label: "Lean & continuous improvement", dim: "methods",
    patterns: [/\blean\b/i, /six sigma/i, /continuous improvement/i, /kaizen/i, /\b5s\b/i, /value stream/i, /\bvsm\b/i, /root cause/i, /\ba3\b/i, /process improvement/i, /\bwaste reduction/i],
    evidence: [
      { source: "Lean Process Optimization (IE 5617)", proof: "Redesigned a procurement process with VSM and 5-Why analysis, cutting lead time by 15%; zero errors across 5 stations in a clinic simulation.", section: "#work", find: "Lean Process Optimization" },
      { source: "Certification", proof: "LAI Lean Academy® (Northeastern University).", section: "#toolkit", find: "LAI Lean Academy" },
    ],
    lens: ["Value Stream Mapping", "5S · Kaizen", "A3 problem-solving", "Root cause analysis · 5-Why"],
    resume: { sco: 2, hsc: 1 },
    pitch: "cut a procurement lead time by 15% using value stream mapping and 5-Why analysis",
  },
  {
    id: "simulation", label: "Simulation & modelling", dim: "methods",
    patterns: [/simulat/i, /discrete[- ]event/i, /\bflexsim\b/i, /\bmodel(l)?ing\b/i, /operations research/i, /optimi[sz]/i, /\bqueu/i],
    evidence: [
      { source: "Blood Supply Chain Simulation", proof: "FlexSim discrete-event simulation of a regional processing centre and two hospital types.", section: "#research", find: "FlexSim discrete-event simulation" },
      { source: "Nakshatra Agencies", proof: "Routing optimization using the Traveling Salesman Problem, Savings Matrix, and the NEXTMV cloud API.", section: "#experience", find: "Nakshatra Agencies" },
    ],
    lens: ["FlexSim"],
    resume: { sco: 1, hsc: 2 },
    pitch: "built a FlexSim discrete-event simulation of a multi-echelon supply chain",
  },
  {
    id: "analytics", label: "Data analysis & segmentation", dim: "methods",
    patterns: [/analy(tics|sis|ze|zing|st)/i, /segmentation/i, /\bchurn/i, /\bkpi/i, /\bstatistic/i, /\binsight/i, /\bcustomer behavio/i, /\bmetrics\b/i],
    evidence: [{ source: "Vaxxinova US", proof: "Segmented accounts into 5 behavioural categories from 5 years of ordering history and built a churn-risk scoring model.", section: "#experience", find: "Segmented customer accounts" }],
    lens: ["Customer segmentation · churn scoring"],
    resume: { bda: 3 },
    pitch: "segmented 22 customer accounts into 5 behavioural categories and built a churn-risk score",
  },
  // ── Tools
  {
    id: "python", label: "Python", dim: "tools",
    patterns: [/\bpython\b/i, /\bpandas\b/i, /\bnumpy\b/i, /\bstatsmodels\b/i, /\bscripting\b/i],
    evidence: [{ source: MERCURY, proof: "Python · pandas · numpy · statsmodels behind a Plotly Dash dashboard.", section: "#toolkit", find: "Python · pandas · numpy" }],
    lens: ["Python · pandas · numpy", "statsmodels", "openpyxl · xlsxwriter"],
    resume: { bda: 2, sco: 1 },
    pitch: "work in Python (pandas, statsmodels, Dash)",
  },
  {
    id: "bi", label: "Dashboards & BI", dim: "tools",
    patterns: [/dashboard/i, /power ?bi/i, /\bbi\b/i, /business intelligence/i, /\btableau\b/i, /\blooker\b/i, /visuali[sz]/i, /\breporting\b/i, /\bplotly\b/i, /\bdash\b/i],
    evidence: [{ source: MERCURY, proof: "Architected a Python/Dash decision-assist dashboard; Power BI listed in the toolkit.", section: "#mercury-demo" }],
    lens: ["Plotly · Dash", "Power BI"],
    resume: { bda: 3 },
    pitch: "architected a decision-assist dashboard in Python and Plotly Dash",
  },
  {
    id: "excel", label: "Excel", dim: "tools",
    patterns: [/\bexcel\b/i, /spreadsheet/i, /\bvba\b/i, /pivot/i],
    evidence: [{ source: "Nakshatra Agencies", proof: "Excel-based route automation for logistics planning.", section: "#toolkit", find: "Excel (advanced)" }],
    lens: ["Excel (advanced)"],
    resume: { bda: 1, sco: 1 },
    pitch: "automate planning work in advanced Excel",
  },
  {
    id: "cad", label: "CAD & engineering design", dim: "tools",
    patterns: [/\bcad\b/i, /solidworks/i, /\bansys\b/i, /mechanical design/i, /\bfea\b/i],
    evidence: [{ source: "Greaves Electric Mobility", proof: "SolidWorks CAD and ANSYS validation of a side-tipper; tipping angle cut from 85–90° to 35–45°.", section: "#work", find: "Hydraulic Side-Tipper" }],
    lens: ["SolidWorks", "ANSYS Workbench"],
    resume: { sco: 1 },
    pitch: "designed and validated a hydraulic mechanism in SolidWorks and ANSYS",
  },
  {
    id: "process-maps", label: "Process mapping & documentation", dim: "tools",
    patterns: [/process map/i, /flow ?chart/i, /\bsop\b/i, /standard operating/i, /\bmiro\b/i, /\bvisio\b/i, /documentation/i, /\biso\b/i],
    evidence: [{ source: "Vaxxinova US", proof: "ISO-standard flow diagrams of the full vaccine manufacturing process in Miro; 4 case studies presented to senior leadership.", section: "#experience", find: "Documented the full vaccine" }],
    lens: ["Process flow documentation", "Miro"],
    resume: { sco: 1, hsc: 1 },
    pitch: "documented a full manufacturing process as ISO-standard flow diagrams",
  },
  // ── Leadership
  {
    id: "communication", label: "Stakeholder communication", dim: "leadership",
    patterns: [/stakeholder/i, /communicat/i, /present(ation|ing)?\b/i, /cross[- ]functional/i, /\bleadership team/i, /\bexecutive/i, /\bcollaborat/i],
    evidence: [
      { source: "Vaxxinova US", proof: "Synthesized findings into 4 case studies presented to senior leadership.", section: "#experience", find: "Documented the full vaccine" },
      { source: "IE6300 · Northeastern", proof: "Invited guest speaker to the graduate Manufacturing Systems Design course (Oct 2026).", section: "#community", find: "Guest Speaker" },
    ],
    resume: { bda: 1, sco: 1, hsc: 1 },
    pitch: "presented case studies to senior leadership",
  },
  {
    id: "leadership", label: "Leadership & initiative", dim: "leadership",
    patterns: [/\blead(er|ership|ing)?\b/i, /\bmentor/i, /\bteam\b/i, /\bself[- ]starter/i, /\binitiative/i, /\bownership/i, /\bproactive/i],
    evidence: [
      { source: "Greaves Electric Mobility", proof: "Led a 4-member design team.", section: "#experience", find: "Greaves Electric Mobility" },
      { source: "AgileFlowSprinter", proof: "Founded a running and wellness community that began in Bengaluru and continued in Boston and Minnesota.", section: "#running" },
      { source: "INFORMS at Northeastern", proof: "Membership Outreach & Engagement Officer (2026–2027).", section: "#community", find: "INFORMS at Northeastern" },
    ],
    resume: { bda: 1, sco: 1, hsc: 1 },
    pitch: "founded the AgileFlowSprinter running community and led a 4-member design team",
  },
  {
    id: "project-mgmt", label: "Project management", dim: "leadership",
    patterns: [/project manag/i, /\bproject\b/i, /\bprioriti/i, /\btimelines?\b/i, /\bdeliverables?\b/i],
    evidence: [{ source: "Northeastern coursework", proof: "Engineering Project Management; coordinated a 5-member team in the Lean clinic simulation.", section: "#journey", find: "Engineering Project Management" }],
    resume: { sco: 1, bda: 1 },
    pitch: "studied engineering project management and coordinated a 5-member team",
  },
  {
    id: "research", label: "Research & publication", dim: "leadership",
    patterns: [/\bresearch/i, /publication/i, /\bpeer[- ]reviewed/i, /\bacademic/i],
    evidence: [{ source: "Winter Simulation Conference 2026", proof: "Co-author with K. R. Chilkuri and Professor Tugce Martagan; accepted for the proceedings.", section: "#research", find: "Winter Simulation Conference" }],
    resume: { hsc: 1 },
    pitch: "have a co-authored conference paper accepted at WSC 2026",
  },
];

/** Common asks this site does not show. Phrased neutrally in the report. */
export const GAPS: GapSignal[] = [
  { id: "sql", label: "SQL", dim: "tools", patterns: [/\bsql\b/i, /\bpostgres/i, /\bmysql\b/i, /\bsnowflake\b/i, /\bbigquery\b/i] },
  { id: "tableau", label: "Tableau", dim: "tools", patterns: [/\btableau\b/i], note: "Power BI and Plotly Dash are shown instead." },
  { id: "sap", label: "SAP / Oracle / ERP systems", dim: "tools", patterns: [/\bsap\b/i, /\boracle\b/i, /\bnetsuite\b/i, /\bkinaxis\b/i, /blue yonder/i, /\bo9\b/i], note: "The site shows an ERP-integration recommendation at MTR Foods, not hands-on use." },
  { id: "r", label: "R", dim: "tools", patterns: [/\bR\b(?![&/])/] },
  { id: "ml", label: "Machine learning", dim: "methods", patterns: [/machine learning/i, /\bml\b/i, /deep learning/i, /\bai\b/i], note: "Statistical forecasting and churn scoring are shown; ML models are not." },
  { id: "cloud", label: "Cloud platforms", dim: "tools", patterns: [/\baws\b/i, /\bazure\b/i, /\bgcp\b/i, /google cloud/i] },
  { id: "gxp", label: "GxP / GMP compliance", dim: "domain", patterns: [/\bgxp\b/i, /\bgmp\b/i, /\bfda\b/i, /regulatory/i] },
  { id: "six-sigma-belt", label: "Six Sigma belt certification", dim: "methods", patterns: [/(green|black|yellow) belt/i, /six sigma certif/i], note: "Lean training (LAI Lean Academy®) is shown; a belt is not." },
  { id: "apics", label: "APICS / ASCM certification (CPIM, CSCP)", dim: "methods", patterns: [/\bapics\b/i, /\bascm\b/i, /\bcpim\b/i, /\bcscp\b/i] },
  { id: "pmp", label: "PMP certification", dim: "leadership", patterns: [/\bpmp\b/i] },
  { id: "clinical", label: "Clinical licence or patient care", dim: "domain", patterns: [/\brn\b/i, /registered nurse/i, /nursing/i, /\bbls\b/i, /\bacls\b/i, /bedside/i, /patient care/i, /clinical licen/i] },
  { id: "web", label: "Front-end / software engineering", dim: "tools", patterns: [/\breact\b/i, /javascript/i, /typescript/i, /\bcss\b/i, /\bhtml\b/i, /front[- ]end/i, /\bnode\.?js\b/i, /software engineer/i] },
  { id: "java", label: "Java / C++ / C#", dim: "tools", patterns: [/\bjava\b/i, /c\+\+/i, /\bc#/i] },
];

export const DIM_LABEL: Record<Dim, string> = { domain: "Domain", methods: "Methods", tools: "Tools", leadership: "Leadership" };
const DIM_WEIGHT: Record<Dim, number> = { domain: 1.3, methods: 1.2, tools: 1, leadership: 0.7 };

export type MatchedSignal = { signal: Signal; hits: string[] };
export type FoundGap = { gap: GapSignal; hits: string[] };

export type Report = {
  matched: MatchedSignal[];
  gaps: FoundGap[];
  score: number; // 0–100
  dims: { dim: Dim; matched: number; asked: number }[];
  resume: ResumeKey;
  resumeScores: Record<ResumeKey, number>;
  years?: number;
  words: number;
};

function hitsFor(text: string, patterns: RegExp[]) {
  const out = new Set<string>();
  for (const p of patterns) {
    const g = new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g");
    for (const m of text.matchAll(g)) {
      out.add(m[0].trim().toLowerCase());
      if (out.size > 4) break;
    }
  }
  return [...out];
}

export function analyze(raw: string): Report | null {
  const text = raw.replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  if (words < 6) return null;

  const matched = SIGNALS.map((signal) => ({ signal, hits: hitsFor(text, signal.patterns) })).filter((m) => m.hits.length);
  const gaps = GAPS.map((gap) => ({ gap, hits: hitsFor(text, gap.patterns) })).filter((g) => g.hits.length);

  const dims = (Object.keys(DIM_LABEL) as Dim[]).map((dim) => {
    const m = matched.filter((x) => x.signal.dim === dim).length;
    const g = gaps.filter((x) => x.gap.dim === dim).length;
    return { dim, matched: m, asked: m + g };
  });

  // Score = weighted share of detected requirements that have evidence here.
  // A requirement mentioned several times counts a little more (up to 1.5×).
  let have = 0, asked = 0;
  for (const m of matched) { const w = DIM_WEIGHT[m.signal.dim] * Math.min(1.5, 1 + (m.hits.length - 1) * 0.15); have += w; asked += w; }
  // A gap the posting keeps coming back to (RN, BLS, bedside…) is a core requirement: it weighs more.
  for (const g of gaps) { const w = DIM_WEIGHT[g.gap.dim] * Math.min(2.5, 1 + (g.hits.length - 1) * 0.3); asked += w; }
  // Very few detected requirements → we know little; damp the score toward the middle.
  const confidence = Math.min(1, (matched.length + gaps.length) / 6);
  const share = asked ? have / asked : 0;
  const score = Math.round(100 * (share * confidence + 0.5 * share * (1 - confidence)));

  const resumeScores: Record<ResumeKey, number> = { sco: 0, bda: 0, hsc: 0 };
  for (const m of matched) for (const [k, v] of Object.entries(m.signal.resume) as [ResumeKey, number][]) resumeScores[k] += v * m.hits.length;
  const resume = (["sco", "hsc", "bda"] as ResumeKey[]).reduce((best, k) => (resumeScores[k] > resumeScores[best] ? k : best), "sco" as ResumeKey);

  const y = text.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d+\s*)?years?/i);
  return { matched, gaps, score, dims, resume, resumeScores, years: y ? Number(y[1]) : undefined, words };
}

export function tailoredIntro(r: Report) {
  const order: Dim[] = ["domain", "methods", "tools", "leadership"];
  const top = [...r.matched].sort((a, b) => order.indexOf(a.signal.dim) - order.indexOf(b.signal.dim) || b.hits.length - a.hits.length).slice(0, 3);
  const lines = [
    "Hi — I’m Aditya Kadlabal Sripad. I’m finishing an M.S. in Engineering Management at Northeastern University (GPA 3.71, December 2026) and I’m open to full-time roles from early 2027.",
  ];
  if (top.length) {
    const parts = top.map((m) => m.signal.pitch);
    const joined = parts.length > 1 ? `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}` : parts[0];
    lines.push(`Relevant to this role, I ${joined}.`);
  }
  lines.push("I’d welcome a conversation about how I could help your team.");
  return lines.join(" ");
}

/** Generic sample postings (not real companies) so visitors can try it in one click. */
export const SAMPLES: { id: string; label: string; text: string }[] = [
  {
    id: "hsc",
    label: "Healthcare supply chain analyst",
    text: "Sample posting — Healthcare Supply Chain Analyst. A regional hospital network is looking for an analyst to support supply chain operations across its hospitals. You will monitor inventory levels and expiry of perishable medical products, including blood products, analyze usage data to reduce waste, support cold chain and temperature-controlled logistics, and build dashboards (Power BI or similar) for clinical and operations stakeholders. Requirements: degree in industrial engineering, supply chain or related field; experience with demand forecasting and inventory management; Python or Excel; strong communication and presentation skills; simulation or process-improvement (Lean) experience is a plus. Familiarity with SQL and GMP environments preferred.",
  },
  {
    id: "sco",
    label: "Supply chain & operations planner",
    text: "Sample posting — Supply Chain & Operations Planner. Join a manufacturing operations team to own demand planning and S&OP inputs, run MRP and material requirements planning, set safety stock and replenishment policies, and coordinate with logistics on transportation, shipment consolidation and routing. You will lead continuous improvement projects using Lean, value stream mapping, root cause analysis and Kaizen. Requirements: 0-2 years of experience; forecasting and inventory optimization; advanced Excel; experience with SAP or another ERP; APICS CPIM a plus; cross-functional collaboration and project management skills.",
  },
  {
    id: "bda",
    label: "Business & data analyst",
    text: "Sample posting — Business & Data Analyst. We need an analyst to turn data into insight for commercial and operations leaders. Responsibilities: build KPI dashboards and reporting in Tableau or Power BI, perform customer segmentation and churn analysis, develop time-series forecasting models, write Python (pandas) and SQL to clean and analyze data, and present findings to stakeholders. Requirements: degree in analytics, engineering or related field; strong statistics; data visualization; machine learning exposure is a plus; self-starter who takes ownership.",
  },
];

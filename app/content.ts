// All public-facing copy lives here so facts can be reviewed in one place.
import { asset } from "./lib/asset";

export const person = {
  fullName: "Aditya Kadlabal Sripad",
  displayName: "Aditya K. Sripad",
  roles: ["Engineer", "Researcher", "Analyst", "Builder", "Runner"],
  email: "adityasripad3111@gmail.com",
  collegeEmail: "kadlabalsripad.a@northeastern.edu",
  linkedin: "https://www.linkedin.com/in/adityakadlabalsripad/",
};

// Three tailored résumés, served from /public/resumes.
export const resumes = [
  {
    title: "Supply Chain & Operations",
    file: "/resumes/Aditya_Sripad_Supply_Chain_and_Operations_Resume.pdf",
    summary: "MRP, inventory logic, demand forecasting, shipment consolidation, vehicle routing, and Lean process improvement.",
    for: "Supply chain, operations, logistics, and planning roles",
  },
  {
    title: "Business & Data Analytics",
    file: "/resumes/Aditya_Sripad_Business_and_Data_Analytics_Resume.pdf",
    summary: "Python and Power BI analytics, forecasting model validation, customer segmentation, and churn-risk scoring.",
    for: "Business analyst, data analyst, and BI roles",
  },
  {
    title: "Healthcare Supply Chain",
    file: "/resumes/Aditya_Sripad_Healthcare_Supply_Chain_Resume.pdf",
    summary: "Cold chain, lot expiry tracking, hospital resource planning, and blood supply chain simulation research.",
    for: "Healthcare, life sciences, and medical supply chain roles",
  },
];

export const sections = [
  { id: "top", label: "Opening", short: "Home" },
  { id: "about", label: "About Me", short: "About" },
  { id: "journey", label: "My Journey", short: "Journey" },
  { id: "experience", label: "Experience", short: "Experience" },
  { id: "work", label: "Selected Projects", short: "Work" },
  { id: "research", label: "Research", short: "Research" },
  { id: "lab", label: "The Lab", short: "Lab" },
  { id: "running", label: "AgileFlowSprinter", short: "AgileFlowSprinter" },
  { id: "community", label: "Leadership & Community", short: "Community" },
  { id: "beyond", label: "Life Beyond Engineering", short: "Beyond" },
  { id: "recommendations", label: "Recommendations", short: "Words" },
  { id: "toolkit", label: "Toolkit & Certifications", short: "Toolkit" },
  { id: "resume", label: "Résumé", short: "Résumé" },
  { id: "contact", label: "Contact", short: "Contact" },
] as const;

export type CityKey = "bengaluru" | "boston" | "willmar";

export const chapters: {
  when: string;
  city: CityKey;
  place: string;
  kind: string;
  title: string;
  body: string;
  details?: { label: string; value: string }[];
  list?: string[];
  listLabel?: string;
  photo?: { src: string; alt: string; caption: string; position?: string };
  /** Illustration shown instead of a photo. */
  art?: { kind: "willmar"; caption: string };
}[] = [
  {
    when: "Aug 2019 — Aug 2023",
    city: "bengaluru",
    place: "Bengaluru, India",
    kind: "Education",
    title: "R.V. College of Engineering",
    body: "Bachelor of Engineering in Industrial Engineering and Management. Four years of learning how systems are designed, measured, and improved.",
    photo: { src: asset("/images/rvce-graduation.jpg"), alt: "Aditya in a light-blue blazer and blue tie at his RVCE graduation", caption: "RVCE graduation · Bengaluru", position: "50% 25%" },
    details: [
      { label: "Degree", value: "B.E., Industrial Engineering & Management" },
      { label: "Graduated", value: "August 2023" },
    ],
    list: ["First Best Project Award · Library Redesign", "Second Best Project Award · Senior Project"],
    listLabel: "Academic awards",
  },
  {
    when: "2021 — 2023",
    city: "bengaluru",
    place: "Bengaluru, India",
    kind: "Industry",
    title: "Ideas meet the real world",
    body: "Process mapping at MTR Foods, routing optimization at Nakshatra Agencies, electric-vehicle design at Greaves Electric Mobility, and client advisory work at NoBroker.com.",
  },
  {
    when: "Sep 2024 — Dec 2026",
    city: "boston",
    place: "Boston, Massachusetts",
    kind: "Education",
    title: "Northeastern University",
    body: "Master of Science in Engineering Management — bringing together analytics, supply chains, and healthcare systems.",
    photo: { src: asset("/images/boston-first-days.jpg"), alt: "Aditya in sunglasses, a grey hoodie and a fanny pack walking a tree-lined path in Boston", caption: "First days in the U.S. · Boston", position: "45% 40%" },
    details: [
      { label: "Degree", value: "M.S., Engineering Management" },
      { label: "GPA", value: "3.71 / 4.00" },
      { label: "Completion", value: "December 2026 (expected)" },
    ],
    list: [
      "Supply Chain Engineering",
      "Healthcare Systems Model Analysis",
      "Deterministic Operations Research",
      "Lean Concepts & Applications",
      "Engineering Project Management",
      "Computation & Visualization",
      "Engineering Probability & Statistics",
      "Economic Decision Making",
    ],
    listLabel: "Coursework",
  },
  {
    when: "2025 — 2026",
    city: "boston",
    place: "Boston, Massachusetts",
    kind: "Research",
    title: "Research with purpose",
    body: "Built a FlexSim discrete-event simulation of a multi-echelon blood supply chain, which became a co-authored paper with K. R. Chilkuri and Professor Tugce Martagan — accepted at the Winter Simulation Conference, December 2026.",
    photo: { src: asset("/images/boston-winter.jpg"), alt: "Aditya in a red winter jacket at an ice rink in Boston at night", caption: "Winter in Boston", position: "50% 40%" },
  },
  {
    when: "Jan — Aug 2026",
    city: "willmar",
    place: "Willmar, Minnesota",
    kind: "Industry",
    title: "From analysis to action",
    art: { kind: "willmar", caption: "Land of 10,000 Lakes · Willmar, Minnesota" },
    body: "Data Analyst Co-op at Vaxxinova US, building Project MERCURY — a Python-based supply chain decision-assist dashboard — and starting a running group with colleagues.",
  },
  {
    when: "2027 →",
    city: "boston",
    place: "And beyond",
    kind: "Next",
    title: "The next chapter",
    body: "Exploring full-time opportunities in healthcare, life sciences, supply chain, and analytics beginning in early 2027.",
  },
];

export const mercuryCapabilities = [
  "Demand forecasting",
  "Material requirements planning",
  "Lot-expiry tracking",
  "Waste analysis",
  "Customer segmentation",
  "Churn-risk scoring",
  "Fill-date tracking",
  "Demand-shift analysis",
  "Shipping-gap monitoring",
];

/** Vaxxinova US — public, résumé-level description of the work. */
export const vaxxinova = {
  highlights: [
    { value: "7", label: "forecasting models built and validated (MAE / MAPE)" },
    { value: "5", label: "behavioural customer segments from 5 years of orders" },
    { value: "1,000+", label: "shipments analyzed across 30 states and 176 locations" },
    { value: "~10%", label: "fewer shipments projected from a consolidation approach" },
  ],
  bullets: [
    "Architected Project MERCURY, a Python/Dash decision-assist dashboard for demand forecasting, MRP, lot-expiry tracking, and waste analysis across a portfolio of 22 vaccine customer accounts.",
    "Built and validated 7 forecasting models on an 18-month train / 9-month test split. No single model was reliable enough for direct production planning — so the dashboard was redirected toward fill-date tracking, demand-shift analysis, and shipping-gap monitoring as the primary decision tools.",
    "Segmented customer accounts into 5 behavioural categories using coefficient-of-variation analysis on 5 years of ordering history, surfacing rising, declining, and inconsistent-demand accounts; built a churn-risk scoring model to flag at-risk accounts.",
    "Analyzed 1,000+ shipments across 30 states and 176 locations, identified redundant delivery patterns, and modelled a consolidation approach projected to cut shipments by roughly 10%.",
    "Documented the full vaccine manufacturing process — Fermentation, Downstream Processing, and Blending & Bottling — as ISO-standard flow diagrams in Miro during a production-floor rotation, and synthesized findings into 4 case studies presented to senior leadership.",
  ],
  tools: ["Python", "pandas", "statsmodels", "Plotly Dash", "MAE / MAPE validation", "CV% segmentation", "Miro"],
};

export const otherRoles = [
  {
    year: "Sep — Nov 2023",
    org: "NoBroker.com",
    role: "Client Advisor · Bengaluru",
    bullets: [
      "Analyzed client requirements and property market data to shortlist options and streamline buyers’ decisions.",
      "Coordinated end-to-end transactions — including a $300,000 property sale — through structured negotiation and documentation.",
      "Built client relationships across virtual and in-person channels.",
    ],
    tags: ["Market research", "Negotiation", "Client relationships"],
  },
  {
    year: "Mar — Jun 2023",
    org: "Greaves Electric Mobility",
    role: "Design Project Intern · Hydraulically operated tipper for an electric 3-wheeler",
    bullets: [
      "Led a 4-member team to design a side-tipper mechanism, reducing the tipping angle from 85–90° to 35–45°.",
      "Applied a Pugh matrix to select the most cost-effective design, cutting operational costs by 5%.",
      "Built a 3D CAD model and ran ANSYS simulations to validate stress, deformation, and geometry — improving load-bearing capacity and stability by 8%.",
    ],
    tags: ["SolidWorks CAD", "ANSYS Workbench", "Pugh matrix", "Team lead"],
  },
  {
    year: "Apr — Jul 2022",
    org: "Nakshatra Agencies",
    role: "Logistics Project Intern · Vehicle routing for a distribution agency",
    bullets: [
      "Developed a vehicle routing optimization model — Traveling Salesman Problem, Savings Matrix method, and the NEXTMV cloud API — for a network of 12 suppliers and 30 clients, reducing delivery distances by up to 30 km.",
      "Streamlined logistics planning with Excel-based route automation.",
    ],
    tags: ["TSP", "Savings Matrix", "NEXTMV", "Excel automation"],
  },
  {
    year: "Sep — Oct 2021",
    org: "MTR Foods Pvt. Ltd. (Orkla ASA)",
    role: "Engineering Procurement Intern · Procurement process mapping",
    bullets: [
      "Mapped procurement workflows across the Engineering Store, Maintenance, and Purchase teams.",
      "Recommended ERP integration to close paper-based approval gaps, reducing estimated sourcing delays by 5–7%.",
    ],
    tags: ["Process mapping", "ERP", "Procurement"],
  },
];

export type Project = {
  id: string;
  title: string;
  category: string;
  year: string;
  context: string;
  challenge: string;
  role: string;
  tools: string[];
  outcome?: string;
  caseStudy: string[];
  visual: "dashboard" | "network" | "tipper" | "routing" | "library" | "lean" | "queue";
  note?: string;
};

export const projects: Project[] = [
  {
    id: "mercury",
    title: "Project MERCURY",
    category: "Supply chain analytics",
    year: "Jan — Aug 2026 · Vaxxinova US",
    context: "Planning for a portfolio of 22 vaccine customer accounts spans demand forecasting, MRP, lot-expiry tracking, and waste.",
    challenge: "Give planners one decision-assist view — and be honest about where forecasts can and can’t be trusted.",
    role: "Architected and built the Python/Dash dashboard as a Data Analyst Co-op.",
    tools: ["Python", "Dash", "statsmodels", "MRP", "CV% segmentation", "Churn scoring"],
    outcome: "7 models validated; none was reliable enough for direct production planning, so the tool pivoted to fill-date tracking, demand-shift analysis, and shipping-gap monitoring. A shipment-consolidation approach was projected to cut shipments by ~10%.",
    caseStudy: [
      "Built and scored 7 forecasting models on an 18-month train / 9-month test split.",
      "Redirected the dashboard toward monitoring tools when no single model proved production-ready.",
      "Segmented accounts into 5 behavioural categories and flagged churn risk.",
      "Analyzed 1,000+ shipments and modelled consolidation.",
      "The original system, code, and data are proprietary — try the synthetic demo in the Experience section.",
    ],
    visual: "dashboard",
    note: "Proprietary system — described at résumé level only.",
  },
  {
    id: "blood",
    title: "Blood Supply Chain Simulation",
    category: "Healthcare operations research",
    year: "Sep 2025 — present · Northeastern",
    context: "Blood is perishable and life-critical, moving from a regional processing centre to two types of hospital.",
    challenge: "Evaluate the trade-off between wastage and demand satisfaction under varying donation and demand levels.",
    role: "Built the FlexSim discrete-event simulation (IE 5400 Healthcare Systems Model Analysis, also applied in IE 7200 Supply Chain Engineering); co-author of the resulting paper.",
    tools: ["FlexSim", "Discrete-event simulation", "Perishable inventory", "Transshipment"],
    outcome: "Inter-hospital transshipment reduced wastage and improved demand satisfaction under supply–demand imbalance, while donations beyond a capacity threshold increased system-wide wastage because of processing bottlenecks. Accepted at the Winter Simulation Conference, Dec 2026.",
    caseStudy: [
      "Modelled a multi-echelon blood supply chain in FlexSim.",
      "Varied donation and demand levels and transshipment policies.",
      "Measured wastage rate and demand satisfaction.",
      "Co-authored with K. R. Chilkuri and Professor Tugce Martagan.",
    ],
    visual: "network",
  },
  {
    id: "tipper",
    title: "Hydraulic Side-Tipper for an Electric 3-Wheeler",
    category: "Mechanical engineering design",
    year: "Mar — Jun 2023 · Greaves Electric Mobility",
    context: "Electric three-wheelers that tip their load to the side needed a lower-angle hydraulic mechanism.",
    challenge: "Reduce the tipping angle without compromising strength or cost.",
    role: "Led a 4-member design team.",
    tools: ["SolidWorks CAD", "ANSYS Workbench", "Pugh matrix", "Hydraulics"],
    outcome: "Tipping angle reduced from 85–90° to 35–45°; operational costs cut by 5%; load-bearing capacity and stability improved by 8%.",
    caseStudy: ["Generated and compared design concepts", "Selected the most cost-effective design with a Pugh matrix", "Built the 3D CAD model", "Validated stress, deformation, and geometry in ANSYS"],
    visual: "tipper",
  },
  {
    id: "routing",
    title: "Vehicle Routing Optimization",
    category: "Operations & optimization",
    year: "Apr — Jul 2022 · Nakshatra Agencies",
    context: "A distribution agency serving 30 clients from 12 suppliers.",
    challenge: "Shorten delivery routes across the network.",
    role: "Developed the routing optimization model as a Logistics Project Intern.",
    tools: ["Traveling Salesman Problem", "Savings Matrix", "NEXTMV cloud API", "Excel"],
    outcome: "Delivery distances reduced by up to 30 km.",
    caseStudy: ["Framed distribution as a routing problem", "Applied the Traveling Salesman Problem and the Savings Matrix method", "Solved with the NEXTMV cloud API", "Automated route planning in Excel"],
    visual: "routing",
  },
  {
    id: "library",
    title: "RVCE Library Redesign",
    category: "Human-centered design",
    year: "R.V. College of Engineering",
    context: "A university library and the people who use it.",
    challenge: "Rethink the space around how students actually study, search, and collaborate.",
    role: "Contributed to a human-centered redesign concept.",
    tools: ["Design thinking", "Augmented reality", "Space planning"],
    outcome: "First Best Project Award at R.V. College of Engineering.",
    caseStudy: ["Human-centered research into library use", "Redesign concept for the space", "Augmented-reality visualization of the proposal"],
    visual: "library",
  },
  {
    id: "lean",
    title: "Lean Process Optimization",
    category: "Process improvement",
    year: "May — Jun 2025 · Northeastern (IE 5617)",
    context: "A procurement process, and a Lean simulation of a healthcare clinic.",
    challenge: "Find the waste in each flow and remove it.",
    role: "Redesigned the procurement process; coordinated a 5-member team in the clinic simulation.",
    tools: ["Value Stream Mapping", "5-Why analysis", "Cross-training", "Pull replenishment"],
    outcome: "Procurement lead time cut by 15%; zero errors across 5 stations in the clinic simulation.",
    caseStudy: ["Mapped the current-state value stream", "Traced root causes with 5-Why analysis", "Redesigned the future-state process", "Ran the clinic simulation with cross-training and pull-based replenishment"],
    visual: "lean",
  },
  {
    id: "patients",
    title: "Healthcare Patient Flow",
    category: "Healthcare systems modeling",
    year: "Healthcare analytics",
    context: "How patients move through a healthcare system.",
    challenge: "Understand patterns in patient flow and where queues form.",
    role: "Analysis and modeling.",
    tools: ["Statistical analysis", "Forecasting", "Queueing models"],
    caseStudy: ["Statistical analysis of flow patterns", "Forecasting", "Queueing-related modeling"],
    visual: "queue",
  },
];

export const paper = {
  title: "Simulation and Performance Evaluation of a Multi-Echelon Perishable Blood Supply Chain with Inter-Hospital Transshipment",
  venue: "Winter Simulation Conference 2026",
  status: "Accepted for the proceedings",
  authors: "K. R. Chilkuri, A. Kadlabal Sripad, T. Martagan",
  findings: [
    "Inter-hospital transshipment reduced wastage and improved demand satisfaction when supply and demand were out of balance.",
    "Donations beyond a capacity threshold increased system-wide wastage, because processing became the bottleneck.",
  ],
  method: "FlexSim discrete-event simulation of a regional processing centre and two hospital types, under varying donation and demand levels.",
  topics: ["Blood supply chain modeling", "Perishable inventory", "Healthcare logistics", "Inter-hospital transshipment", "Operational resilience", "Simulation-based evaluation"],
};

export const community = [
  { when: "2026 — 2027", title: "INFORMS at Northeastern", role: "Membership Outreach & Engagement Officer", body: "Connecting students with operations research and analytics through events and shared interests.", link: "https://informs-northeastern.github.io/website/" },
  { when: "Oct 2026", title: "IE6300 · Manufacturing Systems Design", role: "Guest Speaker", body: "Invited to speak to the graduate course at Northeastern University." },
  { when: "Sep 2026 — present", title: "IE6300 · Manufacturing Systems Design", role: "Course Assistant Grader", body: "Supporting students in the graduate course at Northeastern University." },
  { when: "Bengaluru → Boston", title: "AgileFlowSprinter", role: "Founder", body: "A running and wellness community that began in Bengaluru and continued in Boston and Minnesota." },
  { when: "Undergraduate", title: "OSAAT · IDEA RVCE", role: "Volunteer & participant", body: "Volunteer work through OSAAT and participation in IDEA RVCE." },
];

/** Skills grouped by domain, each linked to where it was used. */
export const toolkit: { group: string; skills: { name: string; used: string[] }[] }[] = [
  {
    group: "Supply chain & forecasting",
    skills: [
      { name: "Demand forecasting", used: ["Vaxxinova US · Project MERCURY"] },
      { name: "WMA · Exponential smoothing · ETS", used: ["Vaxxinova US · 7-model validation"] },
      { name: "ARIMA · SARIMA · Holt-Winters damped", used: ["Vaxxinova US · 7-model validation"] },
      { name: "MRP", used: ["Project MERCURY"] },
      { name: "FEFO / FIFO inventory logic", used: ["Project MERCURY", "Blood supply chain simulation"] },
      { name: "EOQ", used: ["Supply Chain Engineering coursework"] },
      { name: "Waste analysis", used: ["Project MERCURY", "Blood supply chain simulation"] },
      { name: "Vehicle routing", used: ["Nakshatra Agencies"] },
      { name: "Shipment consolidation", used: ["Vaxxinova US · 1,000+ shipments"] },
    ],
  },
  {
    group: "Healthcare supply chain",
    skills: [
      { name: "Cold chain management", used: ["Vaccine supply chain · Vaxxinova US"] },
      { name: "Lot-expiry tracking", used: ["Project MERCURY"] },
      { name: "Hospital resource planning", used: ["Blood supply chain simulation", "Healthcare Systems Model Analysis"] },
      { name: "Medical device logistics", used: ["Healthcare supply chain"] },
    ],
  },
  {
    group: "Process & quality",
    skills: [
      { name: "Value Stream Mapping", used: ["Lean Process Optimization (IE 5617)"] },
      { name: "5S · Kaizen", used: ["Lean Process Optimization", "LAI Lean Academy®"] },
      { name: "A3 problem-solving", used: ["LAI Lean Academy®"] },
      { name: "Root cause analysis · 5-Why", used: ["Lean Process Optimization"] },
      { name: "Process flow documentation", used: ["Vaxxinova US · ISO-standard flow diagrams", "MTR Foods · procurement mapping"] },
    ],
  },
  {
    group: "Analytics & programming",
    skills: [
      { name: "Python · pandas · numpy", used: ["Project MERCURY"] },
      { name: "statsmodels", used: ["Project MERCURY · forecasting"] },
      { name: "Plotly · Dash", used: ["Project MERCURY"] },
      { name: "openpyxl · xlsxwriter", used: ["Project MERCURY · reporting"] },
      { name: "Customer segmentation · churn scoring", used: ["Vaxxinova US"] },
      { name: "Excel (advanced)", used: ["Nakshatra Agencies · route automation"] },
      { name: "Power BI", used: ["Analytics & reporting"] },
    ],
  },
  {
    group: "Simulation & design",
    skills: [
      { name: "FlexSim", used: ["Blood supply chain simulation · WSC 2026"] },
      { name: "ANSYS Workbench", used: ["Greaves Electric Mobility"] },
      { name: "SolidWorks", used: ["Greaves Electric Mobility"] },
      { name: "Miro", used: ["Vaxxinova US · process flow diagrams"] },
    ],
  },
];

export const certifications = [
  { name: "LAI Lean Academy®", issuer: "Northeastern University" },
  { name: "Fundamentals of Digital Marketing", issuer: "IAB Europe" },
];

export const recommendations = [
  {
    quote: "Aditya is hardworking, ambitious, and proactive. He takes initiative and is strongly motivated by creating impact.",
    name: "Tugce Martagan",
    title: "Associate Professor · Northeastern University",
    link: "https://www.linkedin.com/in/tugce-martagan-86077a26/",
    context: "Recognized Aditya’s healthcare operations research, accepted conference paper, initiative, and analytics work during his co-op.",
  },
  {
    quote: "Aditya is a motivated and talented professional, and I am confident he will be a valuable asset wherever his career takes him.",
    name: "Oscar Repping",
    title: "COO · Vaxxinova",
    link: "https://www.linkedin.com/in/oscar-repping-37221b5b/",
    context: "Highlighted Aditya’s analytical contributions, positive engagement, and initiative in starting a running club for colleagues.",
  },
];

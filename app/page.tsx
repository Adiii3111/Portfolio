import Intro from "./components/Intro";
import SiteNav from "./components/SiteNav";
import Journey from "./components/Journey";
import MercuryDemo from "./components/MercuryDemo";
import ProjectShowcase from "./components/ProjectShowcase";
import BloodNetwork from "./components/BloodNetwork";
import Recommendations from "./components/Recommendations";
import Lab from "./components/Lab";
import PulseChain from "./components/PulseChain";
import Zoomable from "./components/Zoomable";
import Toolkit from "./components/Toolkit";
import LivingCanvas from "./components/LivingCanvas";
import { asset } from "./lib/asset";
import ContactLauncher from "./components/ContactLauncher";
import HelixField from "./components/HelixField";
import AeternusDock from "./components/AeternusDock";
import ShelfLife from "./components/ShelfLife";
import { ResumePicker } from "./components/RoleMatch";
import { RotatingWords, StatCards } from "./components/HeroBits";
import { community, mercuryCapabilities, otherRoles, paper, person, vaxxinova } from "./content";

function ChapterHead({ n, label, title, lede }: { n: string; label: string; title: React.ReactNode; lede?: string }) {
  return (
    <header className="chapter-head reveal">
      <p className="chapter-label"><span>{n}</span>{label}</p>
      <h2>{title}</h2>
      {lede && <p className="lede">{lede}</p>}
    </header>
  );
}

const heroFocus = [
  "blood supply chain simulation.",
  "vaccine demand forecasting.",
  "decision-assist dashboards.",
  "healthcare operations research.",
  "lean process improvement.",
  "shipment consolidation.",
];

const heroStats = [
  { lot: "LOT 01", source: "Vaxxinova US", value: "1,000+", label: "shipments analyzed across 30 states and 176 locations", href: "#experience" },
  { lot: "LOT 02", source: "Project MERCURY", value: "7", label: "forecasting models built and validated for vaccine demand", href: "#mercury-demo" },
  { lot: "LOT 03", source: "Consolidation", value: "~10%", label: "fewer shipments projected from a consolidation approach", href: "#experience" },
  { lot: "LOT 04", source: "Research", value: "WSC ’26", label: "co-authored blood supply chain paper, accepted to the proceedings", href: "#research" },
];

export default function Home() {
  return (
    <>
      <HelixField />
      <Intro />
      <SiteNav />
      <AeternusDock />
      <main>
        {/* 01 — HERO */}
        <section id="top" className="hero">
          <div className="hero-grid">
            <div className="hero-text">
              <div className="hero-id">
                <div className="hero-avatar">
                  <svg className="hero-ring" viewBox="0 0 120 120" aria-hidden="true">
                    <defs><path id="ring-path" d="M60 60m-49 0a49 49 0 1 1 98 0a49 49 0 1 1-98 0" /></defs>
                    <text><textPath href="#ring-path" textLength="306" lengthAdjust="spacing">SUPPLY CHAIN · HEALTHCARE · DATA ANALYTICS ·</textPath></text>
                  </svg>
                  <img src={asset("/images/aditya-kadlabal-sripad.jpg")} alt="Portrait of Aditya Kadlabal Sripad in a navy suit and tie" />
                </div>
                <div className="hero-id-text">
                  <p className="hero-name">{person.fullName}</p>
                  <p className="hero-status"><svg viewBox="0 0 22 14" aria-hidden="true"><path d="M1 2h12v8H1ZM13 5h4.5L21 8v2h-8" /><circle cx="5" cy="11.5" r="1.8" /><circle cx="17" cy="11.5" r="1.8" /></svg><span><b>In transit</b> to full-time roles · arriving early 2027</span></p>
                </div>
              </div>
              <h1>Curiosity builds the Path. <em>Ambition drives the Journey.</em></h1>
              <p className="hero-focus">I work on <RotatingWords words={heroFocus} /></p>
              <p className="hero-copy">An engineer, researcher, and community builder connecting healthcare, supply chains, analytics, and the power of persistence.</p>
              <div className="hero-actions">
                <a className="btn btn-gold" href="#journey">Explore my journey</a>
                <ResumePicker className="btn btn-line" />
              </div>
            </div>
            <div className="hero-game"><ShelfLife /></div>
          </div>

          <StatCards stats={heroStats} />
          <p className="hero-hint" aria-hidden="true">Move across the blueprint to light up the lanes · click open space to dispatch a shipment · <a href="#match">hiring? open AETERNUS →</a></p>
          <PulseChain />
        </section>

        {/* 02 — ABOUT */}
        <section id="about" className="chapter light about">
          <ChapterHead n="02" label="About me" title={<>I see connections where others see <em>separate worlds.</em></>} />
          <div className="about-grid">
            <figure className="about-portrait glass spot reveal">
              <img src={asset("/images/aditya-kadlabal-sripad.jpg")} alt="Aditya Kadlabal Sripad in a navy suit and tie" />
              <figcaption>
                <strong>Engineer · Researcher · Analyst</strong>
                <span className="about-portrait-meta"><b>Boston, MA</b><b>From Bengaluru</b></span>
              </figcaption>
            </figure>
            <div className="about-story reveal">
              <p>I grew up in Bengaluru, India, and studied Industrial Engineering and Management there before moving to Boston for graduate school at Northeastern University.</p>
              <p>My work sits where industrial engineering meets people: supply chain analytics, healthcare systems, simulation, and process improvement — with music, sport, and community never far away.</p>
            </div>
            <ol className="credo reveal">
              <li><strong>Engineering</strong> taught me to understand systems.</li>
              <li><strong>Research</strong> taught me to question assumptions.</li>
              <li><strong>Industry</strong> taught me to build for real people.</li>
              <li><strong>Running</strong> taught me to keep going.</li>
            </ol>
            <dl className="glance reveal">
              <div><dt>Based in</dt><dd>Boston, Massachusetts</dd></div>
              <div><dt>From</dt><dd>Bengaluru, India</dd></div>
              <div><dt>Studying</dt><dd>M.S. Engineering Management · GPA 3.71</dd></div>
              <div><dt>Available</dt><dd>Full-time roles from early 2027</dd></div>
            </dl>
          </div>
        </section>

        {/* 03 — JOURNEY */}
        <section id="journey" className="chapter dark journey">
          <ChapterHead n="03" label="My journey" title={<>Every chapter <em>connects.</em></>} lede="From engineering classrooms in Bengaluru to healthcare research in Boston and industry in Minnesota." />
          <Journey />
        </section>

        {/* 04 — EXPERIENCE */}
        <section id="experience" className="chapter light experience">
          <ChapterHead n="04" label="Professional experience" title={<>From analysis <em>to action.</em></>} />

          <article className="feature-role reveal">
            <div className="role-meta">
              <p className="role-when">January — August 2026</p>
              <h3>Vaxxinova US</h3>
              <p className="role-title">Data Analyst Co-op</p>
              <p>Willmar, Minnesota</p>
              <p className="role-sector">Animal health · Veterinary vaccines<br />Autogenous Poultry business</p>
            </div>
            <div className="role-body">
              <p className="role-lead">Architected <strong>Project MERCURY</strong>, a Python/Dash <em>decision-assist</em> dashboard for a portfolio of 22 vaccine customer accounts.</p>
              <dl className="role-stats">
                {vaxxinova.highlights.map((h) => <div key={h.label}><dt>{h.value}</dt><dd>{h.label}</dd></div>)}
              </dl>
              <ul className="role-bullets">{vaxxinova.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              <p className="capabilities-label">What MERCURY brought together</p>
              <ul className="capabilities">{mercuryCapabilities.map((c, i) => <li key={c}><span>{String(i + 1).padStart(2, "0")}</span>{c}</li>)}</ul>
              <ul className="chips">{vaxxinova.tools.map((t) => <li key={t}>{t}</li>)}</ul>
              <p className="confidential">MERCURY is proprietary. This is a public, résumé-level description — no internal code, data, logic, or screenshots are shown. The demo below runs on synthetic data.</p>
            </div>
          </article>

          <div id="mercury-demo" className="reveal"><MercuryDemo /></div>

          <ol className="roles">
            {otherRoles.map((r) => (
              <li key={r.org} className="reveal">
                <span className="roles-year">{r.year}</span>
                <div className="roles-head"><h3>{r.org}</h3><p>{r.role}</p></div>
                <div className="roles-body"><ul className="role-bullets">{r.bullets.map((b) => <li key={b}>{b}</li>)}</ul><ul className="chips">{r.tags.map((t) => <li key={t}>{t}</li>)}</ul></div>
              </li>
            ))}
          </ol>
        </section>

        {/* 05 — PROJECTS */}
        <section id="work" className="chapter dark work">
          <ChapterHead n="05" label="Selected projects" title={<>Problems worth <em>solving.</em></>} lede="Choose a project to see its context, my role, and the methods behind it." />
          <div className="reveal"><ProjectShowcase /></div>
        </section>

        {/* 06 — RESEARCH */}
        <section id="research" className="chapter light research">
          <ChapterHead n="06" label="Research & publications" title={<>What happens when <em>every unit matters?</em></>} />
          <div className="research-grid">
            <div className="paper reveal">
              <p className="paper-venue">{paper.venue} · {paper.status}</p>
              <h3>{paper.title}</h3>
              <p className="paper-authors">{paper.authors}</p>
              <p>Blood is perishable and life-critical. This research studies how a multi-echelon blood supply chain performs — and how hospital inventory decisions and inter-hospital transshipment change the balance between wastage and demand satisfaction.</p>
              <p className="paper-method"><strong>Method.</strong> {paper.method}</p>
              <ol className="paper-findings">{paper.findings.map((f, i) => <li key={f}><span>{String(i + 1).padStart(2, "0")}</span>{f}</li>)}</ol>
              <ul className="chips">{paper.topics.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div className="reveal"><BloodNetwork /></div>
          </div>
        </section>

        {/* 07 — THE LAB */}
        <section id="lab" className="chapter dark lab">
          <ChapterHead n="07" label="The Lab" title={<>Don’t just read about it. <em>Play with it.</em></>} lede="Hands-on experiments drawn from my work in routing, healthcare operations, blood supply chains, and running. Every number here is simulated." />
          <Lab />
        </section>

        {/* 08 — AGILEFLOWSPRINTER */}
        <section id="running" className="chapter light running">
          <ChapterHead n="08" label="AgileFlowSprinter" title={<>Move together. <em>Grow together.</em></>} lede="A running and wellness community I founded — built on consistency, resilience, and the belief that every step counts." />
          <div className="afs-grid">
            <figure className="afs-photo reveal">
              <Zoomable src={asset("/images/sprint-sync-2024-group.jpg")} alt="AgileFlowSprinter runners together after the first Sprint Sync Marathon in Bengaluru" caption="The first Sprint Sync Marathon · 21 January 2024 · Ullal Lake, Bengaluru" />
              <figcaption><span>Where it began</span>The first Sprint Sync Marathon</figcaption>
            </figure>
            <div className="afs-side reveal">
              <div className="afs-logo"><img src={asset("/images/afs-logo-mark.png")} alt="AgileFlowSprinter winged emblem" /></div>
              <p className="afs-mission">Inspiring people to embrace running as a lifestyle — combining energy and momentum with discipline, resilience, and self-transformation.</p>
              <ul className="afs-list">
                <li>Weekly group runs for all levels</li>
                <li>Mindfulness and stress-release sessions</li>
                <li>Challenges and milestones to track progress</li>
                <li>The annual Sprint Sync Marathon</li>
              </ul>
            </div>
          </div>
          <div className="afs-posters">
            <div className="afs-event reveal">
              <span>21 January 2024 · Ullal Lake, Bengaluru</span>
              <strong>Sprint Sync Marathon</strong>
              <ul className="afs-distances" aria-label="Race distances"><li>5K</li><li>10K</li><li>21K</li></ul>
              <p>An early milestone for the community. The spirit continued at Northeastern and through a running group started with colleagues at Vaxxinova.</p>
            </div>
            <figure className="afs-poster reveal">
              <Zoomable src={asset("/images/sprint-sync-2024-poster.jpg")} alt="Sprint Sync Marathon poster: 21 January 2024, Ullal Lake, Bengaluru — 5K, 10K, 21K" caption="The original Sprint Sync Marathon poster · 2024" />
              <figcaption><span>2024</span>The first race poster</figcaption>
            </figure>
            <figure className="afs-poster reveal">
              <Zoomable src={asset("/images/agileflowsprinter-poster.jpg")} alt="AgileFlowSprinter poster with mission, vision, activities and events" caption="AgileFlowSprinter today — mission, vision, activities and events" />
              <figcaption><span>Today</span>Mission &amp; vision</figcaption>
            </figure>
          </div>
          <blockquote className="afs-quote reveal">“Success is a marathon, not a sprint — driven by ambition, guided by discipline, powered by persistence, and sustained by patience.”</blockquote>
        </section>

        {/* 09 — LEADERSHIP */}
        <section id="community" className="chapter dark community">
          <ChapterHead n="09" label="Leadership & community" title={<>Making room <em>for others.</em></>} lede="Progress means more when it creates opportunities for other people." />
          <ol className="community-list">
            {community.map((c) => (
              <li key={c.title + c.role} className="reveal">
                <span className="cl-when">{c.when}</span>
                <h3>{c.title}</h3>
                <p className="cl-role">{c.role}</p>
                <p>{c.body}</p>
                {c.link && <a className="text-link" href={c.link} target="_blank" rel="noreferrer">Visit the chapter ↗</a>}
              </li>
            ))}
          </ol>
        </section>

        {/* 10 — LIFE BEYOND ENGINEERING */}
        <section id="beyond" className="chapter light beyond">
          <ChapterHead n="10" label="Life beyond engineering" title={<>A life <em>in motion.</em></>} />
          <ol className="interests">
            <li className="reveal"><span>01</span><strong>The journey</strong><p>Winter in Boston, a long way from Bengaluru. New horizons.</p></li>
            <li className="reveal"><span>02</span><strong>Outside</strong><p>Trails, travel, and endurance sport.</p></li>
            <li className="reveal"><span>03</span><strong>The arts</strong><p>Music and creative expression.</p></li>
            <li className="reveal"><span>04</span><strong>Every chapter</strong><p><em>Keep building.</em></p></li>
          </ol>
        </section>

        {/* 11 — RECOMMENDATIONS */}
        <section id="recommendations" className="chapter dark recommendations">
          <ChapterHead n="11" label="Recommendations" title={<>Seen through <em>other eyes.</em></>} />
          <Recommendations />
        </section>

        {/* 12 — TOOLKIT */}
        <section id="toolkit" className="chapter light toolkit">
          <ChapterHead n="12" label="Toolkit & certifications" title={<>The tools <em>behind the work.</em></>} lede="Pick a skill to see exactly where I’ve used it." />
          <div className="reveal"><Toolkit /></div>
        </section>

        {/* 13 — CONTACT */}
        <section id="contact" className="chapter dark contact">
          <div className="contact-backdrop" aria-hidden="true"><LivingCanvas mode="sphere" /></div>
          <p className="chapter-label reveal"><span>13</span>The next chapter</p>
          <h2 className="contact-title reveal">Let’s build <em>what’s next.</em></h2>
          <p className="lede reveal">Exploring full-time opportunities in healthcare, life sciences, supply chain, and analytics beginning in early 2027.</p>
          <div className="contact-actions reveal">
            <ContactLauncher className="btn btn-gold">Start a conversation</ContactLauncher>
            <a className="btn btn-line" href={person.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
          </div>
          <dl className="contact-emails reveal">
            <div><dt>Personal</dt><dd><a href={`mailto:${person.email}`}>{person.email}</a></dd></div>
            <div><dt>Northeastern</dt><dd><a href={`mailto:${person.collegeEmail}`}>{person.collegeEmail}</a></dd></div>
          </dl>
          <footer className="footer">
            <span>© 2026 {person.fullName}</span>
            <span>Bengaluru — Boston — Beyond</span>
            <a href="#top">Back to top ↑</a>
          </footer>
        </section>
      </main>
    </>
  );
}

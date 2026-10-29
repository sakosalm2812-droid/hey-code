import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Command, Cpu, Film, Hammer, Mic2, Orbit, Search, ShieldCheck, Sparkles, WandSparkles, Workflow, Zap } from "lucide-react";
import { HEY_V1_AGENT_COUNT } from "../../agents/v1AgentCatalog.js";
import { HEY_V1_NUMBERED_CAPABILITY_COUNT, heyV1CapabilitySections, searchHeyV1Capabilities, heyV1ExtraCapabilities } from "../core/v1CapabilityManifest.js";
import { getInfinityFeatures } from "../core/infinity/infinityRuntime.js";
import styles from "./Features.module.css";

const pillars = [
  { icon: Mic2, title: "Chat + Voice", text: "One continuous conversation surface with voice, text, context, widgets and actions." },
  { icon: Brain, title: "Cosmos", text: "Long-term memory, provenance, projects, relationships and a visual second brain." },
  { icon: Hammer, title: "Forge", text: "Agents, workflows, skills, commands, automations, capability packs and safe expansion." },
  { icon: Cpu, title: "Computer Control", text: "Permission-gated desktop, browser, file, clipboard and native device actions." },
  { icon: Orbit, title: "Live + Dynamic Island", text: "Persistent compact presence, background work, handoffs, progress, approvals and recovery." },
  { icon: Workflow, title: "Missions + Automations", text: "Long-running outcomes, scheduled routines, shadow mode, checkpoints and approvals." },
  { icon: Film, title: "Media Studio", text: "Upload video, audio or images, describe the edit, and render validated transformations." },
  { icon: ShieldCheck, title: "Trust by design", text: "Quality gates, truthful capability health, budgets, audit history and reversible actions." },
  { icon: WandSparkles, title: "Adaptive expansion", text: "Forge low-risk missing capability candidates without silently granting new permissions." },
];

export default function Features() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const infinity = useMemo(() => getInfinityFeatures(), []);
  const matches = useMemo(() => searchHeyV1Capabilities(query, section), [query, section]);
  const visible = showAll ? matches : matches.slice(0, 36);
  return <main className={styles.page}>
    <section className={styles.hero}>
      <motion.div className={styles.eyebrow} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>HEY آ· V1 Capability Atlas</motion.div>
      <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}>One intelligence.<span> A whole operating layer around you.</span></motion.h1>
      <p>The product surface now follows the V1 capability map and the Infinity systems layer rather than a small placeholder feature list. Real availability still depends on the platform, provider, permission and device adapter.</p>
      <div className={styles.metrics}><div><strong>{HEY_V1_AGENT_COUNT}</strong><span>built-in agent roles</span></div><div><strong>{HEY_V1_NUMBERED_CAPABILITY_COUNT}</strong><span>numbered V1 capabilities</span></div><div><strong>{infinity.length}</strong><span>system-level Infinity capabilities</span></div><div><strong>{heyV1ExtraCapabilities.length}+</strong><span>additional system capabilities</span></div></div>
    </section>
    <section className={styles.pillars}>{pillars.map(({ icon: Icon, title, text }, index) => <motion.article key={title} className={styles.pillar} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: index * .035 }} whileHover={{ y: -5 }}><div className={styles.pillarIcon}><Icon size={20}/></div><h2>{title}</h2><p>{text}</p></motion.article>)}</section>
    <section className={styles.infinity}><div className={styles.infinityHead}><div><div className={styles.eyebrow}>Infinity layer</div><h2>Systems that make every feature better.</h2></div><Sparkles size={26}/></div><div className={styles.infinityGrid}>{infinity.map((feature) => <article key={feature.id}><span>{feature.category}</span><h3>{feature.title}</h3><p>{feature.summary}</p></article>)}</div></section>
    <section className={styles.atlas}><div className={styles.atlasHeader}><div><div className={styles.eyebrow}>Explore everything</div><h2>Capability Atlas</h2><p>Search the canonical V1 map by feature, number or system.</p></div><div className={styles.searchBox}><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search HEY capabilitiesâ€¦" aria-label="Search HEY capabilities"/></div></div>
      <div className={styles.filters}><button className={section === "all" ? styles.filterActive : ""} onClick={() => setSection("all")}>All</button>{heyV1CapabilitySections.map((item) => <button key={item} className={section === item ? styles.filterActive : ""} onClick={() => setSection(item)}>{item}</button>)}</div>
      <div className={styles.resultMeta}><span>{matches.length} matches</span><span><Zap size={14}/> Capability gaps are surfaced honestly and can route into safe Forge expansion.</span></div>
      <div className={styles.capabilityGrid}>{visible.map((item) => <article key={item.id} className={styles.capabilityCard}><span className={styles.number}>{String(item.id).padStart(4, "0")}</span><div><h3>{item.name}</h3><p>{item.section}</p></div></article>)}</div>
      {matches.length > 36 && <button className={styles.more} onClick={() => setShowAll((value) => !value)}>{showAll ? "Show less" : `Show all ${matches.length}`}</button>}
    </section>
    <section className={styles.expansion}><div><Sparkles size={22}/><div><h2>Power without pretending.</h2><p>HEY can route, compose and expand capabilities, but privileged changes such as auth, billing, secrets, permissions or production deployment remain explicitly controlled and auditable.</p></div></div><Command size={30}/></section>
  </main>;
}


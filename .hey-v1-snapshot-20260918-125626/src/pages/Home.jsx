import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Brain, Clapperboard, Command, Layers3, Mic2, Orbit, ShieldCheck, Sparkles, Target, WandSparkles } from "lucide-react";
import PWAInstallButton from "../components/PWAInstallButton.jsx";
import styles from "./HomeInfinity.module.css";

const capabilities = [
  { icon: Target, title: "Delegate outcomes", body: "Give HEY a mission. Agents plan, work, verify and surface approvals instead of making you micromanage every step." },
  { icon: Clapperboard, title: "Edit what you give it", body: "Drop video, audio or images into Media Studio and describe the result you want in normal language." },
  { icon: Brain, title: "Context with boundaries", body: "Project memory, context packs, provenance and privacy routing keep useful context close without sending everything everywhere." },
  { icon: Command, title: "One action layer", body: "Search HEY, transform anything, create tasks, research a selection or send work into a project from one command surface." },
  { icon: Layers3, title: "A world that adapts", body: "Change the background, glass, density, widgets, motion, navigation and Dynamic Island—or use your own local wallpaper." },
  { icon: ShieldCheck, title: "Trust you can inspect", body: "Capability health, quality gates, action history, budgets and approvals keep powerful automation understandable." },
];

export default function Home() {
  return <div className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.copy}><span className={styles.eyebrow}><i /> HEY · Personal Intelligence System</span><h1>Not another chatbot.<br/><em>Your operating layer for life and work.</em></h1><p>Talk. Create. Research. Edit media. Run missions. Control your workspace. Keep context. Build new capabilities. HEY brings it together without making the interface feel like a control room.</p><div className={styles.actions}><Link className={styles.primary} to="/login">Enter HEY <ArrowRight size={16}/></Link><PWAInstallButton /></div><div className={styles.subActions}><Link to="/features">Explore the system <ArrowUpRight size={14}/></Link><span>229 specialist roles · PWA + native desktop</span></div></div>
      <div className={styles.preview}>
        <div className={styles.previewTop}><span><Orbit size={14}/> LIVE MISSION</span><small>42% · working quietly</small></div><h2>Prepare the strongest launch for HEY.</h2><div className={styles.steps}><span className={styles.done}>Research landscape</span><span className={styles.done}>Audit experience</span><span className={styles.active}>Build release package</span><span>Verify every output</span></div><div className={styles.progress}><i /></div><div className={styles.miniGrid}><article><Mic2/><strong>Voice</strong><small>Listening when invited</small></article><article><WandSparkles/><strong>Media</strong><small>Edit by instruction</small></article><article><Sparkles/><strong>Forge</strong><small>Build missing capability</small></article></div>
      </div>
    </section>
    <section className={styles.ribbon}><span>Chat + Voice</span><span>Cosmos</span><span>Forge</span><span>Media Studio</span><span>Missions</span><span>Dynamic Island</span><span>Universal Actions</span><span>World Studio</span></section>
    <section className={styles.section}><div className={styles.sectionHead}><span>CORE EXPERIENCE</span><h2>Powerful enough to disappear into the work.</h2><p>HEY is designed around outcomes, context and actions—not a pile of disconnected AI tools.</p></div><div className={styles.grid}>{capabilities.map(({ icon: Icon, title, body }) => <article key={title}><Icon size={21}/><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className={styles.world}><div><span>WORLD STUDIO</span><h2>Your HEY does not have to look like anyone else’s.</h2><p>Use curated worlds or your own image. Tune glass, typography, density, motion, widgets, navigation and the Island while the entire interface updates live.</p><Link to="/customization">See customization <ArrowUpRight size={15}/></Link></div><div className={styles.worldCards}><article/><article/><article/></div></section>
    <section className={styles.final}><span>Think · Create · Do · Together</span><h2>Start with a conversation.<br/>End with the thing actually finished.</h2><div><Link className={styles.primary} to="/signup">Start with HEY <ArrowRight size={16}/></Link><Link className={styles.secondary} to="/download">Download options</Link></div></section>
  </div>;
}

import { useMemo, useState } from "react";
import { useLocation } from 'react-router-dom';
import { motion } from "framer-motion";
import { Bot, Search, Sparkles, Workflow, ShieldCheck, Hammer } from "lucide-react";
import { HEY_V1_AGENT_COUNT, heyV1AgentCatalog } from "../agents/v1AgentCatalog.js";
import { getAllAgents, getCustomAgents } from "../agents/agents.js";
import { ensureCapabilityAgent } from "./core/capabilityExpansionEngine.js";
import styles from "./pages/AgentsV1.module.css";

export default function AgentsPage() {
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.search || "");
  const [category, setCategory] = useState("all");
  const [forgeRequest, setForgeRequest] = useState("");
  const [forgeResult, setForgeResult] = useState(null);

  const categories = useMemo(
    () => ["all", ...new Set(heyV1AgentCatalog.map((agent) => agent.category))],
    [],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heyV1AgentCatalog.filter((agent) => {
      const categoryOk = category === "all" || agent.category === category;
      if (!categoryOk) return false;
      if (!q) return true;
      return [agent.name, agent.category, agent.description, ...(agent.capabilities || [])]
        .join(" ").toLowerCase().includes(q);
    });
  }, [query, category]);

  const runtimeCount = getAllAgents().length;
  const customCount = getCustomAgents().length;

  function autoForge() {
    if (!forgeRequest.trim()) return;
    setForgeResult(ensureCapabilityAgent(forgeRequest.trim()));
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.eyebrow}>HEY Intelligence Network</div>
        <h1>{HEY_V1_AGENT_COUNT} specialists.<span> One brain.</span></h1>
        <p>
          The V1 workforce is a role catalog, not 229 independent chatbots. HEY orchestrates
          the smallest useful team and keeps permissions at the execution layer.
        </p>

        <div className={styles.metrics}>
          <div><Bot size={18}/><strong>{HEY_V1_AGENT_COUNT}</strong><span>V1 roles</span></div>
          <div><Workflow size={18}/><strong>{runtimeCount}</strong><span>runtime definitions</span></div>
          <div><Hammer size={18}/><strong>{customCount}</strong><span>forged specialists</span></div>
          <div><ShieldCheck size={18}/><strong>Fail-closed</strong><span>permission model</span></div>
        </div>
      </section>

      <section className={styles.controls}>
        <div className={styles.search}><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search 229 specialists…"/></div>
        <div className={styles.chips}>
          {categories.map((item)=>(
            <button key={item} onClick={()=>setCategory(item)} className={category===item?styles.active:""}>
              {item === "all" ? "All roles" : item}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        {visible.map((agent)=>(
          <motion.article key={agent.specId} className={styles.card} whileHover={{y:-4}}>
            <div className={styles.cardTop}>
              <span className={styles.spec}>#{agent.specId}</span>
              <Bot size={18}/>
            </div>
            <h2>{agent.name}</h2>
            <p>{agent.category}</p>
            <div className={styles.cap}>{agent.capabilities[0]}</div>
          </motion.article>
        ))}
      </section>

      <section className={styles.forge}>
        <div>
          <Sparkles size={22}/>
          <h2>Adaptive Forge</h2>
          <p>Describe a missing low-risk specialty. HEY can add a constrained specialist definition without granting itself new tools or permissions.</p>
        </div>
        <div className={styles.forgeInput}>
          <input value={forgeRequest} onChange={(e)=>setForgeRequest(e.target.value)} placeholder="e.g. compare accessibility regressions across releases"/>
          <button onClick={autoForge}>Forge if missing</button>
        </div>
        {forgeResult && <pre>{JSON.stringify(forgeResult, null, 2)}</pre>}
      </section>
    </main>
  );
}

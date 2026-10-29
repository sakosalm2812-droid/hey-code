import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Sparkles, X } from "lucide-react";
import { getUniversalActions, runUniversalAction, searchEverything } from "../core/infinity/infinityRuntime.js";
import { useNavigate } from 'react-router-dom';
import { HEY_PAGES, resolvePageCommand } from '../core/navigationCatalog.js';
import { useAuth } from '../AuthContext.jsx';
import { listRecords } from '../lib/heyRecords.js';

export default function UniversalActionPalette() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const key = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); }
      if (event.key === "Escape") setOpen(false);
    };
    const custom = () => setOpen(true);
    const inbox = () => navigate('/inbox');
    window.addEventListener('hey:open-inbox', inbox);
    window.addEventListener("keydown", key);
    window.addEventListener("hey:open-universal-actions", custom);
    return () => { window.removeEventListener('hey:open-inbox', inbox); window.removeEventListener("keydown", key); window.removeEventListener("hey:open-universal-actions", custom); };
  }, [navigate]);
  useEffect(() => {
    let active = true;
    setProjects([]);
    if (open && user?.id) listRecords(user.id, 'project').then(items => { if (active) setProjects(items); }).catch(() => { if (active) setMessage('Projects could not load. Other destinations are still available.'); });
    return () => { active = false; };
  }, [open, user?.id]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    return () => previous?.focus?.();
  }, [open]);

  const actions = useMemo(() => getUniversalActions({ type: "page" }).filter((item) => !query || `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const results = useMemo(() => {
    if (!query.trim()) return HEY_PAGES;
    const page = resolvePageCommand(query);
    const found = projects.filter(item => `${item.title} ${item.content || ''}`.toLowerCase().includes(query.toLowerCase())).map(item => ({ ...item, type: 'project', path: '/projects' }));
    return [...(page ? [page] : []), ...found, ...searchEverything(query)].filter((item, index, all) => all.findIndex(other => other.type === item.type && other.id === item.id) === index).slice(0, 40);
  }, [query, projects]);
  function go(item) { navigate(item.path, { state: { search: item.type === 'agent' ? item.title : query, selectedId: item.id } }); setOpen(false); }
  function trapFocus(event) {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  async function run(id) {
    setBusy(id); setMessage("");
    const result = await runUniversalAction(id, { type: "page", url: location.href, title: document.title }, { instruction: query });
    setBusy("");
    if (result.ok && result.result?.path) { navigate(result.result.path, { state: { draft: result.result.draft } }); setOpen(false); }
    else setMessage(result.ok ? "Request saved; execution has not started." : result.error || "Could not run action.");
  }

  return <AnimatePresence>{open && <motion.div className="hey-universal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
    <motion.section className="hey-universal-palette" initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: .97 }} onKeyDown={trapFocus} role="dialog" aria-modal="true" aria-label="Universal HEY actions">
      <header><span><Sparkles size={16} /> Do anything with HEY</span><button onClick={() => setOpen(false)} aria-label="Close"><X size={17} /></button></header>
      <label className="hey-universal-search"><Search size={17} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search HEY" onKeyDown={(event) => { if (event.key === "Enter" && results[0]) go(results[0]); }} placeholder="Pages, agents, projects, missions and actions" /></label>
      <div className="hey-universal-grid">{actions.map((action) => <button key={action.id} onClick={() => run(action.id)} disabled={Boolean(busy)}><strong>{busy === action.id ? "Working…" : action.label}</strong><small>{action.description}</small></button>)}</div>
      {results.length > 0 && <div className="hey-universal-results"><span>Across HEY</span>{results.map((item) => <button key={`${item.type}:${item.id}`} onClick={() => go(item)}><b>{item.title}</b><small>{item.type}</small></button>)}</div>}
      <footer>{message || "⌘/Ctrl + Shift + K · Universal Actions"}</footer>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

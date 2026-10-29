import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { subscribeInbox } from '../core/infinity/inboxEngine.js';
import { subscribeActionTimeline } from '../core/infinity/actionTimeline.js';
import { subscribeCapabilityHealth } from '../core/infinity/capabilityHealth.js';
import UndoReconciliation from '../components/UndoReconciliation.jsx';
import { Activity, Archive, Check, Inbox, RotateCcw, ShieldCheck } from "lucide-react";
import { clearInboxItem, getActionTimeline, getCapabilityHealthSnapshot, getInboxItems, markInboxItem, undoAction } from "../core/infinity/infinityRuntime.js";
import styles from "./InboxPage.module.css";

export default function InboxPage() {
  const [items, setItems] = useState(getInboxItems);
  useEffect(() => subscribeInbox(setItems), []);
  const [actions, setActions] = useState(() => getActionTimeline().slice(0, 30));
  const [health, setHealth] = useState(getCapabilityHealthSnapshot);
  const [error, setError] = useState('');
  useEffect(() => subscribeActionTimeline(items => setActions(items.slice(0, 30))), []);
  useEffect(() => subscribeCapabilityHealth(() => setHealth(getCapabilityHealthSnapshot())), []);
  const refresh = () => { setItems(getInboxItems()); setActions(getActionTimeline().slice(0, 30)); };
  async function undo(id) { const result = await undoAction(id); setError(result.ok ? '' : result.error); refresh(); }
  function changeItem(action) { try { action(); refresh(); setError(''); } catch (failure) { setError(failure.message); } }
  return <main className={styles.page}>
    {error && <p role="alert">{error}</p>}
    <header className={styles.hero}><span><Inbox size={15} /> HEY Inbox</span><h1>Everything that deserves your attention. Nothing that doesn’t.</h1><p>Approvals, mission results, proactive suggestions, capability problems and a reversible action history.</p></header>
    <div className={styles.columns}><section className={styles.panel}><div className={styles.panelHead}><h2>Inbox</h2><span>{items.filter((i) => i.status === "unread").length} unread</span></div>{items.length ? items.map((item) => <article key={item.id} className={item.status === "unread" ? styles.unread : ""}><div><small>{item.category} · importance {item.importance}</small><h3>{item.title}</h3><p>{item.body}</p>{item.path && <Link to={item.path}>Open</Link>}</div><div><button aria-label="Mark as read" onClick={() => changeItem(() => markInboxItem(item.id, "read"))}><Check size={14} /></button><button aria-label="Archive update" onClick={() => changeItem(() => clearInboxItem(item.id))}><Archive size={14} /></button></div></article>) : <p className={styles.empty}>Inbox zero. HEY will route quiet suggestions here instead of interrupting you.</p>}</section>
      <section className={styles.panel}><div className={styles.panelHead}><h2>Action timeline</h2><span>{actions.length} recent</span></div>{actions.length ? actions.map((action) => <article key={action.id}><div><small>{action.category} · {action.status}</small><h3>{action.title}</h3><p>{action.summary}</p></div><UndoReconciliation action={action} />{action.reversible && !action.undoneAt && !["undoing", "undo-uncertain"].includes(action.status) && <button onClick={() => undo(action.id)}><RotateCcw size={14} /> Undo</button>}</article>) : <p className={styles.empty}>Actions HEY performs will appear here.</p>}</section></div>
    <section className={styles.health}><div className={styles.panelHead}><h2>Capability health</h2><span><ShieldCheck size={14} /> Truthful status</span></div><div>{health.length ? health.map((item) => <article key={item.id}><Activity size={15} /><span><b>{item.id}</b><small>{item.detail || item.state}</small></span><em data-state={item.state}>{item.state}</em></article>) : <p className={styles.empty}>Capability probes will populate this surface as HEY checks providers and integrations.</p>}</div></section>
  </main>;
}

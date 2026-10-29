import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { subscribeInbox } from '../core/infinity/inboxEngine.js';
import { Activity, Archive, Check, Inbox, RotateCcw, ShieldCheck } from "lucide-react";
import { clearInboxItem, getActionTimeline, getCapabilityHealthSnapshot, getInboxItems, markInboxItem, undoAction } from "../core/infinity/infinityRuntime.js";
import styles from "./InboxPage.module.css";

export default function InboxPage() {
  const [items, setItems] = useState(getInboxItems);
  useEffect(() => subscribeInbox(setItems), []);
  const [actions, setActions] = useState(() => getActionTimeline().slice(0, 30));
  const health = getCapabilityHealthSnapshot();
  const refresh = () => { setItems(getInboxItems()); setActions(getActionTimeline().slice(0, 30)); };
  async function undo(id) { await undoAction(id); refresh(); }
  return <main className={styles.page}>
    <header className={styles.hero}><span><Inbox size={15} /> HEY Inbox</span><h1>Everything that deserves your attention. Nothing that doesn’t.</h1><p>Approvals, mission results, proactive suggestions, capability problems and a reversible action history.</p></header>
    <div className={styles.columns}><section className={styles.panel}><div className={styles.panelHead}><h2>Inbox</h2><span>{items.filter((i) => i.status === "unread").length} unread</span></div>{items.length ? items.map((item) => <article key={item.id} className={item.status === "unread" ? styles.unread : ""}><div><small>{item.category} · importance {item.importance}</small><h3>{item.title}</h3><p>{item.body}</p>{item.path && <Link to={item.path}>Open</Link>}</div><div><button aria-label="Mark as read" onClick={() => { markInboxItem(item.id, "read"); refresh(); }}><Check size={14} /></button><button aria-label="Archive update" onClick={() => { clearInboxItem(item.id); refresh(); }}><Archive size={14} /></button></div></article>) : <p className={styles.empty}>Inbox zero. HEY will route quiet suggestions here instead of interrupting you.</p>}</section>
      <section className={styles.panel}><div className={styles.panelHead}><h2>Action timeline</h2><span>{actions.length} recent</span></div>{actions.length ? actions.map((action) => <article key={action.id}><div><small>{action.category} · {action.status}</small><h3>{action.title}</h3><p>{action.summary}</p></div>{action.reversible && !action.undoneAt && <button onClick={() => undo(action.id)}><RotateCcw size={14} /> Undo</button>}</article>) : <p className={styles.empty}>Actions HEY performs will appear here.</p>}</section></div>
    <section className={styles.health}><div className={styles.panelHead}><h2>Capability health</h2><span><ShieldCheck size={14} /> Truthful status</span></div><div>{health.length ? health.map((item) => <article key={item.id}><Activity size={15} /><span><b>{item.id}</b><small>{item.detail || item.state}</small></span><em data-state={item.state}>{item.state}</em></article>) : <p className={styles.empty}>Capability probes will populate this surface as HEY checks providers and integrations.</p>}</div></section>
  </main>;
}

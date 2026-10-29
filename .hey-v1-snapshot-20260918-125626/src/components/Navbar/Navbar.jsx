import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Download, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AppearanceControl from "../Theme/AppearanceControl.jsx";
import PWAInstallButton from "../PWAInstallButton.jsx";
import styles from "./Navbar.module.css";

const links = [
  { name: "Product", path: "/features" }, { name: "Live", path: "/live" }, { name: "Create", path: "/create" }, { name: "Pricing", path: "/pricing" }, { name: "Download", path: "/download" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  useEffect(() => { if (!menuOpen) return; const close = (event) => { if (event.key === "Escape") setMenuOpen(false); }; const outside = (event) => { if (!navRef.current?.contains(event.target)) setMenuOpen(false); }; window.addEventListener("keydown", close); window.addEventListener("pointerdown", outside); return () => { window.removeEventListener("keydown", close); window.removeEventListener("pointerdown", outside); }; }, [menuOpen]);
  return <header ref={navRef} className={styles.wrapper}><div className={styles.navbar}>
    <NavLink to="/" className={styles.logo} aria-label="HEY home"><span className={styles.mark}>H</span><span className={styles.wordmark}>HEY</span><small>Core Experience</small></NavLink>
    <nav className={styles.links}>{links.map((link) => <NavLink key={link.path} to={link.path} className={({ isActive }) => isActive ? styles.active : styles.link}>{link.name}</NavLink>)}</nav>
    <div className={styles.action}><span className={styles.live}><i/> System online</span><AppearanceControl/><motion.button className={styles.cta} onClick={() => navigate("/login")} whileTap={{ scale: .97 }}>Enter HEY <ArrowUpRight size={14}/></motion.button></div>
    <button className={styles.menuButton} onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>{menuOpen ? <X size={18}/> : <Menu size={18}/>}</button>
  </div><AnimatePresence>{menuOpen && <motion.div className={styles.mobileMenu} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><div className={styles.mobileBrand}><Sparkles size={15}/> Your HEY, everywhere</div><nav>{links.map((link) => <NavLink key={link.path} to={link.path} onClick={() => setMenuOpen(false)}>{link.name}</NavLink>)}</nav><AppearanceControl/><PWAInstallButton/><button className={styles.mobileCta} onClick={() => navigate("/login")}>Enter HEY <ArrowUpRight size={14}/></button><button className={styles.mobileDownload} onClick={() => navigate("/download")}><Download size={14}/> Other downloads</button></motion.div>}</AnimatePresence></header>;
}

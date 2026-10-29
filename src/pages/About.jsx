import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function About() {
  return (
    <main className="hey-legal-page hey-about-page">
      <header>
        <p className="hey-state-kicker">About HEY</p>
        <h1>A second brain for thinking, creating, remembering — and moving forward.</h1>
      </header>

      <div className="hey-legal-content">
        <section>
          <h2>What HEY is</h2>
          <p>HEY is a personal intelligence system: a workspace that brings chat, voice, memory, records, projects, and creation into one calm layer around your life. It is designed for outcomes — give it work in plain language and it helps you plan, research, create, and keep the context instead of leaving you to juggle disconnected AI tools.</p>
        </section>

        <section>
          <h2>What HEY is not</h2>
          <p>HEY does not claim to be a certified, regulated, or autonomous service. AI output can be inaccurate, incomplete, or unavailable, and HEY is honest about which capabilities are configured and which are not. No ads, no cross-site tracking, and no selling your data.</p>
        </section>

        <section>
          <h2>Principles</h2>
          <ul>
            <li>Your data is border-controlled: account-backed data lives under your sign-in, and you can export or delete it yourself.</li>
            <li>Trust you can inspect: capability health, action history, budgets and approvals keep powerful automation understandable.</li>
            <li>One action layer: search, transform, create tasks, research a selection, or send work into a project from one command surface.</li>
          </ul>
        </section>

        <section>
          <h2>Where you can run it</h2>
          <p>HEY runs in the browser as a PWA and ships as a native desktop application (built with Tauri) for the platforms listed on the Download page — with a shared experience and the same account data.</p>
        </section>

        <section>
          <h2>Built to be extended</h2>
          <p>HEY is intentionally modular. Its capabilities — from missions and media editing to world customization — live behind inspectable registries, and the system can build missing capability rather than pretending it exists.</p>
        </section>

        <section>
          <h2>Legal and data documents</h2>
          <p>Read how HEY handles data and processing obligations: <Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms of use</Link> · <Link to="/cookies">Cookies</Link> · <Link to="/dpa">Data Processing Agreement</Link>.</p>
        </section>
      </div>

      <nav aria-label="Primary actions">
        <Link to="/signup">Enter HEY <ArrowRight size={15} style={{ verticalAlign: "-2px" }} /></Link>
        <Link to="/features">Explore the system <ArrowUpRight size={14} style={{ verticalAlign: "-2px" }} /></Link>
        <Link to="/download">Download options <ArrowUpRight size={14} style={{ verticalAlign: "-2px" }} /></Link>
      </nav>
    </main>
  );
}
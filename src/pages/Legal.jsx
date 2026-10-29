import { Link } from "react-router-dom";
import {
  privacySections,
  termsSections,
  cookiesSections,
  dpaSections,
  legalUpdatedAt,
} from "../lib/legalDocs.js";

const documents = {
  privacy: { title: "Privacy", sections: privacySections, tagline: "This page describes the product as currently implemented. It does not make claims about an operator, address, jurisdiction, or certification that have not been provided.", links: ["terms", "cookies", "dpa"] },
  terms: { title: "Terms of use", sections: termsSections, tagline: "This page describes the product as currently implemented. It does not make claims about an operator, address, jurisdiction, or certification that have not been provided.", links: ["privacy", "cookies", "dpa"] },
  cookies: { title: "Cookies", sections: cookiesSections, tagline: "This page describes how this site actually uses storage and tracking — which is currently: no advertising, analytics or tracking cookies.", links: ["privacy", "terms", "dpa"] },
  dpa: { title: "Data Processing Agreement", sections: dpaSections, tagline: "A reference template for how account data is processed when HEY runs as the processor. It is a template, not legal advice.", links: ["privacy", "terms", "cookies"] },
};

const documentLinks = {
  privacy: "Privacy",
  terms: "Terms of use",
  cookies: "Cookies",
  dpa: "Data Processing Agreement",
};

export default function LegalPage({ document }) {
  const doc = documents[document] || documents.privacy;

  return (
    <main className="hey-legal-page">
      <header>
        <p className="hey-state-kicker">HEY legal</p>
        <h1>{doc.title}</h1>
        <p>{doc.tagline}</p>
        <p className="hey-legal-updated">Last updated on {legalUpdatedAt}.</p>
      </header>
      <div className="hey-legal-content">
        {doc.sections.map(([heading, body]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            {Array.isArray(body) ? (
              <ul>
                {body.map((line) => <li key={line}>{line}</li>)}
              </ul>
            ) : (
              <p>{body}</p>
            )}
          </section>
        ))}
      </div>
      <nav aria-label="Legal pages">
        {doc.links.map((key) => document === key
          ? <span key={key} aria-current="page">{documentLinks[key]}</span>
          : <Link key={key} to={`/${key}`}>{documentLinks[key]}</Link>)}
        <Link to="/">Home</Link>
      </nav>
    </main>
  );
}
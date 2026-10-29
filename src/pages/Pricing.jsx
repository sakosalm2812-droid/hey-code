import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PLAN_CATALOG, PLAN_ORDER } from "../core/planCatalog.js";
import styles from "./Pricing.module.css";

export default function Pricing() {
  const navigate = useNavigate();
  const plans = PLAN_ORDER.map((id) => PLAN_CATALOG[id]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.eyebrow}>Simple by design</div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          Start free.
          <span> Grow into your full intelligence.</span>
        </motion.h1>
        <p>
          Every plan keeps HEY's core intelligence intact. Paid plans unlock deeper memory,
          larger limits, background work, creation and advanced device capabilities.
        </p>
      </section>

      <section className={styles.plans}>
        {plans.map((plan, index) => (
          <motion.article
            key={plan.id}
            className={`${styles.card} ${plan.popular ? styles.popular : ""}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ y: -7 }}
          >
            {plan.popular && <div className={styles.popularBadge}><Sparkles size={14}/> Best fit</div>}
            <div className={styles.cardTop}>
              <div>
                <h2>{plan.name}</h2>
                <p>{plan.tagline}</p>
              </div>
              {plan.id === "elite" ? <Crown size={22}/> : plan.id === "pro" ? <Zap size={22}/> : null}
            </div>

            <div className={styles.price}>
              <strong>${plan.price}</strong><span>/ month</span>
            </div>

            <ul>
              {plan.highlights.map((feature) => (
                <li key={feature}><Check size={16}/><span>{feature}</span></li>
              ))}
            </ul>

            {plan.id === "free" ? (
              <button onClick={() => navigate("/signup")}>Create free account</button>
            ) : (
              <button className={styles.secondary} onClick={() => navigate("/signup")}>
                Continue with {plan.name}
              </button>
            )}
          </motion.article>
        ))}
      </section>

      <section className={styles.note}>
        Billing checkout remains disabled until the production billing provider and server-side
        entitlement verification are configured. Owner-granted plans use the secure admin service,
        never a hidden client-side email list.
      </section>
    </main>
  );
}

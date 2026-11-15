import { motion } from "framer-motion";
import {
  Sparkles,
  Orbit,
  Brain,
  Hammer,
  Mic,
  ArrowRight,
  Trees,
} from "lucide-react";

import allAgents from "../agents/agents.js";
import PipCanvas from "./components/Pip3D";


const features = [
  {
    title: "The Cosmos",
    text: "A living memory universe where your ideas, knowledge and experiences connect.",
    icon: Orbit,
  },
  {
    title: `${allAgents.length} Agent Definitions`,
    text: "Specialized roles that run only through configured, verified execution providers.",
    icon: Brain,
  },
  {
    title: "The Forge",
    text: "Create your own AI agents and build systems around your life.",
    icon: Hammer,
  },
  {
    title: "HEY Voice",
    text: "A natural AI presence that is always ready when you need it.",
    icon: Mic,
  },
];


const heroGradient =
  "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)";

const accent = "#0f7685";
const accentHover = "#16a094";

export default function LandingPage() {
  return (
    <motion.div
      style={{
        minHeight: "100vh",
        background:
          "var(--bg-primary, #111418)",
        color: "var(--text-primary, #f5f0e8)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <PipCanvas position={[6, -2, -5]} />

      {/* Ambient light */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.5, 0.2],
        }}

        transition={{
          duration: 8,
          repeat: Infinity,
        }}

        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(15,118,133,0.15)",
          filter: "blur(120px)",
          top: -200,
          left: "35%",
        }}
      />

      {/* HERO */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 40,
          position: "relative",
        }}
      >

        <div>
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                color: "var(--accent, #0f7685)",
                letterSpacing: ".3em",
                fontSize: 13,
                marginBottom: 30,
              }}
            >

              <Sparkles size={16} />

              NEXT GENERATION INTELLIGENCE

            </div>

            <h1
              style={{
                marginTop: 0,
                fontSize: "clamp(60px, 9vw, 120px)",
                fontWeight: 400,
                fontFamily: '"Instrument Serif", serif',
                color: "var(--accent, #0f7685)",
                letterSpacing: "-.06em",
              }}
            >

              HEY

            </h1>


            <h2
              style={{
                fontSize: "clamp(30px, 5vw, 60px)",
                fontWeight: 400,
                marginTop: -12,
                color: "var(--text-secondary, rgba(245,240,232,0.7))",
              }}
            >

              Your intelligence.
              <br />
              Your memory.
              <br />
              Your universe.

            </h2>


            <p
              style={{
                maxWidth: 650,
                margin: "30px auto",
                color: "var(--text-muted, rgba(245,240,232,0.48))",
                fontSize: 18,
                lineHeight: 1.8,
              }}
            >

              HEY is a living AI system that learns,
              creates and evolves with you.

              Not just an assistant.
              A personal intelligence ecosystem.

            </p>


            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                marginTop: 35,
              }}
            >

              <button
                style={{
                  all: "unset",
                  padding: "14px 28px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary, #f5f0e8)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.08)";
                  e.target.style.borderColor = "var(--accent, #0f7685)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "rgba(255,255,255,0.06)";
                  e.target.style.borderColor = "var(--border)";
                }}
              >

                Enter HEY
                <ArrowRight size={18} />

              </button>

              <button
                style={{
                  all: "unset",
                  padding: "14px 28px",
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid var(--accent, #0f7685)",
                  color: "var(--accent, #0f7685)",
                  fontWeight: 500,
                  cursor: "pointer",
                  marginLeft: 24,
                  transition: "background 0.2s ease, border-color 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.background = "rgba(15,118,133,0.1)";
                  e.target.style.borderColor = "var(--accent-hover, #16a094)";
                }}
                onMouseOut={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.borderColor = "var(--accent, #0f7685)";
                }}
              >

                Explore Cosmos

              </button>

            </div>

          </motion.div>

        </div>

      </section>

      {/* IDENTITY */}
      <section
        style={{
          padding: "80px 8%",
        }}
      >

        <div
          style={{
            textAlign: "center",
            marginBottom: 60,
          }}
        >

          <Trees
            color="var(--accent, #0f7685)"
          />

          <h2
            style={{
              fontSize: 50,
              fontFamily: '"Instrument Serif", serif',
              color: "var(--accent, #0f7685)",
            }}
          >

            A living digital universe

          </h2>


          <p
            style={{
              color: "var(--text-muted, rgba(245,240,232,0.4))",
            }}
          >

            Where intelligence meets imagination.

          </p>

        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            marginTop: 40,
          }}
        >

          {features.map((item) => {

            const Icon = item.icon;


            return (

              <motion.div
                key={item.title}

                whileHover={{
                  y: -4,
                }}

                style={{
                  padding: 24,
                  borderRadius: 24,
                  background:
                    "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  transition: "background 0.2s ease, border-color 0.2s ease",

                  // hover states
                  ":hover": {
                    background: "rgba(15,118,133,0.05)",
                    borderColor: "var(--accent, #0f7685)",
                  },
                }}
              >

                <Icon
                  color="var(--accent, #0f7685)"
                  size={32}
                />


                <h3
                  style={{
                    marginTop: 16,
                    fontSize: 22,
                    color: "var(--accent, #0f7685)",
                  }}
                >

                  {item.title}


                </h3>


                <p
                  style={{
                    marginTop: 10,
                    color: "var(--text-muted, rgba(245,240,232,0.4))",
                    lineHeight: 1.7,
                  }}
                >

                  {item.text}


                </p>


              </motion.div>

            )
          })}
        </div>

      </section>

      {/* FINAL CTA */}
      <section
        style={{
          padding: "120px 20px",
          textAlign: "center",
        }}

      >

        <h2
          style={{
            fontSize: 60,
            fontFamily: '"Instrument Serif", serif',
            color: "var(--accent, #0f7685)",
          }}
        >

          Enter your universe.

        </h2>


        <button
          style={{
            all: "unset",
            padding: "18px 40px",
            borderRadius: 999,
            background: "var(--accent, #0f7685)",
            color: "var(--on-accent, #f5f0e8)",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
            marginTop: 35,
            transition: "background 0.2s ease, transform 0.1s ease",
            boxShadow: "0 4px 20px rgba(15,118,133,0.3)",

            ":hover": {
              background: "var(--accent-hover, #16a094)",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 30px rgba(15,118,133,0.4)",
            },

            ":focus-visible": {
              outline: "2px solid var(--focus-ring, #0f7685)",
              outlineOffset: 3,
            },
          }}
        >

          Start with HEY
          <ArrowRight size={20} />


        </button>

      </section>

    </motion.div>
  );
}
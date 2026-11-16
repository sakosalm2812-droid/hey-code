import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  ArrowRight,
  Sparkles,
  Brain,
  Zap,
  Users,
  Globe,
  Lock,
  FileText,
  Code,
  Terminal,
  CheckSquare,
  Search,
  FolderOpen,
  ChevronDown,
  X,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// 3D Pet Component
function Pet3D({ position = [0, 0, 0] }) {
  const groupRef = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    targetRotation.current.y = mouseRef.current.x * 0.3;
    targetRotation.current.x = mouseRef.current.y * 0.15;

    currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.05;
    currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.05;

    if (groupRef.current) {
      groupRef.current.rotation.y = currentRotation.current.y;
      groupRef.current.rotation.x = currentRotation.current.x;
    }
  });

  // Breathing animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.05;
    }
    if (bodyRef.current) {
      bodyRef.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.02);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[1.2, 1, 1]} />
        <meshStandardMaterial color="#E88A70" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.4, 0]}>
        <boxGeometry args={[1, 0.8, 1]} />
        <meshStandardMaterial color="#E88A70" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Eyes - Left */}
      <mesh position={[-0.25, 1.5, 0.52]}>
        <boxGeometry args={[0.12, 0.12, 0.08]} />
        <meshStandardMaterial color="#141414" />
      </mesh>

      {/* Eyes - Right */}
      <mesh position={[0.25, 1.5, 0.52]}>
        <boxGeometry args={[0.12, 0.12, 0.08]} />
        <meshStandardMaterial color="#141414" />
      </mesh>

      {/* Blush - Left */}
      <mesh position={[-0.5, 1.2, 0.52]}>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial color="#F4A69A" roughness={0.8} metalness={0} />
      </mesh>

      {/* Blush - Right */}
      <mesh position={[0.5, 1.2, 0.52]}>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        <meshStandardMaterial color="#F4A69A" roughness={0.8} metalness={0} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.35, -0.05, 0.5]}>
        <boxGeometry args={[0.25, 0.1, 0.5]} />
        <meshStandardMaterial color="#E88A70" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0.35, -0.05, 0.5]}>
        <boxGeometry args={[0.25, 0.1, 0.5]} />
        <meshStandardMaterial color="#E88A70" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}

// 3D Scene Component
function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 45 }}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1, pointerEvents: "none" }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#efece6"]} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Ground plane for shadows */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#efece6" transparent opacity={0} />
      </mesh>

      {/* Main Pet */}
      <Pet3D position={[-4, 0, 0]} />

      {/* Subtle floating particles */}
      <FloatingParticles count={50} />
    </Canvas>
  );
}

function FloatingParticles({ count }) {
  const pointsRef = useRef();
  const positions = useRef(new Float32Array(count * 3));
  const colors = useRef(new Float32Array(count * 3));
  const sizes = useRef(new Float32Array(count));

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 30;
      positions.current[i * 3 + 1] = Math.random() * 10;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 30;
      colors.current[i * 3] = 0.059; // #0f7685 r
      colors.current[i * 3 + 1] = 0.463; // g
      colors.current[i * 3 + 2] = 0.522; // b
      sizes.current[i] = Math.random() * 2 + 1;
    }
    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0001;
      const positions = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.getElapsedTime() + i) * 0.001;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} itemSize={3} array={positions.current} />
        <bufferAttribute attach="attributes-color" count={count} itemSize={3} array={colors.current} />
        <bufferAttribute attach="attributes-size" count={count} itemSize={1} array={sizes.current} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={1}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// 3D Agent Office Scene
function AgentOfficeScene() {
  return (
    <Canvas
      camera={{ position: [0, 8, 12], fov: 40 }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#efece6"]} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.5} />

      {/* Isometric grid floor */}
      <GridFloor size={20} divisions={20} />

      {/* Agent cubicles */}
      <AgentGrid count={12} />

      {/* Moving agents */}
      <MovingAgents count={8} />
    </Canvas>
  );
}

function GridFloor({ size, divisions }) {
  return (
    <group>
      <gridHelper args={[size, divisions, "#e8dcc8", "#e8dcc8"]} />
    </group>
  );
}

function AgentGrid({ count }) {
  const cols = 4;
  const rows = Math.ceil(count / cols);
  const spacing = 3;

  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - (cols - 1) / 2) * spacing;
        const z = (row - (rows - 1) / 2) * spacing;

        return (
          <group key={i} position={[x, 0, z]}>
            {/* Cubicle walls */}
            <mesh position={[-1.2, 0.75, -1.2]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.1, 1.5, 2.5]} />
              <meshStandardMaterial color="#e8dcc8" transparent opacity={0.3} />
            </mesh>
            <mesh position={[1.2, 0.75, -1.2]}>
              <boxGeometry args={[0.1, 1.5, 2.5]} />
              <meshStandardMaterial color="#e8dcc8" transparent opacity={0.3} />
            </mesh>
            <mesh position={[0, 0.75, 1.2]}>
              <boxGeometry args={[2.5, 1.5, 0.1]} />
              <meshStandardMaterial color="#e8dcc8" transparent opacity={0.3} />
            </mesh>

            {/* Desk */}
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[2, 0.1, 1.5]} />
              <meshStandardMaterial color="#d4c4a8" />
            </mesh>

            {/* Monitor */}
            <mesh position={[0, 1.1, -0.5]}>
              <boxGeometry args={[1.2, 0.8, 0.1]} />
              <meshStandardMaterial color="#141414" />
            </mesh>
            <mesh position={[0, 1.12, -0.55]}>
              <boxGeometry args={[1.1, 0.7, 0.05]} />
              <meshStandardMaterial color="#0f7685" emissive="#0f7685" emissiveIntensity={0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function MovingAgents({ count }) {
  const agentsRef = useRef([]);
  const clockRef = useRef(0);

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      const agent = {
        x: (Math.random() - 0.5) * 15,
        z: (Math.random() - 0.5) * 15,
        targetX: (Math.random() - 0.5) * 15,
        targetZ: (Math.random() - 0.5) * 15,
        speed: 0.01 + Math.random() * 0.02,
        color: Math.random() > 0.5 ? "#E88A70" : "#0f7685",
        phase: Math.random() * Math.PI * 2,
      };
      agentsRef.current.push(agent);
    }
  }, [count]);

  useFrame((state) => {
    clockRef.current = state.clock.getElapsedTime();

    agentsRef.current.forEach((agent, i) => {
      // Smooth movement towards target
      agent.x += (agent.targetX - agent.x) * agent.speed;
      agent.z += (agent.targetZ - agent.z) * agent.speed;

      // Check if reached target
      const dist = Math.sqrt(
        Math.pow(agent.targetX - agent.x, 2) + Math.pow(agent.targetZ - agent.z, 2)
      );
      if (dist < 0.5) {
        agent.targetX = (Math.random() - 0.5) * 15;
        agent.targetZ = (Math.random() - 0.5) * 15;
      }
    });
  });

  return (
    <group>
      {agentsRef.current.map((agent, i) => (
        <AgentMesh
          key={i}
          position={[agent.x, 0.5, agent.z]}
          color={agent.color}
          time={clockRef.current + agent.phase}
        />
      ))}
    </group>
  );
}

function AgentMesh({ position, color, time }) {
  const bob = Math.sin(time * 2) * 0.05;

  return (
    <group position={[position[0], position[1] + bob, position[2]]}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[0.4, 0.8, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.1, -0.4, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0.1, -0.4, 0]}>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}

// BlurText Component (inline implementation)
function BlurText({ text, className = "", style = {} }) {
  const [blur, setBlur] = useState(20);

  useEffect(() => {
    const tl = gsap.to({ val: 20 }, {
      val: 0,
      duration: 2,
      ease: "power2.out",
      onUpdate: function() {
        setBlur(this.targets()[0].val);
      }
    });
    return () => tl.kill();
  }, [text]);

  return (
    <span
      className={className}
      style={{
        ...style,
        filter: `blur(${blur}px)`,
        display: "inline-block",
      }}
    >
      {text}
    </span>
  );
}

// SpotlightCard Component (inline implementation)
function SpotlightCard({ children, className = "", style = {} }) {
  const ref = useRef();
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const rectRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      rectRef.current = { width: rect.width, height: rect.height };
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleLeave = () => {
      setCoords({ x: rectRef.current.width / 2, y: rectRef.current.height / 2 });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        position: "relative",
        overflow: "hidden",
        background: `
          radial-gradient(
            circle at ${coords.x}px ${coords.y}px,
            rgba(15, 118, 133, 0.15) 0%,
            transparent 60%
          ),
          rgba(255,255,255,0.9)
        `,
        border: "1px solid rgba(20, 20, 20, 0.08)",
        borderRadius: "16px",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}
      whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  const lenisRef = useRef(null);
  const scrollRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize Lenis
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenisRef.current.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Connect Lenis to ScrollTrigger
    lenisRef.current.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenisRef.current.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Animate entrance
    const tl = gsap.timeline();
    tl.to(".hero-content", { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" })
      .to(".hero-subtext", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.8")
      .to(".hero-cta", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.6");

    setIsLoaded(true);

    return () => {
      lenisRef.current?.destroy();
      gsap.ticker.remove();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  useEffect(() => {
    // Section 2: The Void - Pin and text sequence
    const voidSection = document.querySelector(".void-section");
    if (voidSection) {
      gsap.timeline({
        scrollTrigger: {
          trigger: voidSection,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 1,
        }
      })
      .to(".void-bg", { backgroundColor: "#141414", duration: 1 })
      .to(".void-text-1", { opacity: 1, duration: 0.5 }, ">-0.5")
      .to(".void-text-1", { opacity: 0, duration: 0.5 }, "+=0.5")
      .to(".void-text-2", { opacity: 1, duration: 0.5 })
      .to(".void-text-2", { opacity: 0, duration: 0.5 }, "+=0.5")
      .to(".void-text-3", { opacity: 1, duration: 0.5 })
      .to(".void-text-3", { opacity: 0, duration: 0.5 }, "+=0.5");
    }

    // Section 3: Fade back to cream
    const solutionSection = document.querySelector(".solution-section");
    if (solutionSection) {
      gsap.to(".void-bg", {
        backgroundColor: "#efece6",
        scrollTrigger: {
          trigger: solutionSection,
          start: "top bottom",
          end: "top center",
          scrub: 1,
        }
      });
    }

    // Stagger cards in solution section
    gsap.utils.toArray(".spotlight-card").forEach((card, i) => {
      gsap.from(card, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
        },
        delay: i * 0.15,
      });
    });

    // Agent office section animations
    gsap.from(".office-title", {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".office-section",
        start: "top 75%",
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [isLoaded]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#efece6",
        color: "#141414",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* 3D Background Canvas - Fixed behind everything */}
      <Scene3D />

      {/* Lenis smooth scroll wrapper */}
      <div className="lenis-wrapper" style={{ position: "relative", zIndex: 1 }}>

        {/* SECTION 1: HERO - 100vh */}
        <section className="hero-section" style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 20px",
          position: "relative",
        }}>
          <div className="hero-content" style={{
            maxWidth: "800px",
            opacity: 0,
            transform: "translateY(30px)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              color: "#0f7685",
              letterSpacing: "0.3em",
              fontSize: "13px",
              marginBottom: "24px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}>
              <Sparkles size={16} />
              <span>THE FIRST DIGITAL ORGANISM</span>
            </div>

            <h1 style={{
              margin: 0,
              fontSize: "clamp(48px, 8vw, 96px)",
              fontWeight: 400,
              fontFamily: 'Georgia, serif',
              color: "#141414",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}>
              <BlurText text="The First Digital Organism." style={{ fontSize: "clamp(48px, 8vw, 96px)", color: "#141414" }} />
            </h1>

            <p className="hero-subtext" style={{
              fontSize: "clamp(18px, 2.5vw, 24px)",
              color: "#666666",
              maxWidth: "600px",
              margin: "24px auto 0",
              lineHeight: 1.7,
              opacity: 0,
              transform: "translateY(20px)",
            }}>
              AI that remembers. AI that acts. AI that evolves.
            </p>

            <div className="hero-cta" style={{
              marginTop: "40px",
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
              opacity: 0,
              transform: "translateY(20px)",
            }}>
              <button style={{
                padding: "16px 32px",
                borderRadius: "9999px",
                background: "#0f7685",
                color: "#efece6",
                border: "none",
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(15, 118, 133, 0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#16a094";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(15, 118, 133, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0f7685";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(15, 118, 133, 0.3)";
              }}
              onClick={() => document.querySelector(".void-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                Enter the Ecosystem
                <ArrowRight size={20} style={{ marginLeft: "8px", verticalAlign: "middle" }} />
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE VOID - Pinned */}
        <section className="void-section" style={{
          position: "relative",
          minHeight: "100vh",
        }}>
          <div className="void-bg" style={{
            position: "fixed",
            inset: 0,
            background: "#efece6",
            transition: "background-color 0.5s ease",
            zIndex: -1,
          }} />

          <div style={{
            position: "relative",
            zIndex: 1,
            height: "400vh", // Tall for pinning
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{ textAlign: "center", color: "white" }}>
              <div className="void-text-1" style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 400,
                fontFamily: 'Georgia, serif',
                opacity: 0,
                marginBottom: "24px",
              }}>
                It forgets.
              </div>
              <div className="void-text-2" style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 400,
                fontFamily: 'Georgia, serif',
                opacity: 0,
                marginBottom: "24px",
              }}>
                It guesses.
              </div>
              <div className="void-text-3" style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 400,
                fontFamily: 'Georgia, serif',
                opacity: 0,
              }}>
                It doesn't act.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: THE SOLUTION */}
        <section className="solution-section" style={{
          minHeight: "100vh",
          padding: "80px 20px",
          position: "relative",
          background: "#efece6",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 400,
              fontFamily: 'Georgia, serif',
              color: "#141414",
              marginBottom: "16px",
            }}>
              The Solution
            </h2>
            <p style={{
              fontSize: "18px",
              color: "#666666",
              maxWidth: "600px",
              margin: "0 auto 60px",
              lineHeight: 1.7,
            }}>
              Three pillars that make HEY the first AI that truly works for you.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              maxWidth: "1000px",
              margin: "0 auto",
            }}>
              <SpotlightCard className="spotlight-card" style={{ padding: "40px 32px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(15, 118, 133, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  color: "#0f7685",
                }}>
                  <Brain size={28} />
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 600, color: "#141414", marginBottom: "12px" }}>
                  Cosmos Memory
                </h3>
                <p style={{ color: "#666666", lineHeight: 1.7 }}>
                  Never forgets. Your knowledge, context, and history build a living universe that grows with you.
                </p>
              </SpotlightCard>

              <SpotlightCard className="spotlight-card" style={{ padding: "40px 32px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(15, 118, 133, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  color: "#0f7685",
                }}>
                  <Zap size={28} />
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 600, color: "#141414", marginBottom: "12px" }}>
                  86B Sparse Brain
                </h3>
                <p style={{ color: "#666666", lineHeight: 1.7 }}>
                  Runs locally. Massive intelligence without the cloud dependency. Your data never leaves your machine.
                </p>
              </SpotlightCard>

              <SpotlightCard className="spotlight-card" style={{ padding: "40px 32px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(15, 118, 133, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  color: "#0f7685",
                }}>
                  <Users size={28} />
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: 600, color: "#141414", marginBottom: "12px" }}>
                  Sub-Agent Swarms
                </h3>
                <p style={{ color: "#666666", lineHeight: 1.7 }}>
                  Works while you sleep. Specialized agents collaborate autonomously on your goals 24/7.
                </p>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* SECTION 4: THE AGENT OFFICE */}
        <section className="office-section" style={{
          minHeight: "100vh",
          padding: "80px 20px",
          position: "relative",
          background: "#efece6",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div className="office-title" style={{ textAlign: "center", marginBottom: "48px" }}>
              <h2 style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 400,
                fontFamily: 'Georgia, serif',
                color: "#141414",
                marginBottom: "16px",
              }}>
                The Agent Office
              </h2>
              <p style={{
                fontSize: "18px",
                color: "#666666",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}>
                Watch your agents work in real-time. An isometric view of your digital workforce.
              </p>
            </div>

            <div style={{
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(20, 20, 20, 0.08)",
              background: "#efece6",
              boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
            }}>
              <AgentOfficeScene />
            </div>
          </div>
        </section>

        {/* SECTION 5: PRICING */}
        <section className="pricing-section" style={{
          minHeight: "100vh",
          padding: "80px 20px",
          position: "relative",
          background: "#efece6",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 400,
              fontFamily: 'Georgia, serif',
              color: "#141414",
              marginBottom: "16px",
            }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{
              fontSize: "18px",
              color: "#666666",
              maxWidth: "600px",
              margin: "0 auto 60px",
              lineHeight: 1.7,
            }}>
              Start free. Upgrade when you're ready. No surprises.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              maxWidth: "1000px",
              margin: "0 auto",
              alignItems: "start",
            }}>
              {/* Free Tier */}
              <motion.div
                style={{
                  padding: "40px 32px",
                  borderRadius: "16px",
                  background: "#ffffff",
                  border: "1px solid rgba(20, 20, 20, 0.08)",
                  textAlign: "left",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  background: "rgba(109, 181, 138, 0.1)",
                  color: "#6db58a",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}>
                  <CheckSquare size={14} />
                  Free
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: 600, color: "#141414", marginBottom: "8px" }}>
                  Free
                </h3>
                <p style={{ fontSize: "48px", fontWeight: 700, color: "#141414", marginBottom: "4px" }}>
                  $0<span style={{ fontSize: "18px", fontWeight: 400, color: "#666666" }}> / month</span>
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", color: "#666666", lineHeight: 2 }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#6db58a" }} /> Core chat & memory
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#6db58a" }} /> 10 agents
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#6db58a" }} /> Local models
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#6db58a" }} /> Basic integrations
                  </li>
                </ul>
                <button style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "9999px",
                  background: "rgba(20, 20, 20, 0.05)",
                  color: "#141414",
                  border: "1px solid rgba(20, 20, 20, 0.08)",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#141414";
                  e.currentTarget.style.color = "#efece6";
                  e.currentTarget.style.borderColor = "#141414";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(20, 20, 20, 0.05)";
                  e.currentTarget.style.color = "#141414";
                  e.currentTarget.style.borderColor = "rgba(20, 20, 20, 0.08)";
                }}
                >
                  Get Started Free
                </button>
              </motion.div>

              {/* Pro Tier */}
              <motion.div
                style={{
                  padding: "40px 32px",
                  borderRadius: "16px",
                  background: "#141414",
                  border: "1px solid rgba(15, 118, 133, 0.3)",
                  textAlign: "left",
                  boxShadow: "0 4px 20px rgba(15, 118, 133, 0.15)",
                  color: "#efece6",
                }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(15, 118, 133, 0.2)" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  background: "rgba(15, 118, 133, 0.2)",
                  color: "#0f7685",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}>
                  <Zap size={14} />
                  Popular
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: 600, color: "#efece6", marginBottom: "8px" }}>
                  Pro
                </h3>
                <p style={{ fontSize: "48px", fontWeight: 700, color: "#efece6", marginBottom: "4px" }}>
                  $29<span style={{ fontSize: "18px", fontWeight: 400, color: "#666666" }}> / month</span>
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", color: "#a0a0a0", lineHeight: 2 }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#0f7685" }} /> Everything in Free
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#0f7685" }} /> Unlimited agents
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#0f7685" }} /> QCode mode
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#0f7685" }} /> Priority support
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#0f7685" }} /> Advanced integrations
                  </li>
                </ul>
                <button style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "9999px",
                  background: "#0f7685",
                  color: "#efece6",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(15, 118, 133, 0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#16a094";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#0f7685";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                >
                  Upgrade to Pro
                </button>
              </motion.div>

              {/* Elite Tier */}
              <motion.div
                style={{
                  padding: "40px 32px",
                  borderRadius: "16px",
                  background: "#ffffff",
                  border: "1px solid rgba(20, 20, 20, 0.08)",
                  textAlign: "left",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "9999px",
                  background: "rgba(212, 168, 83, 0.1)",
                  color: "#d4a853",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}>
                  <Sparkles size={14} />
                  Elite
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: 600, color: "#141414", marginBottom: "8px" }}>
                  Elite
                </h3>
                <p style={{ fontSize: "48px", fontWeight: 700, color: "#141414", marginBottom: "4px" }}>
                  $99<span style={{ fontSize: "18px", fontWeight: 400, color: "#666666" }}> / month</span>
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "24px 0", color: "#666666", lineHeight: 2 }}>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#d4a853" }} /> Everything in Pro
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#d4a853" }} /> Custom deployments
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#d4a853" }} /> SLA & dedicated support
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#d4a853" }} /> Team collaboration
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckSquare size={16} style={{ color: "#d4a853" }} /> Custom agent training
                  </li>
                </ul>
                <button style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "9999px",
                  background: "#d4a853",
                  color: "#141414",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(212, 168, 83, 0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e4c06b";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#d4a853";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                >
                  Contact Sales
                </button>
              </motion.div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
/**
 * HEY Teacher Engine - Mentor Council
 * Simulates a high-level executive debate between Steve Jobs and Warren Buffett
 * Produces persona arguments and an integrated synthesized consensus.
 */

import { keyRotator } from "./keyRotator.js";

const COUNCIL_SYSTEM_PROMPT = `You are orchestrating the HEY Mentor Council, simulating an executive debate between:
1. Steve Jobs (Obsessed with taste, radical simplification, product intuition, aesthetic perfection, inspiring students to love the craft).
2. Warren Buffett (Obsessed with compounding fundamentals, circle of competence, risk mitigation, real-world utility, long-term durable habits).

Format the output strictly as a JSON object:
{
  "jobsArgument": "Steve Jobs' sharp, inspiring, aesthetic perspective...",
  "buffettArgument": "Warren Buffett's folksy, disciplined, compounding fundamentals perspective...",
  "synthesis": "Unified, actionable curriculum recommendation combining Jobs' vision and Buffett's discipline...",
  "verdict": "One-line executive takeaway"
}
Do not include markdown fences. Return ONLY the JSON object.`;

/**
 * Generate rich, context-aware local persona debates when offline or without active keys.
 */
function generateLocalDebate(prompt, subject = "general") {
  const p = (prompt || "").trim();

  const jobsTakes = {
    chem: `We're making students memorize sterile reaction equations when we should be letting them see the atomic poetry of the universe! Look at water—two explosive gases come together to create the foundation of all life on Earth. That is pure magic. If our lab worksheets don't make their jaws drop in the first two minutes, throw them in the trash. Strip away the bureaucratic busywork. Show them the reaction happening in front of their eyes. Design the lesson like a keynote reveal.`,
    math: `Math is not arithmetic; math is the hidden source code of reality. When someone understands calculus, they can predict how light bends, how rockets break orbit, how sound waves shape music. Stop handing students 50 drill problems that kill their spirit. Give them one profound, breathtaking problem—like how curves define the silhouette of an airplane wing—and let them struggle, fall in love, and discover the formula for themselves. It has to be intuitive, clean, and beautiful.`,
    art: `Most art curricula are paralyzed by tradition. Art isn't just about rendering technique; art is about having taste, saying something honest, and making a dent in someone's emotional universe. We must teach our students to edit ruthlessly. A great design is not when there is nothing left to add, but when there is nothing left to take away. Give them the courage to strip out the noise and leave only raw signal.`,
    bio: `A single living cell has more complex machinery, nano-motors, and error-correcting code than an entire data center in Cupertino. Why are we boring kids with dry definitions? Let them zoom into a mitochondrion like they're boarding a spaceship. When they realize their own heartbeat is powered by proton gradients and ATP synthase rotating at 9,000 RPM, they will never look at their own body the same way again.`,
    phys: `Physics is about asking the boldest questions human beings can conceive. Newton didn't sit around filling out worksheets; he wanted to know why the moon didn't fall out of the sky. When we teach mechanics or optics, every single demo should feel like a lightning strike. If we don't ignite their wonder, we have failed. Great teaching isn't about covering curriculum; it's about setting a fire that never goes out.`,
    eng: `Words are our most powerful design tool. A single sentence can spark a revolution or heal a broken soul. We shouldn't be grading whether students can regurgitate arbitrary five-paragraph templates. We should be training them to find their own authentic voice, to write with rhythm and punch, and to cut every syllable that doesn't advance the truth. Teach them that great writing makes people feel alive.`,
    general: `Look at what we're asking here: "${p}". Most people settle for mediocrity and conventional curriculum bloat. You have to be insane enough to think you can change the way students think. Strip away the compromise. Make the experience unforgettable.`,
  };

  const buffettTakes = {
    chem: `Now Steve is right about wonder, but remember Rule No. 1: Don't blow up the laboratory, and Rule No. 2: Never forget Rule No. 1. In chemistry and in investing, compounding is what does the heavy lifting. You can't balance complex redox equations without bulletproof arithmetic and atomic mass fundamentals. Build a rock-solid circle of competence first. Give students the discipline to measure accurately, record observations without bias, and respect the laws of thermodynamics. Wonder without discipline is just expensive fireworks.`,
    math: `You don't need to be a genius to do well in life or in math; you just need to be consistently not stupid. If a student understands basic ratios, compounding exponential growth, and probability, they will outperform 99% of their peers in the real world. Flashy 3D animations are nice, but if the student can't do mental arithmetic or calculate risk/reward ratios on the back of an envelope, they don't actually understand mathematics. Drill the core principles until they are second nature.`,
    art: `In business and in art, the market has a way of separating enduring value from short-lived fads. The artists who survive for centuries—Rembrandt, Da Vinci, Bach—spent decades mastering the tedious fundamentals of perspective, color grinding, and light. Encourage your students to build durable habits: draw every single day, study the masters who stood the test of 500 years, and don't mistake novelty for enduring craft.`,
    bio: `Evolution is the ultimate compounding engine. It doesn't happen through overnight breakthroughs; it happens through four billion years of continuous, disciplined adaptation. When teaching biology, make sure students understand cause and effect, feedback loops, and resource scarcity. The fundamentals of genetics and energy conservation apply whether you're analyzing a coral reef or a balance sheet. Keep their feet firmly on empirical ground.`,
    phys: `The laws of physics are the ultimate moat. You can argue with a regulator or an accountant, but you cannot negotiate with gravity or friction. When teaching physics, anchor every single concept to tangible, real-world utility: bridges that don't collapse, engines that deliver measurable horsepower, and systems that conserve energy. Teach students to double-check their units and look for the margins of safety. That's how you build things that last.`,
    eng: `If you can't communicate clearly, it's like winking at someone in the dark—nothing happens. The best writing is straightforward, unpretentious, and completely honest. Clear writing is the result of clear thinking. If a student tries to hide behind ten-dollar words and convoluted jargon, call them on it. Teach them to state the premise, provide undeniable evidence, and state the conclusion so plainly that an 8-year-old and an 80-year-old both get it immediately.`,
    general: `Let's look at the fundamentals of this prompt: "${p}". Long-term success is simply doing the ordinary things uncommonly well, day after day. Focus on what is durable, measurable, and within the students' circle of competence.`,
  };

  const syntheses = {
    chem: `Council Consensus: Pair Jobs' 'Keynote Reaction' demo with Buffett's 'Laboratory Ledger'. Begin each concept with a stunning visual anomaly to ignite curiosity, then immediately transition to rigorous stoichiometry and error analysis so students master both the poetry and the precision of chemical science.`,
    math: `Council Consensus: Use the 'Visual Hook + Compounding Drill' framework. Introduce the mathematical concept through a real-world design or engineering puzzle (Jobs), followed by a deliberate, incremental practice regimen that embeds intuition into durable long-term memory (Buffett).`,
    art: `Council Consensus: The 'Master Craft + Bold Voice' matrix. Dedicate 40% of class time to classical fundamental techniques (color harmony, perspective, anatomy) and 60% to radical self-expression and conceptual design projects where students break rules with intention.`,
    bio: `Council Consensus: 'Microscopic Wonder + Systems Analysis'. Use immersive cellular visualization to capture their awe, reinforced by quantitative data collection and evolutionary feedback modeling so students see life as both an art form and a self-balancing machine.`,
    phys: `Council Consensus: 'First-Principles Wonder with Engineering Margin'. Demonstrate the physical principle through an undeniable live experiment, followed by quantitative derivation where students calculate tolerances and margins of safety for real-world structures.`,
    eng: `Council Consensus: 'Audacious Vision + Ironclad Prose'. Encourage students to tackle provocative, deeply human themes, but enforce strict structural discipline: active verbs, zero fluff, transparent thesis statements, and persuasive evidence.`,
    general: `Council Consensus: Harmonize radical inspiration with disciplined execution. Capture their imagination with visionary design, then cement the learning through enduring compounding practice.`,
  };

  return {
    jobsArgument: jobsTakes[subject] || jobsTakes.general,
    buffettArgument: buffettTakes[subject] || buffettTakes.general,
    synthesis: syntheses[subject] || syntheses.general,
    verdict: "Inspire through bold visionary design; endure through disciplined compounding fundamentals.",
    personas: [
      { name: "Steve Jobs", title: "Visionary & Product Architect", avatar: "🍎", tone: "#00F0FF" },
      { name: "Warren Buffett", title: "Chairman & Master Allocator", avatar: "📈", tone: "#10B981" },
    ],
  };
}

/**
 * Conduct a Mentor Council debate on the user's prompt
 * @param {string} prompt Teacher question or lesson topic
 * @param {{ subject?: string, context?: string }} [options] Contextual metadata
 * @returns {Promise<{ jobsArgument: string, buffettArgument: string, synthesis: string, verdict: string, personas: Array<any> }>}
 */
export async function debate(prompt, options = {}) {
  const subject = options.subject || "chem";
  const keys = keyRotator.getKeys();
  const currentKey = keyRotator.getCurrentKey();

  const isDemo = !currentKey || currentKey.includes("Demo") || currentKey.includes("Example");
  if (keys.length === 0 || isDemo) {
    // Return rich local debate simulation with short deliberation delay
    await new Promise((resolve) => setTimeout(resolve, 450));
    return generateLocalDebate(prompt, subject);
  }

  // Attempt live AI debate using active key rotator
  try {
    const provider = keyRotator.detectProvider(currentKey);
    let url = "https://openrouter.ai/api/v1/chat/completions";
    let fetchOptions = {};

    const userPrompt = `Subject: ${subject}\nTeacher Question: ${prompt}\nContext: ${options.context || "Classroom lesson design"}`;

    if (provider === "google") {
      url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
      fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${COUNCIL_SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      };
    } else {
      url = "https://openrouter.ai/api/v1/chat/completions";
      fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "HTTP-Referer": "https://hey.internal",
          "X-Title": "HEY Mentor Council",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: COUNCIL_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      };
    }

    const response = await keyRotator.fetchWithRotation(url, fetchOptions);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    let text = "";
    if (provider === "google" && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = data.candidates[0].content.parts[0].text;
    } else if (data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content;
    } else {
      throw new Error("Invalid structure from council call");
    }

    // Clean JSON
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    const parsed = JSON.parse(cleaned);

    return {
      jobsArgument: parsed.jobsArgument || generateLocalDebate(prompt, subject).jobsArgument,
      buffettArgument: parsed.buffettArgument || generateLocalDebate(prompt, subject).buffettArgument,
      synthesis: parsed.synthesis || generateLocalDebate(prompt, subject).synthesis,
      verdict: parsed.verdict || "Unanimous Consensus Achieved",
      personas: [
        { name: "Steve Jobs", title: "Visionary & Product Architect", avatar: "🍎", tone: "#00F0FF" },
        { name: "Warren Buffett", title: "Chairman & Master Allocator", avatar: "📈", tone: "#10B981" },
      ],
    };
  } catch (err) {
    console.warn("[MentorCouncil] Remote debate call failed, utilizing local council engine:", err.message);
    return generateLocalDebate(prompt, subject);
  }
}

export default debate;

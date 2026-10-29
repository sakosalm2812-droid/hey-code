import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, ArrowUpRight, MessageSquareText, Sparkles, Ear, EarOff } from "lucide-react";

import { useAuth } from "../AuthContext.jsx";
import { askHEY } from "../lib/heyAI.js";
import {
  createBrowserSpeechProvider,
  createBrowserSpeechSynthesisProvider,
  createVoiceSession,
} from "../lib/voiceProviders.js";
import { subscribe } from "../core/eventBus.js";
import { ACTIVATION_MODES, endVoiceSession, initializeVoiceSession } from "../core/voiceEngine.js";

const kicker = "Voice surface";

export default function VoicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [voiceState, setVoiceState] = useState("idle");
  const [voiceStatus, setVoiceStatus] = useState("Ready — tap the orb or say HEY");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceResponse, setVoiceResponse] = useState("");
  const [exchangeLog, setExchangeLog] = useState([]);
  const [wakeWord, setWakeWord] = useState(false);
  const voiceSessionRef = useRef(null);
  const wakeWordSessionRef = useRef(null);
  const startRef = useRef(null);
  const scopedSessionRef = useRef(null);

  useEffect(() => {
    const startVoiceConversation = async () => {
      if (scopedSessionRef.current === "listening") {
        voiceSessionRef.current?.stop();
        return;
      }
      setVoiceTranscript("");
      setVoiceResponse("");
      const result = await voiceSessionRef.current?.start();
      if (result?.error) setVoiceStatus(result.error);
    };
    startRef.current = startVoiceConversation;

    voiceSessionRef.current = createVoiceSession({
      speechProvider: createBrowserSpeechProvider(window),
      synthesisProvider: createBrowserSpeechSynthesisProvider(window),
      ask: askHEY,
      environment: window,
      onStateChange: ({ state, error, transcript: nextTranscript, answer, ttsUnavailable }) => {
        scopedSessionRef.current = state;
        setVoiceState(state);
        if (error) setVoiceStatus(error);
        if (nextTranscript) setVoiceTranscript(nextTranscript);
        if (answer) {
          setVoiceResponse(answer);
          setExchangeLog((current) => [
            { role: "user", text: nextTranscript || "" },
            { role: "hey", text: answer },
            ...current,
          ]);
        }
        if (ttsUnavailable) setVoiceStatus("Response ready. Speech output is unavailable.");
        else if (!error) setVoiceStatus(String(state).replaceAll("_", " "));
      },
    });

    const stopBus = subscribe("wake_word.detected", () => {
      if (!wakeWordSessionRef.current) return;
      setWakeWord(false);
      startRef.current?.();
    });

    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "h") {
        event.preventDefault();
        startRef.current?.();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      stopBus();
      window.removeEventListener("keydown", onKey);
      voiceSessionRef.current?.destroy();
      if (wakeWordSessionRef.current) endVoiceSession(wakeWordSessionRef.current);
    };
  }, []);

  async function toggleWakeWord() {
    if (wakeWordSessionRef.current) {
      await endVoiceSession(wakeWordSessionRef.current);
      wakeWordSessionRef.current = null;
      setWakeWord(false);
      setVoiceStatus("Wake word disarmed");
      return;
    }
    try {
      const session = await initializeVoiceSession({
        activationMode: ACTIVATION_MODES.WAKE_WORD,
        wakePhrase: "HEY",
        language: "en",
      });
      if (session?.error) {
        setVoiceStatus(session.error);
        return;
      }
      wakeWordSessionRef.current = session?.id || null;
      setWakeWord(true);
      setVoiceStatus("Wake word armed — say “HEY”");
    } catch (error) {
      setVoiceStatus(error.message || "Wake word unavailable.");
    }
  }

  return (
    <motion.div
      className="hey-voice-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header className="hey-voice-page__header">
        <div>
          <div className="hey-chat-kicker">{kicker}</div>
          <h1>Voice</h1>
        </div>
        <div className="hey-voice-page__actions">
          <button type="button" className="hey-chat-icon-button" onClick={() => navigate("/chat")} aria-label="Open chat workspace" title="Open chat workspace">
            <MessageSquareText size={17} />
          </button>
        </div>
      </header>

      <div className="hey-voice-duo">
        <motion.div className="hey-voice-orb" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
          <button
            type="button"
            onClick={() => startRef.current?.()}
            aria-label={voiceState === "listening" ? "Stop listening" : "Start voice conversation"}
          >
            {voiceState === "listening" ? <MicOff size={64} /> : <Mic size={64} />}
          </button>
        </motion.div>

        <div className="hey-voice-copy">
          <span className="hey-voice-kicker">
            <span className={`hey-voice-dot ${voiceState}`} />
            {voiceStatus}
          </span>
          <h2>{voiceState === "listening" ? "Listening..." : "Call HEY by voice"}</h2>
          <p>
            Talk to your intelligence the same way you talk to a person. Every exchange runs through the same
            conversation runtime as HEY Chat, so replies land in your conversation history too.
          </p>

          <div className="hey-voice-page__wake">
            <button
              type="button"
              className={wakeWord ? "active" : ""}
              onClick={toggleWakeWord}
              aria-pressed={wakeWord}
            >
              {wakeWord ? <EarOff size={16} /> : <Ear size={16} />}
              {wakeWord ? "Wake word on" : "Arm wake word"}
              {wakeWord && <span className="hey-voice-page__wake-dot" />}
            </button>
            <span>Say “HEY” hands-free. Requires microphone permission and a SpeechRecognition-capable browser.</span>
          </div>
        </div>

        <AnimatePresence>
          {(voiceTranscript || voiceResponse) && (
            <motion.div className="hey-voice-transcript" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              {voiceTranscript && <p className="hey-voice-question">“{voiceTranscript}”</p>}
              {voiceResponse && <p className="hey-voice-answer">{voiceResponse}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <section className="hey-voice-page__history">
        <div className="hey-chat-kicker">Recent exchanges</div>
        {exchangeLog.length === 0 ? (
          <p className="hey-voice-page__empty">
            <Sparkles size={14} />
            Start talking and your exchanges will appear here. Sessions stay in HEY Chat history.
          </p>
        ) : (
          <ul>
            {exchangeLog.slice(0, 8).map((item, index) => (
              <li key={`${item.role}-${item.text}-${index}`}>
                <strong>{item.role === "user" ? "You" : "HEY"}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        )}
        {user && (
          <button
            type="button"
            className="hey-voice-page__open-chat"
            onClick={() => navigate("/chat")}
          >
            Open full conversation history <ArrowUpRight size={14} />
          </button>
        )}
      </section>
    </motion.div>
  );
}
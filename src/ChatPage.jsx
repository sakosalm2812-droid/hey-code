import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { resolvePageCommand } from "./core/navigationCatalog.js";
import {
  Download,
  Brain,
  Bot,
  MessageSquareText,
  Menu,
  MessageSquarePlus,
  Mic,
  MicOff,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { useAuth } from "./AuthContext.jsx";
import {
  askHEY,
  getHEYConversationMessages,
  listHEYConversations,
} from "./lib/heyAI.js";
import { issueExecutionApproval } from "./core/executionAuthorization.js";
import { requestNativeExecutionApproval } from "./lib/tauriAdapter.js";
import { addMemory } from "./lib/heyMemory.js";
import { useLocale } from "./i18n/LocaleContext.jsx";
import ChatInput from "./components/chat/ChatInput";
import ChatMessage from "./components/chat/ChatMessage";
import { subscribe } from "./core/eventBus.js";
import {
  createBrowserSpeechProvider,
  createBrowserSpeechSynthesisProvider,
  createVoiceSession,
} from "./lib/voiceProviders.js";
import PixelPet from "./components/pet/PixelPet";

const welcomeMessage = {
  role: "hey",
  text: "I am HEY.\n\nYour second brain, creation engine, and intelligence layer.\n\nWhat are we building today?",
};

function ChatWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLocale();
  const draftKey = `hey_draft_${user?.id || 'signed-out'}`;
  const [message, setMessage] = useState(() => { try { return sessionStorage.getItem(draftKey) || ''; } catch { return ''; } });
  const feedEndRef = useRef(null);
  const feedRef = useRef(null);
  const followingRef = useRef(true);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [conversationSearch, setConversationSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(() => {
    try {
      return window.localStorage.getItem("hey_chat_history_visible") !== "0";
    } catch {
      return true;
    }
  });
  const [chatError, setChatError] = useState("");
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [copiedMessage, setCopiedMessage] = useState("");
  const [executionStatus, setExecutionStatus] = useState("");
  useEffect(() => { if (location.state?.draft) setMessage(location.state.draft); }, [location.state]);
  const [pendingExecution, setPendingExecution] = useState(null);

  const [mode, setMode] = useState("text");
  const [voiceState, setVoiceState] = useState("idle");
  const [voiceStatus, setVoiceStatus] = useState("Ready");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceResponse, setVoiceResponse] = useState("");
  const voiceSessionRef = useRef(null);

  useEffect(() => {
    try { if (message) sessionStorage.setItem(draftKey, message); else sessionStorage.removeItem(draftKey); } catch { /* Draft remains in memory. */ }
  }, [message, draftKey]);
  useEffect(() => {
    if (followingRef.current) feedEndRef.current?.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, [messages, isSending]);
  function exportConversation() {
    const text = messages.map(item => `## ${item.role === 'user' ? 'You' : 'HEY'}\n\n${item.text}`).join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'hey-conversation.md'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function refreshConversations() {
    try {
      setConversations(await listHEYConversations());
    } catch {
      setChatError("Your reply was sent, but conversations could not refresh.");
    }
  }

  useEffect(() => {
    const started = subscribe("execution.request.started", () => setExecutionStatus("Understanding request..."));
    const stepStarted = subscribe("execution.step.started", ({ tool }) => setExecutionStatus(`Running ${tool}...`));
    const permission = subscribe("execution.step.permission_required", () => setExecutionStatus("Waiting for permission..."));
    const failed = subscribe("execution.request.failed", () => setExecutionStatus("Execution stopped."));
    const completed = subscribe("execution.request.completed", () => setExecutionStatus("Verified."));
    return () => [started, stepStarted, permission, failed, completed].forEach((unsubscribe) => unsubscribe());
  }, []);

  useEffect(() => {
    voiceSessionRef.current = createVoiceSession({
      speechProvider: createBrowserSpeechProvider(window),
      synthesisProvider: createBrowserSpeechSynthesisProvider(window),
      ask: askHEY,
      environment: window,
      onStateChange: ({ state, error, transcript: nextTranscript, answer, ttsUnavailable }) => {
        setVoiceState(state);
        if (error) setVoiceStatus(error);
        if (nextTranscript) setVoiceTranscript(nextTranscript);
        if (answer) {
          setVoiceResponse(answer);
          setMessages((current) => [...current, { role: "user", text: nextTranscript || "" }, { role: "hey", text: answer }]);
          refreshConversations();
        }
        if (ttsUnavailable) setVoiceStatus("Response ready. Speech output is unavailable.");
        else if (!error) setVoiceStatus(String(state).replaceAll("_", " "));
      },
    });
    return () => voiceSessionRef.current?.destroy();
  }, []);

  const visibleConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((item) => item.title?.toLowerCase().includes(query));
  }, [conversationSearch, conversations]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setConversationsLoading(true);
      try {
        const items = await listHEYConversations();
        if (cancelled) return;

        setConversations(items);
        if (!items.length) return;

        const latestMessages = await getHEYConversationMessages(items[0].id);
        if (!cancelled) {
          setConversationId(items[0].id);
          setMessages(latestMessages.length ? latestMessages : [welcomeMessage]);
        }
      } catch {
        if (!cancelled) setChatError("Could not load your conversations.");
      } finally {
        if (!cancelled) setConversationsLoading(false);
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function openConversation(id) {
    if (isSending) return;
    followingRef.current = true;
    try {
      const history = await getHEYConversationMessages(id);
      setConversationId(id);
      setMessages(history.length ? history : [welcomeMessage]);
      setChatError("");
      setHistoryOpen(false);
    } catch {
      setChatError("Could not open that conversation.");
    }
  }

  function startNewConversation() {
    if (isSending) return;
    followingRef.current = true;
    setConversationId(null);
    setMessages([welcomeMessage]);
    setMessage("");
    setChatError("");
    setHistoryOpen(false);
    setVoiceTranscript("");
    setVoiceResponse("");
  }

  async function sendUserMessage(userMessage, { approval = null, requestId = null, displayUserMessage = true } = {}) {
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage || isSending) return;
    const destination = resolvePageCommand(trimmedMessage);
    if (destination) { setMessage(''); navigate(destination.path); return; }

    if (displayUserMessage) setMessages((current) => [...current, { role: "user", text: trimmedMessage }]);
    setMessage("");
    setChatError("");
    setIsSending(true);
    followingRef.current = true;

    try {
      const response = await askHEY(trimmedMessage, {
        conversationId,
        onConversationId: setConversationId,
        approval,
        requestId,
        onExecutionResult: (execution, originalMessage) => {
          if (execution.status === "permission_required" && execution.result?.approvalRequest) {
            setPendingExecution({ message: originalMessage, approvalRequest: execution.result.approvalRequest });
          }
          else setPendingExecution(null);
        },
      });

      setMessages((current) => [...current, { role: "hey", text: response }]);
      await refreshConversations();
    } catch (error) {
      setChatError(error.message || 'Could not send your message.');
      setMessage(trimmedMessage);
    } finally {
      setIsSending(false);
      window.setTimeout(() => setExecutionStatus(""), 1800);
    }
  }

  async function confirmPendingExecution() {
    if (!pendingExecution) return;
    const request = pendingExecution;
    try {
      const nativeApproval = request.approvalRequest.binding.environment === "tauri-desktop"
        ? await requestNativeExecutionApproval(request.approvalRequest.binding)
        : null;
      const approval = issueExecutionApproval(request.approvalRequest, {
        nativeApproval,
        actorId: user?.id || null,
        environment: request.approvalRequest.binding.environment,
      });
      setPendingExecution(null);
      await sendUserMessage(request.message, { approval, requestId: request.approvalRequest.binding.workflow?.executionRequestId || null, displayUserMessage: false });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "HEY could not approve that action.");
    }
  }

  async function pinMessage(text) {
    if (!user?.id || pinnedMessages.includes(text)) return;
    const saved = await addMemory(user.id, text, "pinned");
    if (saved) setPinnedMessages((current) => [...current, text]);
  }

  async function retryMessage(index) {
    const previousUserMessage = [...messages.slice(0, index)]
      .reverse()
      .find((item) => item.role === "user");
    if (previousUserMessage) await sendUserMessage(previousUserMessage.text);
  }

  async function copyMessage(text) {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setCopiedMessage(text);
    } catch { setChatError('Could not copy. Select the message text to copy it manually.'); return; }
    window.setTimeout(() => setCopiedMessage(""), 1400);
  }

  async function toggleVoiceCall() {
    if (voiceState === "listening") {
      voiceSessionRef.current?.stop();
      return;
    }
    if (mode !== "voice") {
      setMode("voice");
      setVoiceTranscript("");
      setVoiceResponse("");
    }
    const result = await voiceSessionRef.current?.start();
    if (result?.error) setVoiceStatus(result.error);
  }

  function switchToText() {
    voiceSessionRef.current?.stop();
    setMode("text");
  }

  return (
    <motion.div
      className="hey-chat-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#efece6',
      }}
    >
      <div className="hey-chat-container" style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <aside
          className={`hey-chat-sidebar ${historyOpen ? "open" : ""}`}
          style={{
            width: '320px',
            flexShrink: 0,
            borderRight: '1px solid rgba(20, 20, 20, 0.08)',
            background: '#efece6',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 200,
            transform: historyOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.28s ease',
          }}
        >
          <div className="hey-chat-sidebar-top" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 20px 16px',
            borderBottom: '1px solid rgba(20, 20, 20, 0.08)',
          }}>
            <div>
              <span className="hey-chat-kicker" style={{
                color: '#666666',
                fontSize: '10px',
                letterSpacing: '0.11em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px'
              }}>Your intelligence layer</span>
              <h1 style={{
                margin: 0,
                color: '#141414',
                fontFamily: 'Georgia, serif',
                fontSize: '34px',
                fontWeight: '400',
                letterSpacing: '-0.06em'
              }}>HEY</h1>
            </div>
            <button
              type="button"
              className="hey-chat-icon-button hey-chat-mobile-close"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close conversation history"
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '36px',
                height: '36px',
                padding: 0,
                border: '1px solid rgba(20, 20, 20, 0.08)',
                borderRadius: '11px',
                background: '#ffffff',
                color: '#666666',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <button
            type="button"
            className="hey-chat-new"
            onClick={startNewConversation}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              width: '100%',
              minHeight: '44px',
              margin: '20px',
              padding: '0 13px',
              border: '1px solid rgba(20, 20, 20, 0.08)',
              borderRadius: '13px',
              background: '#ffffff',
              color: '#141414',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <MessageSquarePlus size={17} />
            New conversation
            <span style={{ marginLeft: 'auto', opacity: '.65', fontSize: '10px' }}>⌘ K</span>
          </button>

          <label className="hey-chat-search" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            minHeight: '40px',
            margin: '0 20px 12px',
            padding: '0 12px',
            border: '1px solid rgba(20, 20, 20, 0.08)',
            borderRadius: '12px',
            color: '#666666',
            background: '#ffffff',
          }}>
            <Search size={15} />
            <input
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              style={{
                width: '100%',
                minWidth: 0,
                border: 0,
                outline: 0,
                background: 'transparent',
                color: '#141414',
                fontSize: '12px',
              }}
            />
          </label>

          <div className="hey-chat-history-heading" style={{
            display: 'flex',
            justifyContent: 'space-between',
            margin: '24px 20px 9px',
          }}>
            <span style={{ color: '#666666', fontSize: '10px', letterSpacing: '0.11em', textTransform: 'uppercase' }}>Recent</span>
            <span style={{ color: '#666666', fontSize: '10px', letterSpacing: '0.11em', textTransform: 'uppercase' }}>{conversations.length || "—"}</span>
          </div>

          <div className="hey-chat-history-list" style={{
            display: 'grid',
            gap: '3px',
            overflowY: 'auto',
            flex: 1,
            padding: '0 20px 20px',
          }}>
            {conversationsLoading ? (
              <p className="hey-chat-history-empty" style={{ color: '#666666', fontSize: '12px', lineHeight: '1.5', margin: '8px 4px' }}>Loading conversations...</p>
            ) : (
              visibleConversations.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`hey-chat-history-item ${item.id === conversationId ? "active" : ""}`}
                  onClick={() => openConversation(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    minWidth: 0,
                    padding: '11px 10px',
                    border: '1px solid transparent',
                    borderRadius: '11px',
                    background: item.id === conversationId ? '#ffffff' : 'transparent',
                    borderColor: item.id === conversationId ? 'rgba(20, 20, 20, 0.08)' : 'transparent',
                    color: item.id === conversationId ? '#141414' : '#666666',
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <MessageSquarePlus size={15} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
                    {item.title || "Untitled conversation"}
                  </span>
                </button>
              ))
            )}
            {!conversationsLoading && !visibleConversations.length && (
              <p className="hey-chat-history-empty" style={{ margin: '8px 4px', color: '#666666', fontSize: '12px', lineHeight: '1.5' }}>
                Your conversations will appear here.
              </p>
            )}
          </div>

          <div className="hey-chat-sidebar-footer" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: 'auto',
            padding: '18px 20px 20px',
            borderTop: '1px solid rgba(20, 20, 20, 0.08)',
          }}>
            <div className="hey-chat-core-mark" style={{
              display: 'grid',
              flex: '0 0 32px',
              placeItems: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '11px',
              color: '#0f7685',
              background: 'rgba(15, 118, 133, 0.1)',
            }}>
              <Bot size={17} />
            </div>
            <div style={{ display: 'grid', gap: '3px', minWidth: 0, flex: 1 }}>
              <strong style={{ color: '#141414', fontSize: '12px' }}>HEY Core</strong>
              <span style={{ color: '#666666', fontSize: '10px' }}>Conversation available here</span>
            </div>
            <span className="hey-chat-live-dot" style={{
              width: '7px',
              height: '7px',
              marginLeft: 'auto',
              borderRadius: '50%',
              background: '#6db58a',
              boxShadow: '0 0 13px #6db58a',
            }} />
          </div>
        </aside>

        {historyOpen && (
          <button
            type="button"
            className="hey-chat-drawer-backdrop"
            onClick={() => setHistoryOpen(false)}
            aria-label="Close conversation history"
            style={{
              display: historyOpen ? 'block' : 'none',
              position: 'fixed',
              inset: 0,
              zIndex: 199,
              border: 0,
              background: 'rgba(3,4,9,.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
        )}

        <section className="hey-chat-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
          background: '#efece6',
          marginLeft: historyOpen ? '320px' : 0,
          transition: 'margin-left 0.28s ease',
          height: '100vh',
        }}>
          <header className="hey-chat-header" style={{
            minHeight: '70px',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(20, 20, 20, 0.08)',
            background: 'rgba(255,255,255,0.5)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <button
              type="button"
              className="hey-chat-icon-button hey-chat-mobile-menu"
              onClick={() => {
                setHistoryOpen(true);
                try { window.localStorage.setItem("hey_chat_history_visible", "1"); } catch { /* persisted best-effort */ }
              }}
              aria-label="Open conversation history"
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '36px',
                height: '36px',
                padding: 0,
                border: '1px solid rgba(20, 20, 20, 0.08)',
                borderRadius: '11px',
                background: '#ffffff',
                color: '#666666',
                cursor: 'pointer',
              }}
            >
              <Menu size={19} />
            </button>

            <button
              type="button"
              className="hey-chat-icon-button hey-chat-desktop-collapse"
              title={historyOpen ? "Hide conversation history" : "Show conversation history"}
              aria-label={historyOpen ? "Hide conversation history" : "Show conversation history"}
              onClick={() => {
                const next = !historyOpen;
                setHistoryOpen(next);
                try { window.localStorage.setItem("hey_chat_history_visible", next ? "1" : "0"); } catch { /* persisted best-effort */ }
              }}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: '36px',
                height: '36px',
                padding: 0,
                border: '1px solid rgba(20, 20, 20, 0.08)',
                borderRadius: '11px',
                background: '#ffffff',
                color: '#666666',
                cursor: 'pointer',
              }}
            >
              {historyOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
            </button>

            <div className="hey-chat-mode-switch" role="tablist" aria-label="HEY mode" style={{
              display: 'flex',
              padding: '3px',
              borderRadius: '10px',
              background: 'rgba(20, 20, 20, 0.05)',
              border: '1px solid rgba(20, 20, 20, 0.08)',
              gap: '2px',
              flexShrink: 0,
            }}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "text"}
                className={mode === "text" ? "active" : ""}
                onClick={switchToText}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 13px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mode === "text" ? 'rgba(20, 20, 20, 0.08)' : 'transparent',
                  color: mode === "text" ? '#141414' : '#666666',
                  fontSize: '12.5px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: '.2s',
                }}
              >
                <MessageSquareText size={14} />
                Text
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "voice"}
                className={mode === "voice" ? "active" : ""}
                onClick={toggleVoiceCall}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 13px',
                  borderRadius: '8px',
                  border: 'none',
                  background: mode === "voice" ? 'rgba(20, 20, 20, 0.08)' : 'transparent',
                  color: mode === "voice" ? '#141414' : '#666666',
                  fontSize: '12.5px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: '.2s',
                }}
              >
                <Mic size={14} />
                Voice
              </button>
            </div>

            <div className="hey-chat-title" style={{
              display: 'grid',
              gap: '5px',
              flex: 1,
            }}>
              <div className="hey-chat-status" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#666666',
                fontSize: '11px',
                letterSpacing: '0.08em',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#6db58a',
                  boxShadow: '0 0 10px #6db58a',
                }} />
                {isSending ? "Thinking" : "Ready"}
              </div>
              <h2 style={{
                margin: 0,
                color: '#141414',
                fontSize: '14px',
                fontWeight: '700'
              }}>
                {mode === "voice" ? "Voice conversation" : "Personal intelligence"}
              </h2>
            </div>

            <div className="hey-chat-header-actions" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
            }}>
              <button
                type="button"
                className="hey-chat-icon-button"
                onClick={exportConversation}
                aria-label="Export conversation"
                title="Export conversation"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  border: '1px solid rgba(20, 20, 20, 0.08)',
                  borderRadius: '11px',
                  background: '#ffffff',
                  color: '#666666',
                  cursor: 'pointer',
                }}
              >
                <Download size={17} />
              </button>
              <span className="hey-chat-adaptive" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 10px',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                borderRadius: '999px',
                color: '#666666',
                fontSize: '11px',
              }}>
                <Brain size={14} />
                Adaptive
              </span>
              <button
                type="button"
                className="hey-chat-icon-button"
                onClick={startNewConversation}
                aria-label="Start new conversation"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: '36px',
                  height: '36px',
                  padding: 0,
                  border: '1px solid rgba(20, 20, 20, 0.08)',
                  borderRadius: '11px',
                  background: '#ffffff',
                  color: '#666666',
                  cursor: 'pointer',
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          </header>

          {mode === "voice" ? (
            <div className="hey-voice-duo" style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '28px',
              padding: '40px 20px 60px',
              textAlign: 'center',
            }}>
              <motion.div
                className="hey-voice-orb"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: `
                    radial-gradient(circle at 40% 35%, rgba(15, 118, 133, 0.15), transparent 50%),
                    rgba(255,255,255,.07)
                  `,
                  border: '1px solid rgba(20, 20, 20, 0.08)',
                  backdropFilter: 'blur(24px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,.18),
                    inset 0 -1px 0 rgba(0,0,0,.14),
                    0 0 50px rgba(15, 118, 133, 0.1),
                    0 40px 100px rgba(0,0,0,.15)
                  `,
                }}
              >
                <button
                  type="button"
                  onClick={toggleVoiceCall}
                  aria-label={voiceState === "listening" ? "Stop listening" : "Start voice conversation"}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    color: '#0f7685',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {voiceState === "listening" ? <MicOff size={64} /> : <Mic size={64} />}
                </button>
              </motion.div>

              <div className="hey-voice-copy">
                <span className="hey-voice-kicker" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#666666',
                }}>
                  <span className={`hey-voice-dot ${voiceState}`} style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: voiceState === "listening" ? '#6DB58A' : '#666666',
                    boxShadow: voiceState === "listening" ? '0 0 10px rgba(109,181,138,.5)' : 'none',
                    animation: voiceState === "listening" ? 'voice-pulse 1.4s infinite ease-in-out' : 'none',
                    transition: '.3s',
                  }} />
                  {voiceStatus}
                </span>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '600',
                  margin: '8px 0 0',
                  color: '#141414',
                }}>
                  {voiceState === "listening" ? "Listening..." : "Call HEY by voice"}
                </h2>
                <p style={{
                  color: '#666666',
                  fontSize: '13.5px',
                  maxWidth: '440px',
                  lineHeight: '1.6',
                  margin: '8px 0 0',
                }}>
                  Talk to your intelligence the same way you talk to a person. Your transcript is sent to HEY to generate a reply. Speech processing depends on your browser.
                </p>
              </div>

              {(voiceTranscript || voiceResponse) && (
                <div className="hey-voice-transcript" style={{
                  width: '100%',
                  maxWidth: '520px',
                  padding: '18px 22px',
                  borderRadius: '16px',
                  background: 'rgba(20, 20, 20, 0.03)',
                  border: '1px solid rgba(20, 20, 20, 0.08)',
                  textAlign: 'left',
                }}>
                  {voiceTranscript && (
                    <p className="hey-voice-question" style={{
                      fontStyle: 'italic',
                      color: '#666666',
                      fontSize: '14px',
                      marginBottom: '10px',
                    }}>
                      “{voiceTranscript}”
                    </p>
                  )}
                  {voiceResponse && (
                    <p className="hey-voice-answer" style={{
                      fontSize: '14.5px',
                      color: '#141414',
                      lineHeight: '1.7',
                    }}>
                      {voiceResponse}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="hey-chat-feed" ref={feedRef} onScroll={() => {
                const feed = feedRef.current;
                followingRef.current = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 100;
              }} style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px clamp(18px, 5vw, 76px) 0',
              }}>
                {chatError && (
                  <div className="hey-chat-error" role="alert" style={{
                    width: 'min(100%, 790px)',
                    margin: '0 auto 18px',
                    padding: '11px 13px',
                    border: '1px solid rgba(255,158,122,.3)',
                    borderRadius: '12px',
                    color: '#ff6b6b',
                    background: 'rgba(255,158,122,.08)',
                    fontSize: '12px',
                  }}>
                    {chatError}
                  </div>
                )}

                <div className="hey-chat-messages" style={{
                  width: 'min(100%, 790px)',
                  margin: '0 auto',
                }}>
                  {messages.map((item, index) => (
                    <ChatMessage
                      key={`${item.role}-${item.text}-${index}`}
                      role={item.role}
                      onCopy={() => copyMessage(item.text)}
                      onRetry={() => retryMessage(index)}
                      onPin={() => pinMessage(item.text)}
                      pinned={pinnedMessages.includes(item.text)}
                      copied={copiedMessage === item.text}
                    >
                      {item.text}
                    </ChatMessage>
                  ))}
                  {isSending && (
                    <div className="hey-chat-thinking" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginLeft: '44px',
                      color: '#666666',
                      fontSize: '11px',
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0f7685', animation: 'hey-chat-pulse 1s ease-in-out infinite' }} />
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0f7685', animation: 'hey-chat-pulse 1s ease-in-out infinite', animationDelay: '.15s' }} />
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#0f7685', animation: 'hey-chat-pulse 1s ease-in-out infinite', animationDelay: '.3s' }} />
                      {t("chat.thinking")}
                    </div>
                  )}
                  <div ref={feedEndRef} />
                </div>
              </div>

              <footer className="hey-chat-composer-area" style={{
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto',
                padding: '0 24px 32px',
              }}>
                {/* 2D Pixel Pet - Pip */}
                <PixelPet inputText={message} style={{ marginBottom: '16px' }} />

                <ChatInput
                  value={message}
                  setValue={setMessage}
                  onSend={() => sendUserMessage(message)}
                  disabled={isSending}
                  conversationId={conversationId}
                  onVoiceCall={toggleVoiceCall}
                />
                <p className="hey-chat-disclaimer" style={{
                  margin: '12px 0 0',
                  textAlign: 'center',
                  fontSize: '10px',
                  letterSpacing: '0.04em',
                  color: '#666666'
                }}>
                  HEY can make mistakes. Check important information.
                </p>
              </footer>
            </>
          )}
        </section>
      </div>
      <style jsx>{`
        @keyframes hey-chat-pulse {
          0%, 100% { opacity: .3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes voice-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .6; transform: scale(1.4); }
        }
        @media (max-width: 900px) {
          .hey-chat-panel {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  return <ChatWorkspace key={user?.id || 'signed-out'} />;
}
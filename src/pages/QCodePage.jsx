import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Terminal,
  FolderOpen,
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  Copy,
  Check,
  Sparkles,
  Menu,
  LayoutDashboard,
  Code2,
  GitBranch,
  FileText,
  Clock,
  Zap,
  Shield,
  MoreHorizontal,
  Minimize,
  Maximize,
} from "lucide-react";

const mockSessions = [
  { id: "1", title: "Refactor auth module", updatedAt: "2 hours ago", messages: 12, status: "active" },
  { id: "2", title: "Debug memory leak", updatedAt: "Yesterday", messages: 8, status: "completed" },
  { id: "3", title: "Add TypeScript types", updatedAt: "3 days ago", messages: 15, status: "active" },
  { id: "4", title: "Write unit tests", updatedAt: "Last week", messages: 5, status: "pending" },
  { id: "5", title: "Optimize database queries", updatedAt: "Last week", messages: 22, status: "active" },
];

const mockMessages = [
  { role: "user", content: "Help me refactor the authentication module to use the new token format", timestamp: "2 hours ago" },
  { role: "assistant", content: "I'll help you refactor the auth module. Let me first examine the current implementation.", timestamp: "2 hours ago" },
  { role: "assistant", content: "```typescript\n// Current auth.ts\ninterface TokenPayload {\n  userId: string;\n  email: string;\n  roles: string[];\n  exp: number;\n}\n\nfunction generateToken(payload: TokenPayload): string {\n  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });\n}\n```", timestamp: "2 hours ago" },
  { role: "user", content: "Now update it to use the new format with refresh tokens", timestamp: "2 hours ago" },
  { role: "assistant", content: "```typescript\n// Updated auth.ts with refresh tokens\ninterface TokenPayload {\n  userId: string;\n  email: string;\n  roles: string[];\n  sessionId: string;\n  exp: number;\n}\n\ninterface RefreshTokenPayload {\n  sessionId: string;\n  userId: string;\n  exp: number;\n}\n\nfunction generateAccessToken(payload: TokenPayload): string {\n  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });\n}\n\nfunction generateRefreshToken(payload: RefreshTokenPayload): string {\n  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });\n}\n```", timestamp: "2 hours ago" },
];

function QCodePage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [sessions, setSessions] = useState(mockSessions);
  const [activeSessionId, setActiveSessionId] = useState("1");
  const [messages, setMessages] = useState(mockMessages);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [codeContent, setCodeContent] = useState(`// Welcome to QCode - Your AI pair programmer
// Select a folder to start coding with context

function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));`);

  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = {
      role: "user",
      content: inputValue,
      timestamp: "Just now"
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = {
        role: "assistant",
        content: `I'll help you with: "${userMessage.content}". Here's my approach:\n\n\`\`\`typescript\n// Implementation here\nconsole.log("Working on it...");\n\`\`\``,
        timestamp: "Just now"
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsSending(false);
    }, 1000);
  };

  const handleNewSession = () => {
    const newSession = {
      id: String(Date.now()),
      title: "New session",
      updatedAt: "Just now",
      messages: 0,
      status: "active",
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setInputValue("");
  };

  const handleFolderSelect = () => {
    setShowFolderPicker(true);
    // In real app: window.electronAPI.selectFolder()
  };

  return (
    <div className="hey-qcode-page" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Top Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--glass-1)',
        backdropFilter: 'blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: Logo + Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              border: 'none',
              borderRadius: 'var(--radius-control)',
              background: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Terminal size={14} style={{ color: 'var(--on-accent)' }} />
            </div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '20px',
              fontWeight: '400',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>QCode</span>
          </div>

          {/* Chat / Code Toggle */}
          <div style={{
            display: 'flex',
            padding: '3px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.08)',
            gap: '2px',
            marginLeft: '8px',
          }}>
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === "chat" ? 'rgba(255,255,255,.12)' : 'transparent',
                color: activeTab === "chat" ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <MessageSquare size={14} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("code")}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === "code" ? 'rgba(255,255,255,.12)' : 'transparent',
                color: activeTab === "code" ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Code2 size={14} />
              Code
            </button>
          </div>
        </div>

        {/* Center: Folder Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
          <button
            onClick={handleFolderSelect}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <FolderOpen size={14} />
            <span>Select folder</span>
            <ChevronDown size={12} />
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '999px',
            background: 'var(--accent-glow-soft)',
            border: '1px solid var(--accent-glow)',
            color: 'var(--accent)',
            fontSize: '11px',
            fontWeight: '500',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green-accent)', boxShadow: '0 0 8px var(--green-accent)' }} />
            No folder selected
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleNewSession}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-button)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--on-accent)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 14px var(--accent-glow-soft)',
            }}
          >
            <Plus size={14} />
            New
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <Settings size={16} />
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar - Sessions */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              ref={sidebarRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                width: 280,
                flexShrink: 0,
                borderRight: '1px solid var(--border)',
                background: 'linear-gradient(180deg, var(--glass-bg-strong), var(--glass-bg))',
                backdropFilter: 'blur(28px) saturate(140%)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '16px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                  }}>Sessions</span>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    background: 'var(--glass-bg)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}>
                    {sessions.length}
                  </span>
                </div>
              </div>

              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px',
              }}>
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => { setActiveSessionId(session.id); setMessages(mockMessages); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--radius-control)',
                      border: `1px solid ${activeSessionId === session.id ? 'var(--accent)' : 'transparent'}`,
                      background: activeSessionId === session.id ? 'var(--accent-glow-soft)' : 'transparent',
                      color: activeSessionId === session.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      marginBottom: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        flex: 1,
                        fontSize: '13px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {session.title}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: session.status === 'active' ? 'rgba(109,181,138,.2)' :
                                   session.status === 'completed' ? 'rgba(15,118,133,.2)' : 'rgba(212,168,83,.2)',
                        color: session.status === 'active' ? 'var(--green-accent)' :
                               session.status === 'completed' ? 'var(--accent)' : 'var(--gold)',
                        whiteSpace: 'nowrap',
                      }}>
                        {session.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={10} />
                        {session.messages}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} />
                        {session.updatedAt}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
              }}>
                <button
                  onClick={handleNewSession}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--border)',
                    background: 'var(--glass-bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Plus size={14} />
                  New session
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Panel */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01))',
        }}>
          {activeTab === "chat" ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px clamp(20px, 5vw, 80px) 24px',
              }}>
                <div style={{ width: 'min(100%, 800px)', margin: '0 auto' }}>
                  {messages.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      color: 'var(--text-tertiary)',
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        margin: '0 auto 24px',
                        background: 'var(--accent-glow-soft)',
                        border: '1px solid var(--accent-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Terminal size={32} style={{ color: 'var(--accent)' }} />
                      </div>
                      <h2 style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '28px',
                        fontWeight: '400',
                        marginBottom: '12px',
                        color: 'var(--text-primary)',
                      }}>Start a coding session</h2>
                      <p style={{ fontSize: '15px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                        Select a folder, choose Chat or Code mode, and start building with AI assistance.
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '32px',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                          }}
                        >
                          <div style={{
                            flex: '0 0 32px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: msg.role === 'user' ? 'rgba(255,255,255,.1)' : 'var(--accent-glow-soft)',
                              color: msg.role === 'user' ? 'var(--text-primary)' : 'var(--accent)',
                            }}>
                              {msg.role === 'user' ? (
                                <span style={{ fontSize: '11px', fontWeight: '700' }}>U</span>
                              ) : (
                                <Terminal size={16} />
                              )}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              maxWidth: '700px',
                              padding: msg.role === 'user' ? '14px 18px' : 0,
                              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : 0,
                              background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent-glow-soft), rgba(255,255,255,.04))' : 'transparent',
                              border: msg.role === 'user' ? '1px solid var(--border)' : 'none',
                            }}>
                              {typeof msg.content === 'string' && msg.content.includes('```') ? (
                                msg.content.split('```').map((part, i) => {
                                  if (i % 2 === 0) {
                                    return part.trim() ? (
                                      <p key={i} style={{
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                        lineHeight: '1.75',
                                        whiteSpace: 'pre-wrap',
                                        margin: '0 0 12px',
                                      }}>{part.trim()}</p>
                                    ) : null;
                                  }
                                  return (
                                    <div key={i} style={{ marginBottom: '12px' }}>
                                      <pre style={{
                                        margin: 0,
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: 'rgba(0,0,0,.4)',
                                        border: '1px solid var(--border)',
                                        overflowX: 'auto',
                                      }}>
                                        <code style={{
                                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                          fontSize: '13px',
                                          lineHeight: '1.7',
                                          color: 'var(--text-primary)',
                                        }}>{part.trim()}</code>
                                      </pre>
                                    </div>
                                  );
                                })
                              ) : (
                                <p style={{
                                  color: 'var(--text-primary)',
                                  fontSize: '14px',
                                  lineHeight: '1.75',
                                  whiteSpace: 'pre-wrap',
                                  margin: 0,
                                }}>
                                  {msg.content}
                                </p>
                              )}
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '8px',
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                            }}>
                              <span style={{
                                fontSize: '10px',
                                color: 'var(--text-tertiary)',
                                letterSpacing: '0.05em',
                              }}>
                                {msg.timestamp}
                              </span>
                              <button style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}>
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {isSending && (
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          marginBottom: '32px',
                        }}>
                          <div style={{
                            flex: '0 0 32px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'var(--accent-glow-soft)',
                              color: 'var(--accent)',
                            }}>
                              <Terminal size={16} />
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              maxWidth: '700px',
                              padding: '16px 20px',
                              borderRadius: '18px 18px 4px 18px',
                              background: 'linear-gradient(135deg, var(--accent-glow-soft), rgba(255,255,255,.04))',
                              border: '1px solid var(--border)',
                            }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s ease-in-out infinite' }} />
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s ease-in-out infinite', animationDelay: '0.15s' }} />
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s ease-in-out infinite', animationDelay: '0.3s' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div style={{
                padding: '16px clamp(20px, 5vw, 80px) 24px',
                borderTop: '1px solid var(--border)',
                background: 'rgba(255,255,255,.02)',
              }}>
                <div style={{ width: 'min(100%, 800px)', margin: '0 auto' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid rgba(255,255,255,.18)',
                    background: 'linear-gradient(145deg, rgba(255,255,255,.1), rgba(255,255,255,.03))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.15), 0 12px 35px rgba(0,0,0,.15)',
                    backdropFilter: 'blur(24px) saturate(150%)',
                  }}>
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                      placeholder="Ask QCode to write, refactor, debug, or explain code..."
                      disabled={isSending}
                      rows={1}
                      style={{
                        flex: 1,
                        minHeight: '44px',
                        maxHeight: '160px',
                        resize: 'none',
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isSending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-button)',
                        border: 'none',
                        background: inputValue.trim() && !isSending ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'rgba(255,255,255,.05)',
                        color: inputValue.trim() && !isSending ? 'var(--on-accent)' : 'var(--text-muted)',
                        cursor: inputValue.trim() && !isSending ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        boxShadow: inputValue.trim() && !isSending ? '0 4px 14px var(--accent-glow-soft)' : 'none',
                      }}
                    >
                      <Sparkles size={18} />
                    </button>
                  </div>
                  <p style={{
                    margin: '10px 0 0',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}>
                    Press Enter to send · Shift+Enter for new line · QCode can make mistakes
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* File Explorer */}
              <aside style={{
                width: '280px',
                flexShrink: 0,
                borderRight: '1px solid var(--border)',
                background: 'var(--glass-1)',
                backdropFilter: 'blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                  }}>Project</span>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                  }}>
                    <MoreHorizontal size={12} />
                  </button>
                </div>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '8px',
                }}>
                  <div style={{
                    padding: '8px 12px 4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                  }}>SRC</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {[
                      { name: 'components', type: 'folder', children: ['Button.tsx', 'Input.tsx', 'Card.tsx'] },
                      { name: 'hooks', type: 'folder', children: ['useAuth.ts', 'useTheme.ts'] },
                      { name: 'lib', type: 'folder', children: ['api.ts', 'utils.ts'] },
                      { name: 'types', type: 'folder', children: ['index.ts'] },
                      { name: 'App.tsx', type: 'file' },
                      { name: 'main.tsx', type: 'file' },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}>
                        {item.type === 'folder' ? (
                          <>
                            <ChevronRight size={12} style={{ color: 'var(--text-tertiary)', marginRight: '6px' }} />
                            <FolderOpen size={14} style={{ color: 'var(--gold)', marginRight: '8px' }} />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.name}</span>
                          </>
                        ) : (
                          <>
                            <FileText size={14} style={{ color: 'var(--text-tertiary)', marginRight: '8px' }} />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              {/* Editor */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--glass-1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}>
                      <FileText size={12} />
                      main.tsx
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>TypeScript</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}>
                      <Minimize size={14} />
                    </button>
                    <button style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}>
                      <Maximize size={14} />
                    </button>
                  </div>
                </div>
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '20px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: '13px',
                  lineHeight: '1.7',
                }}>
                  <pre style={{ margin: 0, color: 'var(--text-primary)' }}>
                    <code>{codeContent}</code>
                  </pre>
                </div>
                {/* Inline AI Prompt Box */}
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid var(--border)',
                  background: 'rgba(255,255,255,.02)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px',
                    maxWidth: '900px',
                    margin: '0 auto',
                  }}>
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                      placeholder="Ask QCode to edit this file..."
                      disabled={isSending}
                      rows={1}
                      style={{
                        flex: 1,
                        minHeight: '44px',
                        maxHeight: '120px',
                        resize: 'none',
                        borderRadius: 'var(--radius-card)',
                        border: '1px solid rgba(255,255,255,.18)',
                        background: 'linear-gradient(145deg, rgba(255,255,255,.1), rgba(255,255,255,.03))',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.15), 0 12px 35px rgba(0,0,0,.15)',
                        backdropFilter: 'blur(24px) saturate(150%)',
                        padding: '12px 16px',
                        color: 'var(--text-primary)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isSending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-button)',
                        border: 'none',
                        background: inputValue.trim() && !isSending ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'rgba(255,255,255,.05)',
                        color: inputValue.trim() && !isSending ? 'var(--on-accent)' : 'var(--text-muted)',
                        cursor: inputValue.trim() && !isSending ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        boxShadow: inputValue.trim() && !isSending ? '0 4px 14px var(--accent-glow-soft)' : 'none',
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Chat Panel (Right) */}
              <aside style={{
                width: '360px',
                flexShrink: 0,
                borderLeft: '1px solid var(--border)',
                background: 'var(--glass-1)',
                backdropFilter: 'blur(var(--glass-blur-strong)) saturate(var(--glass-saturate-strong))',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'var(--accent-glow-soft)',
                      border: '1px solid var(--accent-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Zap size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>QCode AI</span>
                  </div>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                  }}>
                    <X size={14} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  <div style={{
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    marginBottom: '16px',
                  }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Ready to help.</strong> I can write, refactor, debug, and explain code in your project. What would you like to do?
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { icon: Zap, label: "Generate component", desc: "Create a new React component" },
                      { icon: Shield, label: "Add error handling", desc: "Wrap functions with try/catch" },
                      { icon: GitBranch, label: "Refactor to hooks", desc: "Convert class components" },
                      { icon: Code2, label: "Write tests", desc: "Generate unit tests for selection" },
                      { icon: Sparkles, label: "Explain this code", desc: "Get a detailed explanation" },
                    ].map((item, i) => (
                      <button key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: 'var(--radius-control)',
                        border: '1px solid var(--border)',
                        background: 'var(--glass-bg)',
                        color: 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'var(--accent-glow-soft)',
                          border: '1px solid var(--accent-glow)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <item.icon size={14} style={{ color: 'var(--accent)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '13px', color: 'var(--text-primary)' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </motion.div>
          )}
        </main>
      </div>

      {/* Folder Picker Modal */}
      <AnimatePresence>
        {showFolderPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(3,4,9,.7)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowFolderPicker(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                width: 'min(90vw, 560px)',
                maxHeight: '80vh',
                borderRadius: 'var(--radius-card)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                boxShadow: 'var(--elevation-4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FolderOpen size={18} style={{ color: 'var(--on-accent)' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Select project folder
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      QCode will index this folder for context
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFolderPicker(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-control)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '400px' }}>
                <div style={{
                  marginBottom: '16px',
                  padding: '16px',
                  borderRadius: 'var(--radius-control)',
                  border: '1px solid var(--accent-glow)',
                  background: 'var(--accent-glow-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FolderOpen size={20} style={{ color: 'var(--on-accent)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Hey Project</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>C:\Users\DELL\Documents\hey</div>
                  </div>
                  <button style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-button)',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'var(--on-accent)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}>
                    Select
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>Recent folders</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { name: 'hey', path: 'C:\Users\DELL\Documents\hey' },
                    { name: 'work-project', path: 'C:\Users\DELL\Documents\work-project' },
                    { name: 'personal-site', path: 'C:\Users\DELL\Documents\personal-site' },
                  ].map((folder, i) => (
                    <button key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--border)',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}>
                      <FolderOpen size={20} style={{ color: 'var(--gold)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{folder.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{folder.path}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
              }}>
                <button
                  onClick={() => setShowFolderPicker(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--border)',
                    background: 'var(--glass-bg)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @media (max-width: 1200px) {
          .hey-qcode-page main > div:last-child > aside:last-child {
            display: none;
          }
        }
        @media (max-width: 900px) {
          .hey-qcode-page header > div:first-child > div:last-child {
            display: none;
          }
          .hey-qcode-page header > div:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default QCodePage;
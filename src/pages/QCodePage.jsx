import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Code,
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Settings,
  FileText,
  Clock,
  Zap,
  Shield,
  MoreHorizontal,
  Minimize,
  Maximize,
  ArrowUp,
  Hand,
  Globe,
} from "lucide-react";

const mockSessions = [
  { id: "1", title: "Refactor auth module", updatedAt: "2 hours ago", messages: 12, status: "active" },
  { id: "2", title: "Debug memory leak", updatedAt: "Yesterday", messages: 8, status: "completed" },
  { id: "3", title: "Add TypeScript types", updatedAt: "3 days ago", messages: 15, status: "active" },
  { id: "4", title: "Write unit tests", updatedAt: "Last week", messages: 5, status: "pending" },
  { id: "5", title: "Optimize database queries", updatedAt: "Last week", messages: 22, status: "active" },
];

function QCodePage() {
  const [activeTab, setActiveTab] = useState("code");
  const [sessions, setSessions] = useState(mockSessions);
  const [activeSessionId, setActiveSessionId] = useState("1");
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

  const handleSendMessage = () => {
    if (!inputValue.trim() || isSending) return;
    const userMessage = { role: "user", content: inputValue, timestamp: "Just now" };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);
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
  };

  return (
    <div className="hey-qcode-page" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#efece6',
      color: '#141414',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Top Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        padding: '0 16px',
        borderBottom: '1px solid rgba(20, 20, 20, 0.08)',
        background: '#efece6',
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
              borderRadius: '8px',
              background: 'rgba(20, 20, 20, 0.05)',
              color: '#666666',
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
              background: '#0f7685',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Code size={14} style={{ color: '#efece6' }} />
            </div>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: '20px',
              fontWeight: '400',
              letterSpacing: '-0.02em',
              color: '#141414',
            }}>QCode</span>
          </div>

          {/* Chat / Code Toggle */}
          <div style={{
            display: 'flex',
            padding: '3px',
            borderRadius: '10px',
            background: 'rgba(20, 20, 20, 0.05)',
            border: '1px solid rgba(20, 20, 20, 0.08)',
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
                background: activeTab === "chat" ? '#ffffff' : 'transparent',
                color: activeTab === "chat" ? '#141414' : '#666666',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === "chat" ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
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
                background: activeTab === "code" ? '#ffffff' : 'transparent',
                color: activeTab === "code" ? '#141414' : '#666666',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === "code" ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
              }}
            >
              <Code size={14} />
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
              borderRadius: '8px',
              border: '1px solid rgba(20, 20, 20, 0.08)',
              background: '#ffffff',
              color: '#666666',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
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
            borderRadius: '9999px',
            background: 'rgba(15, 118, 133, 0.1)',
            border: '1px solid rgba(15, 118, 133, 0.2)',
            color: '#0f7685',
            fontSize: '11px',
            fontWeight: '500',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6db58a', boxShadow: '0 0 8px #6db58a' }} />
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
              borderRadius: '9999px',
              border: 'none',
              background: '#0f7685',
              color: '#efece6',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(15, 118, 133, 0.3)',
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
              borderRadius: '8px',
              border: '1px solid rgba(20, 20, 20, 0.08)',
              background: '#ffffff',
              color: '#666666',
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
              borderRadius: '8px',
              border: '1px solid rgba(20, 20, 20, 0.08)',
              background: '#ffffff',
              color: '#666666',
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
                borderRight: '1px solid rgba(20, 20, 20, 0.08)',
                background: '#efece6',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '16px',
                borderBottom: '1px solid rgba(20, 20, 20, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#666666',
                  }}>Sessions</span>
                  <span style={{
                    fontSize: '11px',
                    color: '#666666',
                    background: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(20, 20, 20, 0.08)',
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
                    onClick={() => { setActiveSessionId(session.id); setMessages([]); }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${activeSessionId === session.id ? '#0f7685' : 'transparent'}`,
                      background: activeSessionId === session.id ? '#ffffff' : 'transparent',
                      color: activeSessionId === session.id ? '#141414' : '#666666',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      marginBottom: '4px',
                      boxShadow: activeSessionId === session.id ? '0 2px 8px rgba(0,0,0,0.03)' : 'none',
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
                        borderRadius: '9999px',
                        background: session.status === 'active' ? 'rgba(109,181,138,.1)' :
                                   session.status === 'completed' ? 'rgba(15,118,133,.1)' : 'rgba(212,168,83,.1)',
                        color: session.status === 'active' ? '#6db58a' :
                               session.status === 'completed' ? '#0f7685' : '#d4a853',
                        whiteSpace: 'nowrap',
                      }}>
                        {session.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#666666' }}>
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
                borderTop: '1px solid rgba(20, 20, 20, 0.08)',
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
                    borderRadius: '8px',
                    border: '1px solid rgba(20, 20, 20, 0.08)',
                    background: '#ffffff',
                    color: '#666666',
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

        {/* Main Panel - Code View (default) */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#ffffff',
        }}>
          {activeTab === "chat" ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '32px' }}>
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666666',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  margin: '0 auto 24px',
                  background: 'rgba(15, 118, 133, 0.1)',
                  border: '1px solid rgba(15, 118, 133, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MessageSquare size={32} style={{ color: '#0f7685' }} />
                </div>
                <h2 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '28px',
                  fontWeight: '400',
                  marginBottom: '12px',
                  color: '#141414',
                }}>Chat mode coming soon</h2>
                <p style={{ fontSize: '15px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
                  Select a folder, choose Chat or Code mode, and start building with AI assistance.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <aside style={{
                width: '280px',
                flexShrink: 0,
                borderRight: '1px solid rgba(20, 20, 20, 0.08)',
                background: '#efece6',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(20, 20, 20, 0.08)',
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#666666',
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
                    color: '#666666',
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
                    color: '#666666',
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
                            <ChevronRight size={12} style={{ color: '#666666', marginRight: '6px' }} />
                            <FolderOpen size={14} style={{ color: '#d4a853', marginRight: '8px' }} />
                            <span style={{ fontSize: '13px', color: '#666666' }}>{item.name}</span>
                          </>
                        ) : (
                          <>
                            <FileText size={14} style={{ color: '#666666', marginRight: '8px' }} />
                            <span style={{ fontSize: '13px', color: '#666666' }}>{item.name}</span>
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
                  borderBottom: '1px solid rgba(20, 20, 20, 0.08)',
                  background: '#efece6',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: '#ffffff',
                      border: '1px solid rgba(20, 20, 20, 0.08)',
                      fontSize: '12px',
                      color: '#666666',
                    }}>
                      <FileText size={12} />
                      main.tsx
                    </span>
                    <span style={{ fontSize: '11px', color: '#666666' }}>TypeScript</span>
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
                      background: 'rgba(20, 20, 20, 0.05)',
                      color: '#666666',
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
                      background: 'rgba(20, 20, 20, 0.05)',
                      color: '#666666',
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
                  <pre style={{ margin: 0, color: '#141414' }}>
                    <code>{codeContent}</code>
                  </pre>
                </div>
                {/* Inline AI Prompt Box */}
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid rgba(20, 20, 20, 0.08)',
                  background: 'rgba(20, 20, 20, 0.02)',
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
                        borderRadius: '16px',
                        border: '1px solid rgba(20, 20, 20, 0.08)',
                        background: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        padding: '12px 16px',
                        color: '#141414',
                        fontFamily: 'Inter, sans-serif',
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
                        borderRadius: '9999px',
                        border: 'none',
                        background: inputValue.trim() && !isSending ? '#0f7685' : 'rgba(20, 20, 20, 0.05)',
                        color: inputValue.trim() && !isSending ? '#efece6' : '#666666',
                        cursor: inputValue.trim() && !isSending ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        boxShadow: inputValue.trim() && !isSending ? '0 4px 14px rgba(15, 118, 133, 0.3)' : 'none',
                        flexShrink: 0,
                      }}
                    >
                      <ArrowUp size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Chat Panel (Right) */}
              <aside style={{
                width: '360px',
                flexShrink: 0,
                borderLeft: '1px solid rgba(20, 20, 20, 0.08)',
                background: '#efece6',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderBottom: '1px solid rgba(20, 20, 20, 0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(15, 118, 133, 0.1)',
                      border: '1px solid rgba(15, 118, 133, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Zap size={14} style={{ color: '#0f7685' }} />
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#141414' }}>QCode AI</span>
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
                    color: '#666666',
                    cursor: 'pointer',
                  }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  <div style={{
                    color: '#666666',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    marginBottom: '16px',
                  }}>
                    <strong style={{ color: '#141414' }}>Ready to help.</strong> I can write, refactor, debug, and explain code in your project. What would you like to do?
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { icon: Zap, label: "Generate component", desc: "Create a new React component" },
                      { icon: Shield, label: "Add error handling", desc: "Wrap functions with try/catch" },
                      { icon: GitBranch, label: "Refactor to hooks", desc: "Convert class components" },
                      { icon: Code, label: "Write tests", desc: "Generate unit tests for selection" },
                      { icon: Hand, label: "Explain this code", desc: "Get a detailed explanation" },
                    ].map((item, i) => (
                      <button key={i} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(20, 20, 20, 0.08)',
                        background: '#ffffff',
                        color: '#666666',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(15, 118, 133, 0.1)',
                          border: '1px solid rgba(15, 118, 133, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <item.icon size={14} style={{ color: '#0f7685' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '13px', color: '#141414' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666666', marginTop: '2px' }}>
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
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
                borderRadius: '16px',
                background: '#efece6',
                border: '1px solid rgba(20, 20, 20, 0.08)',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(20, 20, 20, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#0f7685',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FolderOpen size={18} style={{ color: '#efece6' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#141414' }}>
                      Select project folder
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666666' }}>
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
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#666666',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '400px' }}>
                <div style={{
                  marginBottom: '16px',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(15, 118, 133, 0.2)',
                  background: 'rgba(15, 118, 133, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: '#0f7685',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FolderOpen size={20} style={{ color: '#efece6' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#141414' }}>Hey Project</div>
                    <div style={{ fontSize: '12px', color: '#666666' }}>C:\Users\DELL\Documents\hey</div>
                  </div>
                  <button style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    border: 'none',
                    background: '#0f7685',
                    color: '#efece6',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}>
                    Select
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#666666', marginBottom: '12px' }}>Recent folders</p>
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
                      borderRadius: '8px',
                      border: '1px solid rgba(20, 20, 20, 0.08)',
                      background: '#ffffff',
                      color: '#666666',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}>
                      <FolderOpen size={20} style={{ color: '#d4a853' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#141414' }}>{folder.name}</div>
                        <div style={{ fontSize: '11px', color: '#666666' }}>{folder.path}</div>
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
                borderTop: '1px solid rgba(20, 20, 20, 0.08)',
              }}>
                <button
                  onClick={() => setShowFolderPicker(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(20, 20, 20, 0.08)',
                    background: '#ffffff',
                    color: '#666666',
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
/**
 * @file TeacherDashboard.tsx
 * @description Production-grade 3-column dashboard for HEY Teacher Mode.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiquidButton, LiquidCard, LiquidInput } from '../components/ui/LiquidComponents';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function TeacherDashboard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'Welcome to your dashboard. I am ready to help you prepare lessons, generate worksheets, or analyze curriculum.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTool, setActiveTool] = useState<'none' | 'chem' | 'math'>('none');
  
  const [subject, setSubject] = useState('General');
  const [themeColor, setThemeColor] = useState('#9CA3AF');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load subject context from Entry Screen
  useEffect(() => {
    const savedSubject = localStorage.getItem('hey_subject');
    const savedColor = localStorage.getItem('hey_color');
    if (!savedSubject) {
      navigate('/teacher'); // Kick back to entry if no subject
      return;
    }
    setSubject(savedSubject);
    if (savedColor) setThemeColor(savedColor);
  }, [navigate]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response (This will connect to your API later)
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: `Here is the ${subject} material you requested. I have formatted it according to your curriculum guidelines.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-[#0A0B0F] text-[#F5F6F8] font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <div className="w-[280px] border-r border-[#2A2D35] bg-[#131419] flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black" style={{ backgroundColor: themeColor }}>
            {subject.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm font-bold">{subject} Mode</h2>
            <p className="text-xs text-[#9CA3AF]">Teacher Workspace</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2 px-2">Tools</p>
          <LiquidButton 
            className={`text-left justify-start ${activeTool === 'chem' ? 'border-[#4A9EFF]' : ''}`}
            onClick={() => setActiveTool(activeTool === 'chem' ? 'none' : 'chem')}
          >
            🧪 Chemistry Tools
          </LiquidButton>
          <LiquidButton 
            className={`text-left justify-start ${activeTool === 'math' ? 'border-[#4A9EFF]' : ''}`}
            onClick={() => setActiveTool(activeTool === 'math' ? 'none' : 'math')}
          >
            📐 Math Tools
          </LiquidButton>
          <LiquidButton className="text-left justify-start">📝 Lesson Planner</LiquidButton>
        </div>

        <LiquidButton onClick={() => { localStorage.clear(); navigate('/teacher'); }} className="mt-auto border-red-900 text-red-400 hover:border-red-500">
          End Session
        </LiquidButton>
      </div>

      {/* CENTER CANVAS (CHAT) */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#2A2D35] flex items-center justify-between px-6 bg-[#0A0B0F]/80 backdrop-blur-md z-10">
          <h1 className="font-semibold text-lg">{activeTool !== 'none' ? 'Tool Workspace' : 'HEY Assistant'}</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-[#9CA3AF]">Connected</span>
          </div>
        </header>

        {/* Tool Overlay (If active) */}
        {activeTool !== 'none' && (
          <div className="absolute top-16 left-0 right-0 bottom-0 bg-[#0A0B0F]/95 backdrop-blur-xl z-20 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{activeTool === 'chem' ? 'Chemistry Tools' : 'Math Tools'}</h2>
              <LiquidButton onClick={() => setActiveTool('none')}>Close Tool</LiquidButton>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <LiquidCard>
                <h3 className="font-bold mb-2">Worksheet Generator</h3>
                <p className="text-sm text-[#9CA3AF] mb-4">Create a standard-compliant worksheet.</p>
                <LiquidButton>Generate</LiquidButton>
              </LiquidCard>
              <LiquidCard>
                <h3 className="font-bold mb-2">{activeTool === 'chem' ? 'Equation Editor' : 'Graph Plotter'}</h3>
                <p className="text-sm text-[#9CA3AF] mb-4">Interactive tool for visual learning.</p>
                <LiquidButton>Open Editor</LiquidButton>
              </LiquidCard>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <div 
                className={`p-4 rounded-xl ${msg.role === 'user' ? 'bg-[#2A2D35] text-white rounded-br-none' : 'bg-[#131419] border border-[#2A2D35] text-[#F5F6F8] rounded-bl-none'}`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-[#6B7280] mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="self-start items-start flex flex-col">
              <div className="p-4 rounded-xl bg-[#131419] border border-[#2A2D35] rounded-bl-none flex gap-1">
                <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[#9CA3AF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#2A2D35] bg-[#0A0B0F]">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <LiquidInput 
              placeholder={`Ask HEY about ${subject}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <LiquidButton onClick={handleSend} disabled={!input.trim() || isTyping}>
              Send
            </LiquidButton>
          </div>
        </div>
      </div>

      {/* RIGHT RAIL (Context) */}
      <div className="w-[320px] border-l border-[#2A2D35] bg-[#131419] p-4 shrink-0 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Context</h3>
        
        <LiquidCard>
          <h4 className="font-bold text-sm mb-2">Active Subject</h4>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
            <p className="text-sm text-[#F5F6F8]">{subject}</p>
          </div>
        </LiquidCard>

        <LiquidCard>
          <h4 className="font-bold text-sm mb-2">Session Info</h4>
          <ul className="text-xs text-[#9CA3AF] space-y-2">
            <li>Status: Active</li>
            <li>Mode: Teacher</li>
            <li>Context: Curriculum-Aligned</li>
          </ul>
        </LiquidCard>
      </div>
    </div>
  );
}
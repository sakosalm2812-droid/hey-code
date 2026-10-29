'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/utils';
import { MODES, MODE_IDS } from '@/lib/modes';
import { PERSONALITIES, PERSONALITY_IDS, STYLES } from '@/lib/personality';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Send, 
  Mic, 
  MicOff, 
  FileText, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Copy, 
  Check,
  Loader2,
  Square,
  Sparkles,
  Volume2,
  ChevronDown,
  Image as ImageIcon,
  Paperclip,
  Mic2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceInput } from '@/components/chat/voice-input';
import { FileUpload } from '@/components/chat/file-upload';
import { ImageGenerator } from '@/components/chat/image-generator';
import { Markdown } from '@/components/chat/markdown';
import { stopSpeaking, shortSpokenReply, enqueueSpeech, newCompleteSentences, extractSentences } from '@/lib/speech';
import { tryDispatchCommand } from '@/lib/terminal/command-router';

const models = [
  { value: 'GPT_4O', label: 'GPT-4o', description: 'Most capable model' },
  { value: 'GPT_4O_MINI', label: 'GPT-4o-mini', description: 'Fast & efficient' },
  { value: 'GPT_4_TURBO', label: 'GPT-4 Turbo', description: 'High performance' },
  { value: 'CLAUDE_3_OPUS', label: 'Claude 3 Opus', description: 'Most intelligent' },
  { value: 'CLAUDE_3_SONNET', label: 'Claude 3 Sonnet', description: 'Balanced' },
  { value: 'CLAUDE_3_HAIKU', label: 'Claude 3 Haiku', description: 'Fastest' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  model?: string;
  createdAt: Date;
  attachments?: Array<{ name: string; type: string; url: string }>;
  images?: Array<{ url: string; prompt: string }>;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  const isNew = chatId === 'new';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('GPT_4O_MINI');
  const [mode, setMode] = useState('DEFAULT');
  const [personality, setPersonality] = useState('WARM');
  const [style, setStyle] = useState('CLEAR');
  const [agentId, setAgentId] = useState<string | undefined>(undefined);
  const [agents, setAgents] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatTitle, setChatTitle] = useState('');
  const [historyLoading, setHistoryLoading] = useState(!isNew);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyReload, setHistoryReload] = useState(0);
  const spokenTTSRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await fetch(`/api/chat/${chatId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          let message = `Failed to load chat history (${res.status})`;
          try {
            const body = await res.json();
            if (body?.error) message = body.error;
          } catch {}
          throw new Error(message);
        }
        const data = await res.json();
        if (cancelled || !data?.chat) return;

        setChatTitle(data.chat.title);
        if (data.chat.model) setModel(data.chat.model);
        setMessages(
          (data.chat.messages || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            tokens: m.tokens,
            model: m.model ?? undefined,
            createdAt: new Date(m.createdAt),
          }))
        );
      } catch (err) {
        if (!cancelled) setHistoryError(err instanceof Error ? err.message : 'Failed to load chat history');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [chatId, isNew, historyReload]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/agents')
      .then((res) => (res.ok ? res.json() : Promise.resolve({ agents: [] })))
      .then((data) => {
        if (cancelled) return;
        setAgents(data.agents || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    // The unified command router intercepts prefixed terminal commands (>, !, /)
    // before they ever reach the chat model, keeping every input in one pipeline.
    if (await tryDispatchCommand(input)) {
      setInput('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          model,
          agentId,
          mode,
          personality,
          style,
          chatId: isNew ? undefined : chatId,
        }),
      });

      if (!res.ok) {
        let message = `Request failed with status ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {}
        throw new Error(message);
      }

      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };

      spokenTTSRef.current = '';
      setMessages(prev => [...prev, assistantMessage]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const processBuffer = () => {
        let eventEnd = buffer.indexOf('\n\n');
        while (eventEnd !== -1) {
          const rawEvent = buffer.slice(0, eventEnd);
          buffer = buffer.slice(eventEnd + 2);

          const dataLine = rawEvent.split('\n').find(line => line.startsWith('data: '));
          if (dataLine) {
            let data: Record<string, unknown>;
            try {
              data = JSON.parse(dataLine.slice(6));
            } catch {
              data = {};
            }

            if (data.error) {
              throw new Error(typeof data.error === 'string' ? data.error : 'Failed to generate response');
            }
            if (data.chunk) {
              assistantMessage.content += String(data.chunk);
              setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...m, content: assistantMessage.content } : m));

              if (spokenReplies) {
                const next = newCompleteSentences(assistantMessage.content, spokenTTSRef.current);
                if (next) {
                  spokenTTSRef.current = (spokenTTSRef.current + ' ' + next).trim();
                  enqueueSpeech(next);
                }
              }
            }
            if (data.done) {
              if (spokenReplies && assistantMessage.content.trim()) {
                const remaining = extractSentences(assistantMessage.content)
                  .join(' ')
                  .slice(spokenTTSRef.current.length)
                  .trim();
                if (remaining) enqueueSpeech(shortSpokenReply(remaining));
              }
              if (isNew && data.chatId) {
                router.push(`/dashboard/chats/${String(data.chatId)}`);
                router.refresh();
              }
            }
          }

          eventEnd = buffer.indexOf('\n\n');
        }
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          processBuffer();
          if (controller.signal.aborted) break;
        }

        buffer += decoder.decode();
        processBuffer();
      }
    } catch (error) {
      if (controller.signal.aborted) {
        // User stopped generation — keep the partial response as-is.
      } else {
        console.error('Failed to send message:', error);
        setMessages(prev => prev.slice(0, -1));
        if (currentInput) setInput(currentInput);
        setError(error instanceof Error && error.message ? error.message : 'Failed to send message');
      }
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    stopSpeaking();
    abortControllerRef.current?.abort();
  };

  const [activeTool, setActiveTool] = useState<'voice' | 'files' | 'images' | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [spokenReplies, setSpokenReplies] = useState(false);

  const handleVoiceTranscript = (text: string) => {
    setInput(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleUserSpeech = () => {
    stopSpeaking();
  };

  const handleFilesChange = (files: File[]) => {
    setAttachments(files);
    if (files.length > 0) {
      setActiveTool('files');
    }
  };

  const handleImageGenerated = (image: { url: string; prompt: string }) => {
    setInput(prev => prev + (prev ? '\n\n' : '') + `[Generated Image: ${image.prompt}](${image.url})`);
    setActiveTool(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex-1">
              {isNew ? (
                <input
                  type="text"
                  placeholder="Untitled chat"
                  className="bg-transparent border-none text-xl font-semibold w-full focus:outline-none"
                  defaultValue="New Chat"
                />
              ) : (
                <h1 className="text-xl font-semibold truncate">{chatTitle || 'Chat Title'}</h1>
              )}
              <p className="text-sm text-muted-foreground">
                {model} · {messages.length} messages
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={agentId ?? 'none'} onValueChange={(v) => setAgentId(v === 'none' ? undefined : v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_IDS.map(id => (
                    <SelectItem key={id} value={id}>
                      <div className="flex flex-col">
                        <span>{MODES[id].label}</span>
                        <span className="text-xs text-muted-foreground">{MODES[id].description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="w-[118px]">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex flex-col">
                        <span>{s.label}</span>
                        <span className="text-xs text-muted-foreground">{s.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={personality} onValueChange={setPersonality}>
                <SelectTrigger className="w-[118px]">
                  <SelectValue placeholder="Voice" />
                </SelectTrigger>
                <SelectContent>
                  {PERSONALITY_IDS.map(id => (
                    <SelectItem key={id} value={id}>
                      <div className="flex flex-col">
                        <span>{PERSONALITIES[id].label}</span>
                        <span className="text-xs text-muted-foreground">{PERSONALITIES[id].description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex flex-col">
                        <span>{m.label}</span>
                        <span className="text-xs text-muted-foreground">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider><Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={spokenReplies ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSpokenReplies(v => { if (v) stopSpeaking(); return !v; })}
                    aria-label="Toggle spoken replies"
                    aria-pressed={spokenReplies}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Spoken replies: {spokenReplies ? 'on' : 'off'}</TooltipContent>
              </Tooltip></TooltipProvider>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 ? (
              historyLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 mb-4 animate-spin opacity-50" />
                  <p className="text-sm">Loading conversation...</p>
                </div>
              ) : isNew ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Sparkles className="h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                  <p className="max-w-xs">Ask me anything - code, writing, analysis, creative tasks, or just chat.</p>
                  <div className="mt-6 flex flex-wrap gap-2 justify-center text-sm">
                    {['Write a React component', 'Explain quantum computing', 'Debug this Python code', 'Plan a marketing campaign'].map((suggestion, i) => (
                      <Button key={i} variant="outline" size="sm" onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}>
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : historyError ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <h3 className="text-lg font-medium mb-2">Unable to load this chat</h3>
                  <p className="max-w-xs text-sm">{historyError}</p>
                  <Button variant="outline" size="sm" className="mt-6" onClick={() => setHistoryReload(k => k + 1)}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Sparkles className="h-16 w-16 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Empty conversation</h3>
                  <p className="max-w-xs text-sm">No messages here yet. Send the first message below.</p>
                </div>
              )
            ) : (
              messages.map((message) => (
                <div key={message.id} className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : '')}>
                  <div className={cn('flex-1 max-w-[85%]', message.role === 'user' ? 'text-right' : '')}>
                    <div className={cn(
                        'inline-block rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      )}>
                        {message.role === 'user' ? (
                          <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        ) : (
                          <Markdown content={message.content} className="min-w-0" />
                        )}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((att, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-background/50 rounded">📎 {att.name}</span>
                          ))}
                        </div>
                      )}
                      {message.images && message.images.length > 0 && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {message.images.map((img, i) => (
                            <img key={i} src={img.url} alt={img.prompt} className="rounded max-h-48 object-cover" />
                          ))}
                        </div>
                      )}
                      {message.tokens && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground/70">
                          <span>{message.tokens} tokens</span>
                          {message.model && <span>· {message.model}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
            {streaming && (
              <div className="flex gap-3">
                <div className="flex-1 max-w-[85%]">
                  <div className="inline-block rounded-2xl bg-muted rounded-tl-sm px-4 py-3 animate-pulse">
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                    <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mt-2" />
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {activeTool && (
            <div className="border-t bg-muted/30 p-4 animate-slide-up">
              <Tabs value={activeTool} onValueChange={(v) => setActiveTool(v as any)} className="w-full max-w-2xl mx-auto">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="voice"><Mic2 className="h-4 w-4 mr-2" /> Voice</TabsTrigger>
                  <TabsTrigger value="files"><Paperclip className="h-4 w-4 mr-2" /> Files</TabsTrigger>
                  <TabsTrigger value="images"><ImageIcon className="h-4 w-4 mr-2" /> Images</TabsTrigger>
                </TabsList>
                <TabsContent value="voice">
                  <VoiceInput onTranscript={handleVoiceTranscript} onSpeech={handleUserSpeech} disabled={streaming} />
                </TabsContent>
                <TabsContent value="files">
                  <FileUpload onFilesChange={handleFilesChange} maxFiles={5} disabled={streaming} />
                </TabsContent>
                <TabsContent value="images">
                  <ImageGenerator onImageGenerated={handleImageGenerated} disabled={streaming} />
                </TabsContent>
              </Tabs>
              <Button variant="ghost" size="sm" className="w-full max-w-2xl mx-auto mt-2" onClick={() => setActiveTool(null)}>
                Close
              </Button>
            </div>
          )}

          {error && (
            <div className="border-t px-4 py-3 bg-destructive/10 text-sm text-destructive">
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 font-medium underline underline-offset-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant={activeTool === 'files' ? 'default' : 'outline'}
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setActiveTool(activeTool === 'files' ? null : 'files')}
                disabled={streaming}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant={activeTool === 'images' ? 'default' : 'outline'}
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setActiveTool(activeTool === 'images' ? null : 'images')}
                disabled={streaming}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant={activeTool === 'voice' ? 'default' : 'outline'}
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setActiveTool(activeTool === 'voice' ? null : 'voice')}
                disabled={streaming}
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message HEY..."
                className="flex-1 min-h-[44px] max-h-48 px-4 py-3 text-base bg-background border border-input rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={1}
                disabled={streaming}
              />
              {streaming ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={handleStop}
                  aria-label="Stop generating"
                >
                  <Square className="h-5 w-5" />
                </Button>
              ) : (
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!input.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
    </div>
  );
}
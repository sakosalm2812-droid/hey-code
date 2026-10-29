'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Volume2, VolumeX, Square, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startMicMonitor, MicMonitor, isEnergyAbove } from '@/lib/audio';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
  item(i: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  item(i: number): SpeechRecognitionResult;
  [i: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition) => void) | null;
  onend: ((this: SpeechRecognition) => void) | null;
  onerror: ((this: SpeechRecognition, event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  onSpeech?: () => void;
  muted?: boolean;
  continuousMode?: boolean;
  wakeWord?: string;
  disabled?: boolean;
  language?: string;
}

const RECOGNITION_RETRIABLE_ERRORS = ['audio-capture', 'no-speech', 'aborted', 'network', 'service-not-allowed'];

export function VoiceInput({
  onTranscript,
  onInterim,
  onSpeech,
  muted = false,
  continuousMode = true,
  wakeWord,
  disabled,
  language = 'en-US',
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isHandsFree, setIsHandsFree] = useState(continuousMode);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(16).fill(0));
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const monitorRef = useRef<MicMonitor | null>(null);
  const rmsRef = useRef(0);
  const currentTextRef = useRef('');
  const clampedRef = useRef(false);

  const applyWakeWord = useCallback(
    (text: string): string | null => {
      if (!wakeWord || !wakeWord.trim()) return text.trim();
      const prefix = wakeWord.trim().toLowerCase();
      const lower = text.trim().toLowerCase();
      if (lower.startsWith(prefix)) {
        return text.trim().slice(prefix.length).trim();
      }
      return null;
    },
    [wakeWord]
  );

  const handleFinal = useCallback(
    (raw: string) => {
      if (!raw.trim()) return;

      const text = clampedRef.current
        ? applyWakeWord(raw)
        : raw.trim();
      if (text === null) return;
      clampedRef.current = false;

      onTranscript(text);
      currentTextRef.current = '';
    },
    [applyWakeWord, onTranscript]
  );

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      onInterim?.('');
      return;
    }

    setIsSupported(true);

    let disposed = false;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    let startRequested = false;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognitionRef.current = recognition;

    const stopRecognition = () => {
      recognition.stop();
    };

    const scheduleRestart = (delay: number) => {
      if (disposed) return;
      if (restartTimer) clearTimeout(restartTimer);
      restartTimer = setTimeout(() => {
        if (disposed || isMuted) return;
        try {
          recognition.start();
          startRequested = true;
        } catch {}
      }, delay);
    };

    recognition.onstart = () => {
      startRequested = false;
      if (disposed) return;
      setIsListening(true);
      setError(null);
      if (!isMuted) {
        setCurrentLevelRms(0);
      }
    };

    recognition.onend = () => {
      if (disposed) return;
      setIsListening(false);
      if (!isMuted && startRequested) {
        scheduleRestart(350);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (disposed) return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission was denied');
        setIsListening(false);
        return;
      }
      if (RECOGNITION_RETRIABLE_ERRORS.includes(event.error) && !isMuted) {
        setError(event.error);
        scheduleRestart(400);
      } else if (event.error === 'no-speech') {
        setError('No speech detected');
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isMuted) return;
      let finalText = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      const combined = (finalText + ' ' + interim).trim();
      if (combined) onInterim?.(combined);

      if (finalText.trim()) {
        handleFinal(finalText);
      }
    };

    const startListening = () => {
      if (isMuted) return;
      try {
        recognition.start();
        startRequested = true;
      } catch (e) {
        setError('Failed to start recognition');
      }
    };

    const stopListening = () => {
      stopRecognition();
      onInterim?.('');
    };

    (window as any).__voiceStart = startListening;
    (window as any).__voiceStop = stopListening;

    return () => {
      disposed = true;
      if (restartTimer) clearTimeout(restartTimer);
      try {
        recognition.abort();
      } catch {}
      recognitionRef.current = null;
      (window as any).__voiceStart = undefined;
      (window as any).__voiceStop = undefined;
    };
  }, [language, isMuted, handleFinal, applyWakeWord, onInterim, onTranscript]);

  useEffect(() => {
    setIsMuted(muted);
  }, [muted]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const setup = async () => {
      try {
        const monitor = await startMicMonitor();
        if (monitorRef.current) monitorRef.current.cleanup();
        monitorRef.current = monitor;

        interval = setInterval(() => {
          const rms = monitor.level();
          rmsRef.current = rms;
          setLevel(rms);
          const freq = monitor.getFrequencyData();
          const step = Math.max(1, Math.floor(freq.length / 16));
          const nextBars: number[] = [];
          for (let i = 0; i < 16; i++) {
            const slice = Array.from(freq.slice(i * step, (i + 1) * step));
            nextBars.push(
              Math.min(1, (slice.reduce((a, b) => a + b, 0) / Math.max(1, slice.length)) / 255)
            );
          }
          setBars(nextBars);
        }, 80);
      } catch {
        setError('Microphone unavailable');
      }
    };

    setup();

    return () => {
      if (interval) clearInterval(interval);
      monitorRef.current?.cleanup();
      monitorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isMuted || !onSpeech) return;
    const poll = setInterval(() => {
      if (isEnergyAbove(monitorRef.current, 0.12)) onSpeech();
    }, 180);
    return () => clearInterval(poll);
  }, [isMuted, onSpeech]);

  const setCurrentLevelRms = (v: number) => {
    rmsRef.current = v;
  };

  useEffect(() => {
    if (isMuted) {
      setLevel(0);
      setBars(Array(16).fill(0));
      onInterim?.('');
      try {
        recognitionRef.current?.stop();
      } catch {}
    }
    if (!isHandsFree && !isMuted) {
      try {
        recognitionRef.current?.stop();
      } catch {}
    }
  }, [isMuted, isHandsFree, onInterim]);

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        disabled
        title="Voice input not supported in this browser"
      >
        <MicOff className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  const toggleMute = () => {
    setIsMuted(m => !m);
    if (!isMuted) {
      try {
        recognitionRef.current?.stop();
      } catch {}
    }
  };

  const toggleHandsFree = () => {
    setIsHandsFree(hf => {
      const next = !hf;
      if (next && !isMuted) {
        try {
          recognitionRef.current?.start();
        } catch {}
      }
      return next;
    });
  };

  const endSession = () => {
    setIsMuted(true);
    try {
      recognitionRef.current?.abort();
    } catch {}
    monitorRef.current?.cleanup();
    monitorRef.current = null;
    setLevel(0);
    setBars(Array(16).fill(0));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={isListening ? 'default' : 'outline'}
          size="icon"
          className={cn('h-10 w-10 transition-colors', isListening && 'bg-primary text-primary-foreground animate-pulse')}
          onClick={() => {
            if (isListening) {
              try {
                recognitionRef.current?.stop();
              } catch {}
            } else {
              try {
                recognitionRef.current?.start();
                setIsMuted(false);
              } catch {
                setError('Failed to start recognition');
              }
            }
          }}
          disabled={disabled}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          aria-pressed={isListening}
        >
          {isListening ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          variant={isMuted ? 'default' : 'outline'}
          size="icon"
          className="h-10 w-10"
          onClick={toggleMute}
          disabled={disabled}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          aria-pressed={isMuted}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>

        <Button
          variant={isHandsFree ? 'default' : 'outline'}
          size="sm"
          className="h-10 gap-1.5"
          onClick={toggleHandsFree}
          disabled={disabled}
          aria-pressed={isHandsFree}
        >
          <Radio className={cn('h-4 w-4', isHandsFree && 'animate-pulse')} />
          Hands-free
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-1.5 select-none touch-none"
          disabled={disabled}
          aria-label="Push to talk (hold)"
          onPointerDown={() => {
            if (!isHandsFree && !isMuted) {
              try {
                recognitionRef.current?.start();
              } catch {}
            }
          }}
          onPointerUp={() => {
            if (!isListening) return;
            try {
              recognitionRef.current?.stop();
            } catch {}
          }}
          onPointerLeave={() => {
            if (isListening) {
              try {
                recognitionRef.current?.stop();
              } catch {}
            }
          }}
        >
          <Mic className="h-4 w-4" />
          Push-to-talk
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={endSession}
          disabled={disabled}
          aria-label="End voice session"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-end h-10 gap-[3px]">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-primary/70 transition-all duration-75"
            style={{ height: `${Math.max(6, b * 100)}%` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(2, level * 180))}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(level * 100)}%</span>
      </div>

      {isListening && (
        <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground animate-fade-in">
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-destructive animate-pulse align-middle" />
          Listening...
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive px-3 py-2 text-xs text-destructive animate-fade-in">
          Error: {error}
        </div>
      )}
    </div>
  );
}

export default VoiceInput;
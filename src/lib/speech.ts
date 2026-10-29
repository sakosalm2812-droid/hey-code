'use client';

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function sanitizeForSpeech(text: string): string {
  let out = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>]+/g, ' ')
    .replace(/[|]/g, ',')
    .replace(/\bn\s*b\s*/gi, ' ');
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

export function shortSpokenReply(text: string, maxSentences = 2, maxChars = 280): string {
  const cleaned = sanitizeForSpeech(text);
  if (!cleaned) return cleaned;
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  let short = sentences.slice(0, maxSentences).join(' ').trim();
  if (short.length > maxChars) {
    short = short.slice(0, maxChars).trim();
    if (short.length > 0 && !/[.!?]$/.test(short)) short += '...';
  }
  return short;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  preferEnglishVoice?: boolean;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;
let cancelled = false;

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSynthesisSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  currentUtterance = null;
  cancelled = false;

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.rate = options.rate ?? 1;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;

  const voices = synth.getVoices();
  if (voices.length > 0) {
    const voiceWithLocal = (v: SpeechSynthesisVoice) => (v as SpeechSynthesisVoice & { isLocalDefault?: boolean }).isLocalDefault;
    const en = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    const selected = options.preferEnglishVoice
      ? en ?? (voices.find(voiceWithLocal) ?? voices[0])
      : voices.find(voiceWithLocal) ?? en ?? voices[0];
    if (selected) utterance.voice = selected;
  }

  utterance.onend = () => {
    currentUtterance = null;
  };
  utterance.onerror = () => {
    if (!cancelled) currentUtterance = null;
  };

  currentUtterance = utterance;
  synth.speak(utterance);
}

export function enqueueSpeech(text: string, options: SpeakOptions = {}): void {
  if (!isSpeechSynthesisSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  cancelled = false;

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.rate = options.rate ?? 1;
  utterance.pitch = options.pitch ?? 1;
  utterance.volume = options.volume ?? 1;

  synth.speak(utterance);
}

export function extractSentences(text: string): string[] {
  const cleaned = sanitizeForSpeech(text);
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0 && cleaned.length > 0) return [cleaned];
  return sentences;
}

export function newCompleteSentences(fullText: string, alreadySpokenText: string): string {
  const all = extractSentences(fullText).join(' ');
  const already = alreadySpokenText.trim();
  if (all.length <= already.length) return '';
  const next = all.slice(already.length).trim();
  if (!next) return '';
  const segments = next.match(/^[^.!?]+[.!?]+/) || [];
  return segments[0] ? segments[0].trim() : '';
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  cancelled = true;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking && currentUtterance !== null;
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}
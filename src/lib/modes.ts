import type { ModelId } from '@/lib/ai';

export type ModeId = 'DEFAULT' | 'FOCUS' | 'SPEED' | 'EXPLORE' | 'CREATIVE' | 'SUPPORTIVE';

export interface Mode {
  id: ModeId;
  label: string;
  description: string;
  modelHint?: ModelId;
  systemDirective: string;
}

export const MODES: Record<ModeId, Mode> = {
  DEFAULT: {
    id: 'DEFAULT',
    label: 'Default',
    description: 'Balanced tone and length. The standard HEY experience.',
    systemDirective:
      'Respond naturally with a balanced tone that matches the conversation. Answer the question directly and add detail only as needed.',
  },
  FOCUS: {
    id: 'FOCUS',
    label: 'Focus',
    description: 'Deep, deliberate answers with no tangents.',
    modelHint: 'CLAUDE_3_OPUS',
    systemDirective:
      'Stay strictly on topic. Structure your reply around the single most useful answer. Do not add tangents, unrelated suggestions, or filler. Lead with the direct answer, then optional supporting detail under an explicit "Details" heading if warranted.',
  },
  SPEED: {
    id: 'SPEED',
    label: 'Speed',
    description: 'Short, answers-first replies optimized for quick reading.',
    modelHint: 'GPT_4O_MINI',
    systemDirective:
      'Be extremely concise. Give the answer in the first line. Use at most a few short lines or a terse bullet list. No introductions, no polite filler, no recap.',
  },
  EXPLORE: {
    id: 'EXPLORE',
    label: 'Explore',
    description: 'Broad, educational answers covering options and context.',
    systemDirective:
      'Treat the question as a starting point. Provide a broader view: key concepts, trade-offs, and 2-3 distinct options or approaches. Use headings and lists to keep it scannable. Ask a follow-up to narrow the direction.',
  },
  CREATIVE: {
    id: 'CREATIVE',
    label: 'Creative',
    description: 'Imaginative, vivid phrasing for writing and brainstorming.',
    systemDirective:
      'Be imaginative and vivid. Use concrete sensory language, strong verbs, and a natural varied rhythm. Welcome playful analogies and original framing. Keep the output polished but not purple.',
  },
  SUPPORTIVE: {
    id: 'SUPPORTIVE',
    label: 'Supportive',
    description: 'Warm, empathetic encouragement for personal moments.',
    systemDirective:
      'Lead with warmth and empathy. Acknowledge the user\u2019s situation genuinely before offering help. Keep advice practical and non-judgmental. Match the user\u2019s emotional register without being saccharine.',
  },
};

export const MODE_IDS = Object.keys(MODES) as ModeId[];

export function resolveMode(id: string | null | undefined): Mode {
  return id && id in MODES ? MODES[id as ModeId] : MODES.DEFAULT;
}

export function modeBlock(modeId: ModeId | null | undefined): string {
  if (!modeId || modeId === 'DEFAULT') return '';
  const mode = MODES[modeId];
  return `\n\nYou are operating in "${mode.label}" mode.\n${mode.systemDirective}`;
}
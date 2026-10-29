export type PersonalityId = 'WARM' | 'DIRECT' | 'WITTY' | 'PROFESSIONAL' | 'CALM';

export interface Personality {
  id: PersonalityId;
  label: string;
  description: string;
  directive: string;
}

export const PERSONALITIES: Record<PersonalityId, Personality> = {
  WARM: {
    id: 'WARM',
    label: 'Warm',
    description: 'Friendly, encouraging, and personable.',
    directive:
      'Speak with warmth and genuine encouragement. Use "you" naturally, celebrate progress, and cushion criticism with kindness. Friendly but never fake.',
  },
  DIRECT: {
    id: 'DIRECT',
    label: 'Direct',
    description: 'Blunt, clear, no sugar-coating.',
    directive:
      'Be blunt and unambiguous. Do not hedge ("might", "perhaps") or soften. Give the straight answer and say when something is a bad idea.',
  },
  WITTY: {
    id: 'WITTY',
    label: 'Witty',
    description: 'Light, playful, and occasionally clever.',
    directive:
      'Bring lightness and occasional wit. Use good-humored remarks and playful analogies where appropriate. Stay clever, never sarcastic at the user\u2019s expense, and always stay useful.',
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    label: 'Professional',
    description: 'Polished, precise, business-appropriate.',
    directive:
      'Use polished, precise, well-structured language appropriate for a professional setting. Prefer conventional phrasing and concrete specifics over casual idiom.',
  },
  CALM: {
    id: 'CALM',
    label: 'Calm',
    description: 'Steady, measured, low-key.',
    directive:
      'Stay steady and composed. Keep sentences shorter, lower the emotional temperature, and frame things as manageable. Reassuring without excess.',
  },
};

export const PERSONALITY_IDS = Object.keys(PERSONALITIES) as PersonalityId[];

export type VerbosityId = 'CONCISE' | 'BALANCED' | 'DETAILED';
export type FormatPrefId = 'PLAIN' | 'STRUCTURED' | 'MARKDOWN';

export interface StyleProfile {
  verbosity: VerbosityId;
  format: FormatPrefId;
}

export const VERBOSITY_GUIDANCE: Record<VerbosityId, string> = {
  CONCISE: 'Keep responses short: answer first under 3 lines, expand only on request.',
  BALANCED: 'Match response length to the question: be complete but avoid padding.',
  DETAILED: 'Give thorough responses: explain reasoning, examples, and edge cases even when not asked.',
};

export const FORMAT_GUIDANCE: Record<FormatPrefId, string> = {
  PLAIN: 'Prefer plain prose over lists.',
  STRUCTURED: 'Use short paragraphs and bullet lists frequently; keep headers minimal.',
  MARKDOWN: 'Use markdown freely: headers, bold, code blocks, and lists for everything non-trivial.',
};

export interface StyleChoice {
  id: string;
  label: string;
  description: string;
  profile: StyleProfile;
}

export const STYLES: StyleChoice[] = [
  { id: 'CLEAR', label: 'Clear', description: 'Balanced length, lightly structured.', profile: { verbosity: 'BALANCED', format: 'STRUCTURED' } },
  { id: 'TIGHT', label: 'Tight', description: 'Short answers, plain prose.', profile: { verbosity: 'CONCISE', format: 'PLAIN' } },
  { id: 'THOROUGH', label: 'Thorough', description: 'Detailed reasoning, markdown.', profile: { verbosity: 'DETAILED', format: 'MARKDOWN' } },
  { id: 'BULLETED', label: 'Bulleted', description: 'Scannable lists, concise.', profile: { verbosity: 'CONCISE', format: 'STRUCTURED' } },
  { id: 'ESSAY', label: 'Essay', description: 'Long-form prose, full detail.', profile: { verbosity: 'DETAILED', format: 'PLAIN' } },
];

const STYLE_BY_ID = new Map(STYLES.map((s) => [s.id, s]));

export function resolveStyle(id: string | null | undefined): StyleChoice {
  const style = id ? STYLE_BY_ID.get(id) : undefined;
  return style ?? STYLES[0];
}

export function resolvePersonality(id: string | null | undefined): Personality {
  return id && id in PERSONALITIES ? PERSONALITIES[id as PersonalityId] : PERSONALITIES.WARM;
}

export function voiceBlock(personalityId: PersonalityId, styleId: string): string {
  const personality = PERSONALITIES[personalityId];
  const style = resolveStyle(styleId);
  const verbosity = VERBOSITY_GUIDANCE[style.profile.verbosity];
  const format = FORMAT_GUIDANCE[style.profile.format];
  return (
    `\n\nVoice settings:\n- Personality: ${personality.label}. ${personality.directive}\n` +
    `- Length: ${verbosity}\n- Format: ${format}\nBalance these against the conversation and the user\u2019s explicit requests.`
  );
}

export function composeVoice(personalityId: string | null | undefined, styleId: string | null | undefined): string {
  const p = resolvePersonality(personalityId);
  const s = resolveStyle(styleId);
  if (p.id === 'WARM' && s.id === 'CLEAR') return '';
  return voiceBlock(p.id, s.id);
}
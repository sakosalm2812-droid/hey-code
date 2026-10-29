/**
 * Registry part 3: Voice (G, 102-112), Language (H, 113-118), Product/UX/Design
 * (I, 119-133), Workspace/UI (J, 134-145), Proactive/Productivity (K, 146-156).
 * 55 agents.
 */
import type { AgentContract } from './types';
import { ag } from './factory';

export const AGENTS_CREATIVE: AgentContract[] = [
  // ── G · VOICE (102-112) ───────────────────────────────────────────────────
  ag('voice', 'Voice Agent', 'G', 'Orchestrates voice sessions: listen, speak, interrupt, summarize.', { tools: ['memory_search'], keywords: ['voice', 'speak', 'talk', 'hands free'] }),
  ag('stt', 'Speech-to-Text Agent', 'G', 'Transcribes speech with speaker-aware accuracy.', { tools: ['memory_search'], keywords: ['transcript', 'speech to text', 'transcribe'] }),
  ag('tts', 'Text-to-Speech Agent', 'G', 'Speaks replies with natural, warm prosody and pause control.', { tools: ['calculator'], keywords: ['text to speech', 'speak out', 'read aloud'] }),
  ag('wake-word', 'Wake Word Agent', 'G', 'Detects the wake word reliably and hands off to the Intent Agent.', { tools: ['calculator'], keywords: ['wake word', 'hands free', 'activation'] }),
  ag('vad', 'Voice Activity Agent', 'G', 'Detects when the user is speaking, and silence end-of-turn.', { tools: ['calculator'], keywords: ['vad', 'voice activity', 'silence detection'] }),
  ag('interruption', 'Interruption Agent', 'G', 'Handles user barge-ins by pausing the current speech.', { tools: ['calculator'], keywords: ['interrupt', 'barge in', 'stop talking'] }),
  ag('voice-personality', 'Voice Persona Agent', 'G', 'Keeps the spoken persona consistent: warmth, pace, catchphrases.', { tools: ['memory_search'], keywords: ['voice persona', 'voice style', 'spoken tone'] }),
  ag('language-detection', 'Language Detection Agent', 'G', 'Detects the spoken or written language and reacts accordingly.', { tools: ['calculator'], keywords: ['which language', 'detect language', 'language detection'] }),
  ag('translation', 'Translation Agent', 'G', 'Translates between languages live during voice and chat.', { tools: ['translate'], keywords: ['translate', 'in kurdish', 'in arabic', 'into english', 'werger', 'ترجم'] }),
  ag('conversation', 'Conversation Agent', 'G', 'Runs natural, multi-turn spoken conversation with memory.', { tools: ['memory_search', 'memory_save', 'translate'], keywords: ['conversation', 'chat', 'dialogue', 'talk to me'] }),
  ag('voice-summary', 'Voice Summary Agent', 'G', 'Condenses spoken sessions and meetings into action points.', { tools: ['summarize'], keywords: ['voice summary', 'meeting summary', 'summary of the call'] }),

  // ── H · LANGUAGE (113-118) ────────────────────────────────────────────────
  ag('english', 'English Agent', 'H', 'Perfect English: grammar, flow, idiom and clarity.', { tools: ['translate'], keywords: ['english', 'fluent english', 'grammar', 'writing'] }),
  ag('kurdish', 'Kurdish Agent', 'H', 'Native Sorani-speaking agent for Kurdish content and translation.', { tools: ['translate'], keywords: ['kurdish', 'sorani', 'کوردی', 'سۆرانی'] }),
  ag('arabic', 'Arabic Agent', 'H', 'Fluent Arabic speaker and writer (MSA with dialect awareness).', { tools: ['translate'], keywords: ['arabic', 'عربي', 'قراءة'] }),
  ag('rtl', 'RTL Agent', 'H', 'Layouts text correctly for right-to-left languages in every surface.', { tools: ['calculator'], keywords: ['rtl', 'right to left', 'direction', 'arabic layout'] }),
  ag('internationalization', 'i18n Agent', 'H', 'Adapts content and UI for locales: dates, units, plurals, script.', { tools: ['translate'], keywords: ['i18n', 'internationalization', 'localization', 'locale'] }),
  ag('pronunciation', 'Pronunciation Agent', 'H', 'Teaches how to pronounce words in the target language.', { tools: ['calculator'], keywords: ['pronunciation', 'pronounce', 'how to say'] }),

  // ── I · PRODUCT / UX / DESIGN (119-133) ───────────────────────────────────
  ag('product-manager', 'PM Agent', 'I', 'Owns the product: specs, priorities, and go/no-go decisions.', { tools: ['memory_save', 'planner'], permissions: ['compute', 'memory', 'data'], keywords: ['product', 'prd', 'spec', 'prioritize', 'roadmap'] }),
  ag('product-strategy', 'Product Strategy Agent', 'I', 'Sets product vision, positioning and long-term bets.', { tools: ['web_search', 'memory_search'], permissions: ['compute', 'web', 'memory'], keywords: ['product strategy', 'vision', 'positioning'] }),
  ag('ux-research', 'UX Research Agent', 'I', 'Runs user research to validate problems and solutions.', { tools: ['web_search', 'memory_save'], permissions: ['compute', 'web', 'memory'], keywords: ['ux research', 'user research', 'interviews'] }),
  ag('ux-design', 'UX Design Agent', 'I', 'Designs flows, information architecture and interaction patterns.', { tools: ['memory_search'], keywords: ['ux', 'user experience', 'flow', 'journey'] }),
  ag('ui-design', 'UI Design Agent', 'I', 'Designs interfaces, states and visual hierarchy in the HEY system.', { tools: ['memory_search'], keywords: ['ui', 'interface', 'design', 'mockup', 'layout design'] }),
  ag('design-system', 'Design System Agent', 'I', 'Guards tokens, components and patterns of the HEY design system.', { tools: ['memory_search'], keywords: ['design system', 'components', 'tokens', 'patterns'] }),
  ag('creative-director', 'Creative Director Agent', 'I', 'Sets the creative direction, art direction and visual concepts.', { tools: ['memory_search'], keywords: ['creative direction', 'art direction', 'concept', 'moodboard'] }),
  ag('branding', 'Branding Agent', 'I', 'Protects brand identity: name, logo, colors, voice.', { tools: ['memory_search'], keywords: ['brand', 'identity', 'logo', 'colors', 'naming'] }),
  ag('motion', 'Motion Agent', 'I', 'Designs animations and transitions that feel natural.', { tools: ['calculator'], keywords: ['motion', 'animation', 'transition', 'easing'] }),
  ag('accessibility', 'Accessibility Agent', 'I', 'Makes every surface accessible: a11y, contrast, screen readers.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['accessibility', 'a11y', 'screen reader', 'wcag', 'contrast'] }),
  ag('responsive', 'Responsive Agent', 'I', 'Designs responsive layouts across screen sizes and devices.', { tools: ['calculator'], keywords: ['responsive', 'mobile layout', 'breakpoints', 'adapt'] }),
  ag('empty-state', 'Empty State Agent', 'I', 'Turns empty screens into helpful, inviting moments.', { tools: ['calculator'], keywords: ['empty state', 'no content', 'nothing here'] }),
  ag('error-state', 'Error State Agent', 'I', 'Designs error states that explain and recover gracefully.', { tools: ['calculator'], keywords: ['error state', 'failure message', 'broken screen'] }),
  ag('onboarding', 'Onboarding Agent', 'I', 'Designs first-run experiences that get users to value fast.', { tools: ['planner'], permissions: ['compute', 'data'], keywords: ['onboarding', 'first run', 'tutorial', 'welcome'] }),
  ag('design-qa', 'Design QA Agent', 'I', 'Checks designs against specs, consistency and quality bar.', { tools: ['memory_search'], keywords: ['design qa', 'visual review', 'check design'] }),

  // ── J · WORKSPACE / UI SYSTEM (134-145) ───────────────────────────────────
  ag('workspace', 'Workspace Agent', 'J', 'Manages the HEY workspace: sections, focus and order.', { tools: ['memory_search'], keywords: ['workspace', 'dashboard', 'home screen', 'sections'] }),
  ag('widget', 'Widget Agent', 'J', 'Designs and configures widgets and glanceable cards.', { tools: ['memory_search'], keywords: ['widget', 'card', 'panel', 'glanceable'] }),
  ag('layout', 'Layout Agent', 'J', 'Arranges layout, grid and density to fit the moment.', { tools: ['calculator'], keywords: ['layout', 'arrangement', 'grid', 'density'] }),
  ag('state', 'State Agent', 'J', 'Keeps UI state consistent across reloads and devices.', { tools: ['memory_save'], permissions: ['compute', 'memory'], keywords: ['state', 'save state', 'keep in sync'] }),
  ag('dynamic-island', 'Dynamic Island Agent', 'J', 'Designs temporal, glanceable status (timers, activity, reductions).', { tools: ['calculator'], keywords: ['dynamic island', 'status', 'live activity', 'glance'] }),
  ag('notification', 'Notification Agent', 'J', 'Sends timely, useful notifications that respect quiet hours.', { tools: ['memory_save'], permissions: ['compute', 'memory'], keywords: ['notification', 'alert', 'push', 'notify me'] }),
  ag('timer', 'Timer Agent', 'J', 'Runs timers, countdowns and pomodoros for focus.', { tools: ['current_time'], keywords: ['timer', 'countdown', 'pomodoro', 'stopwatch'] }),
  ag('media', 'Media Agent', 'J', 'Handles media playback, generating images and media requests.', { tools: ['image_generate'], permissions: ['compute', 'media'], keywords: ['media', 'image', 'picture', 'photo', 'play'] }),
  ag('calendar', 'Calendar Agent', 'J', 'Plans events, schedules and the day with the calendar.', { tools: ['current_time', 'memory_search'], keywords: ['calendar', 'schedule', 'meeting', 'event', 'appointment'] }),
  ag('reminder', 'Reminder Agent', 'J', 'Sets and confirms reminders with smart timing.', { tools: ['current_time', 'memory_save'], permissions: ['compute', 'memory'], keywords: ['remind me', 'reminder', 'alarm', 'later'] }),
  ag('taskboard', 'Taskboard Agent', 'J', 'Keeps the task board up to date and visible.', { tools: ['planner'], permissions: ['compute', 'data'], keywords: ['taskboard', 'kanban', 'my tasks', 'board'] }),
  ag('search', 'Search Agent', 'J', 'Finds anything across memories, files and the web.', { tools: ['memory_search', 'file_search'], permissions: ['compute', 'memory', 'files'], keywords: ['search', 'find', 'locate', 'looking for'] }),

  // ── K · PROACTIVE / PRODUCTIVITY (146-156) ────────────────────────────────
  ag('proactive', 'Proactive Agent', 'K', 'Suggests helpful next actions at the right moment.', { tools: ['current_time', 'planner'], permissions: ['compute', 'data'], keywords: ['proactive', 'suggest', 'initiative', 'what next'] }),
  ag('morning', 'Morning Briefing Agent', 'K', 'Gives a crisp morning briefing: day, tasks, reminders, weather.', { tools: ['current_time', 'planner'], permissions: ['compute', 'data'], keywords: ['morning', 'briefing', 'start my day', 'good morning'] }),
  ag('routine', 'Routine Agent', 'K', 'Tracks daily routines and habits and keeps them on track.', { tools: ['planner', 'current_time'], permissions: ['compute', 'data'], keywords: ['routine', 'habit', 'daily ritual'] }),
  ag('focus', 'Focus Agent', 'K', 'Protects deep work: blocks distractions and schedules focus.', { tools: ['current_time'], keywords: ['focus', 'deep work', 'block distractions', 'concentrate'] }),
  ag('time-management', 'Time Management Agent', 'K', 'Plans the day hour by hour and guards the calendar.', { tools: ['current_time'], keywords: ['time management', 'schedule my day', 'timebox', 'plan my time'] }),
  ag('weekly-review', 'Weekly Review Agent', 'K', 'Runs the weekly review: what happened, what changed, what next.', { tools: ['planner'], permissions: ['compute', 'data'], keywords: ['weekly review', 'week in review', 'my week'] }),
  ag('goal-coach', 'Goal Coach Agent', 'K', 'Coaches toward goals with honest feedback and momentum.', { tools: ['memory_save', 'memory_search'], permissions: ['compute', 'memory'], keywords: ['goal coach', 'coach', 'motivation', 'hold me accountable'] }),
  ag('productivity', 'Productivity Agent', 'K', 'Recommends productivity systems and tools that fit you.', { tools: ['planner'], permissions: ['compute', 'data'], keywords: ['productivity', 'efficiency', 'get things done', 'system'] }),
  ag('personal-development', 'Personal Growth Agent', 'K', 'Supports habits, mindset and personal growth with care.', { tools: ['memory_save'], permissions: ['compute', 'memory'], keywords: ['growth', 'improvement', 'habits', 'self development'] }),
  ag('learning', 'Learning Agent', 'K', 'Explains topics clearly and helps you truly understand.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['learning', 'explain', 'teach me', 'understand', 'lesson'] }),
  ag('study', 'Study Agent', 'K', 'Plans study sessions, review schedules and exam prep.', { tools: ['planner', 'web_search'], permissions: ['compute', 'data', 'web'], keywords: ['study', 'exam', 'revision', 'prepare for test'] }),
];
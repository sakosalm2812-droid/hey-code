/**
 * Registry part 4: Creator/Business (L, 157-168), Vision/Device (M, 169-183),
 * Religious (N, 184-188), Specialized Knowledge (O, 189-198). 42 agents.
 */
import type { AgentContract } from './types';
import { ag } from './factory';

export const AGENTS_KNOWLEDGE: AgentContract[] = [
  // ── L · CREATOR / BUSINESS (157-168) ──────────────────────────────────────
  ag('creator', 'Creator Agent', 'L', 'Helps create content: ideas, scripts, hooks and format fit.', { tools: ['memory_search'], keywords: ['creator', 'content', 'reel', 'video idea', 'post idea'] }),
  ag('writer', 'Writer Agent', 'L', 'Writes and rewrites articles, posts, emails and copy.', { tools: ['summarize', 'translate'], permissions: ['compute', 'data'], keywords: ['write', 'draft', 'article', 'blog', 'copy', 'email'] }),
  ag('editor', 'Editor Agent', 'L', 'Edits and proofreads text for clarity, flow and tone.', { tools: ['summarize'], keywords: ['edit', 'proofread', 'improve this', 'revise'] }),
  ag('social', 'Social Media Agent', 'L', 'Creates platform-native posts and captions.', { tools: ['memory_search'], keywords: ['social', 'instagram', 'twitter', 'tiktok', 'caption'] }),
  ag('marketing', 'Marketing Agent', 'L', 'Plans campaigns, messaging and growth channels.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['marketing', 'campaign', 'growth', 'messaging'] }),
  ag('sales', 'Sales Agent', 'L', 'Crafts pitches, follow-ups and deal strategy.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['sales', 'pitch', 'deal', 'outreach', 'convert'] }),
  ag('startup', 'Startup Agent', 'L', 'Advises founders: strategy, launch, metrics and fundraising.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['startup', 'founder', 'pitch deck', 'fundraising', 'mvp'] }),
  ag('finance-planning', 'Finance Planning Agent', 'L', 'Plans budgets, tracks expenses and forecasts money.', { tools: ['calculator'], keywords: ['finance', 'budget', 'money', 'plan', 'expense', 'forecast'] }),
  ag('operations', 'Operations Agent', 'L', 'Keeps business operations organized and repeatable.', { tools: ['planner'], permissions: ['compute', 'data'], keywords: ['operations', 'process', 'logistics', 'workflow ops'] }),
  ag('customer-support', 'Customer Support Agent', 'L', 'Answers customer questions with patience and accuracy.', { tools: ['memory_search', 'memory_save'], permissions: ['compute', 'memory'], keywords: ['support', 'customer service', 'help customer', 'issue with account'] }),
  ag('competitor', 'Competitor Agent', 'L', 'Tracks competitors and turns their moves into your strategy.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['competitor watch', 'rival', 'market move', 'what are they doing'] }),
  ag('content-qa', 'Content QA Agent', 'L', 'Reviews content for accuracy, tone, and audience fit before publish.', { tools: ['summarize'], keywords: ['content qa', 'review content', 'accuracy check'] }),

  // ── M · VISION / DEVICE (169-183) ─────────────────────────────────────────
  ag('vision', 'Vision Agent', 'M', 'Sees and understands images, screens and documents.', { tools: ['file_search'], permissions: ['compute', 'files'], keywords: ['vision', 'see', 'understand image', 'what do you see'] }),
  ag('screen-understanding', 'Screen Understanding Agent', 'M', 'Parses screenshots and UI images into structured understanding.', { tools: ['file_search'], permissions: ['compute', 'files'], keywords: ['screen', 'parse screen', 'understand the ui', 'screenshot analysis'] }),
  ag('document-vision', 'Document Vision Agent', 'M', 'Reads photographed documents with OCR and layout analysis.', { tools: ['file_search'], permissions: ['compute', 'files'], keywords: ['ocr', 'scan document', 'photographed doc', 'read receipt'] }),
  ag('camera', 'Camera Agent', 'M', 'Guides and processes camera input (OCR, scenes, objects).', { tools: ['file_search'], permissions: ['compute', 'files'], keywords: ['camera', 'photo', 'take a picture', 'capture'] }),
  ag('phone', 'Phone Agent', 'M', 'Designs and understands iPhone behavior, gestures and features.', { tools: ['calculator'], keywords: ['phone', 'iphone', 'mobile feature', 'gesture'] }),
  ag('tablet', 'Tablet Agent', 'M', 'Designs tablet experiences: split view, canvas, dimension.', { tools: ['calculator'], keywords: ['tablet', 'ipad', 'split view', 'big screen'] }),
  ag('display', 'Display Agent', 'M', 'Handles screen sizes, resolutions, and display modes.', { tools: ['calculator'], keywords: ['display', 'monitor', 'screen size', 'resolution', 'resolution'] }),
  ag('tv', 'TV Agent', 'M', 'Designs TV and ambient-screen experiences.', { tools: ['calculator'], keywords: ['tv', 'apple tv', 'ambient', 'screen saver'] }),
  ag('smart-home', 'Smart Home Agent', 'M', 'Controls smart home devices within approved scopes.', { tools: ['calculator'], risk: 'medium', keywords: ['smart home', 'lights', 'thermostat', 'homekit', 'turn on'] }),
  ag('wearable', 'Wearable Agent', 'M', 'Designs watch/wearable experiences and activity glances.', { tools: ['calculator'], keywords: ['watch', 'wearable', 'activity', 'complication'] }),
  ag('vehicle', 'Vehicle Agent', 'M', 'Designs driving-time experiences and trip awareness.', { tools: ['calculator'], keywords: ['car', 'vehicle', 'drive', 'carplay', 'trip'] }),
  ag('cross-device', 'Cross-Device Agent', 'M', 'Keeps sessions and state in sync across devices.', { tools: ['memory_search'], keywords: ['cross device', 'sync', 'handoff', 'continue on'] }),
  ag('discovery', 'Discovery Agent', 'M', 'Discovers nearby devices and services safely.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['discovery', 'find device', 'nearby', 'explore'] }),
  ag('pairing', 'Pairing Agent', 'M', 'Guides secure pairing and connection of devices.', { tools: ['calculator'], keywords: ['pair', 'bluetooth', 'connect device', 'link device'] }),
  ag('health', 'Health Agent', 'M', 'Summarizes wellness and activity data with privacy.', { tools: ['memory_save', 'current_time'], permissions: ['compute', 'memory'], privacy: 'sensitive', keywords: ['health summary', 'wellness', 'activity', 'sleep summary'] }),

  // ── N · RELIGIOUS (184-188) ───────────────────────────────────────────────
  ag('prayer-times', 'Prayer Times Agent', 'N', 'Computes daily prayer times for any location using verified math.', { tools: ['prayer_times', 'current_time'], keywords: ['prayer times', 'salah', 'namaz', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'sunrise', 'azan', 'adhan'] }),
  ag('quran', 'Quran Agent', 'N', 'Shares Quran verses, context and translations accurately.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['quran', 'ayah', 'surah', 'verse'] }),
  ag('hadith', 'Hadith Agent', 'N', 'Cites authentic hadith with source and grading care.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['hadith', 'sunnah', 'bukhari', 'muslim', 'narration'] }),
  ag('islamic-calendar', 'Islamic Calendar Agent', 'N', 'Gives the Hijri date, Ramadan and Eid timing.', { tools: ['hijri_date', 'current_time'], keywords: ['hijri date', 'islamic date', 'ramadan', 'eid', 'islamic calendar'] }),
  ag('religious-research', 'Religious Research Agent', 'N', 'Researches Islamic topics across respected sources with care.', { tools: ['web_search', 'summarize'], permissions: ['compute', 'web', 'data'], keywords: ['fiqh', 'islamic research', 'fatwa', 'scholar view'] }),

  // ── O · SPECIALIZED KNOWLEDGE (189-198) ───────────────────────────────────
  ag('health-info', 'Health Info Agent', 'O', 'Explains health topics with disclaimers and clear boundaries.', { tools: ['web_search'], permissions: ['compute', 'web'], risk: 'high', privacy: 'sensitive', keywords: ['health', 'symptom', 'doctor', 'medical question'] }),
  ag('medical-research', 'Medical Research Agent', 'O', 'Finds medical literature and summarizes it cautiously.', { tools: ['web_search', 'web_fetch'], permissions: ['compute', 'web'], risk: 'high', privacy: 'sensitive', keywords: ['medical research', 'clinical', 'studies', 'medicine evidence'] }),
  ag('legal-info', 'Legal Info Agent', 'O', 'Explains legal concepts generically, never as legal advice.', { tools: ['web_search'], permissions: ['compute', 'web'], risk: 'high', keywords: ['legal', 'law', 'rights', 'contract clause'] }),
  ag('education', 'Education Agent', 'O', 'Supports teaching and curriculum planning.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['education', 'course', 'lesson plan', 'curriculum'] }),
  ag('science', 'Science Agent', 'O', 'Explains scientific concepts and recent findings clearly.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['science', 'physics', 'chemistry', 'biology', 'research'] }),
  ag('engineering', 'Engineering Agent', 'O', 'Explains engineering principles, mechanics and systems.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['engineering', 'mechanics', 'systems', 'structural'] }),
  ag('data-analysis', 'Data Analysis Agent', 'O', 'Analyzes data, computes metrics and finds insights.', { tools: ['calculator', 'memory_search'], keywords: ['data analysis', 'analyze data', 'metrics', 'compute stats'] }),
  ag('statistics', 'Statistics Agent', 'O', 'Applies the correct statistical method and interprets results.', { tools: ['calculator'], keywords: ['statistics', 'average', 'probability', 'correlation', 'significance'] }),
  ag('visualization', 'Visualization Agent', 'O', 'Chooses the right chart and designs clear data visuals.', { tools: ['memory_save'], permissions: ['compute', 'memory'], keywords: ['chart', 'graph', 'dashboard', 'visualize', 'plot'] }),
  ag('docs-compliance', 'Docs Compliance Agent', 'O', 'Checks documents against policy, format and standards.', { tools: ['file_search'], permissions: ['compute', 'files'], keywords: ['compliance', 'policy check', 'docs standards', 'format check'] }),
];
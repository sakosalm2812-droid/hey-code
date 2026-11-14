// src/engines/guidanceWorld/types.ts
// Engine 12: Guidance World — Type definitions with interfaces

export interface GuidanceType {
  value: 'instruction' | 'tutoring' | 'mentorship';
  label: string;
}

export interface GuidanceStatus {
  value: 'pending' | 'active' | 'completed' | 'paused' | 'cancelled';
  label: string;
}

export interface DifficultyLevel {
  value: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  label: string;
}

export interface GuidanceSession {
  id: string;
  type: GuidanceType;
  title: string;
  description: string;
  status: GuidanceStatus;
  startTime: string;
  endTime?: string;
  metadata: Record<string, unknown>;
  progress: number; // 0-100
}

export interface TutoringPath {
  id: string;
  subject: string;
  level: DifficultyLevel;
  modules: TutoringModule[];
  currentModuleId: string;
  overallProgress: number;
}

export interface TutoringModule {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  score?: number;
  tasks: string[];
}

export interface MentorshipGoal {
  id: string;
  title: string;
  targetDate: string;
  status: 'active' | 'achieved' | 'missed';
  milestones: { title: string; completed: boolean }[];
  feedbackHistory: { timestamp: string; note: string; rating: number }[];
}

export interface InstructionStep = {
  order: number;
  text: string;
  completed: boolean;
  tips?: string[];
  warning?: string;
}

export interface GuidanceConfig = {
  autoGenerateInstructions: boolean;
  mentorshipCheckInIntervalMs: number;
  defaultTutoringLevel: DifficultyLevel;
  hcuBudgetPerHour: number;
  enableFeedbackLoop: boolean;
};

export interface GuidanceEvent =
  | { type: 'session_started'; session: GuidanceSession }
  | { type: 'session_completed'; sessionId: string; score?: number }
  | { type: 'progress_updated'; sessionId: string; progress: number }
  | { type: 'goal_achieved'; goal: MentorshipGoal }
  | { type: 'feedback_received'; sessionId: string; note: string; rating: number }
  | { type: 'instruction_generated'; taskId: string; steps: InstructionStep[] };
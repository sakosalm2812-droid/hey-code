export interface BriefingInput {
  dueToday: number;
  overdue: number;
  completedToday: number;
  focusToday: number;
  pendingTasks: number;
  journalEntriesLast7Days: string[];
  bestHabitStreak: number;
}

export interface Briefing {
  greeting: string;
  bullets: string[];
  focus: string[];
  timestamp: string;
}

export function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function buildBriefing(input: BriefingInput, now = new Date()): Briefing {
  const bullets: string[] = [];
  const focus: string[] = [];

  if (input.overdue > 0) {
    bullets.push(`You have ${input.overdue} overdue task${input.overdue === 1 ? '' : 's'}. Clear these first before starting new work.`);
    focus.push('Clear overdue tasks');
  }

  if (input.dueToday > 0) {
    bullets.push(`${input.dueToday} task${input.dueToday === 1 ? '' : 's'} due today — ${input.focusToday} high-priority.`);
  } else {
    bullets.push('No tasks are due today. A good day to make progress on something bigger.');
  }

  if (input.completedToday > 0) {
    bullets.push(`You already completed ${input.completedToday} task${input.completedToday === 1 ? '' : 's'} today. Keep the momentum.`);
  } else {
    bullets.push('No completions yet today. Pick a quick win to get started.');
  }

  if (input.focusToday > 0) {
    focus.push(`Focus on ${input.focusToday} high-priority task${input.focusToday === 1 ? '' : 's'}`);
  }

  if (input.journalEntriesLast7Days.length >= 3) {
    bullets.push(`You wrote ${input.journalEntriesLast7Days.length} journal entr${input.journalEntriesLast7Days.length === 1 ? 'y' : 'ies'} in the past week — great consistency.`);
  }

  if (input.bestHabitStreak >= 3) {
    bullets.push(`Your best habit streak is ${input.bestHabitStreak} days. Don't break it today.`);
    focus.push(`Keep the ${input.bestHabitStreak}-day habit streak alive`);
  }

  if (input.pendingTasks > 0 && input.pendingTasks < 6) {
    bullets.push(`Only ${input.pendingTasks} open task${input.pendingTasks === 1 ? '' : 's'} on your plate — very manageable.`);
  }

  if (focus.length === 0) {
    focus.push('Start with one small task and build from there');
  }

  if (bullets.length === 0) {
    bullets.push('Your day is wide open. Consider planning a few tasks for structure.');
  }

  return {
    greeting: greetingFor(now.getHours()),
    bullets,
    focus,
    timestamp: now.toISOString(),
  };
}

export function journalStreak(recentDates: string[], now = new Date()): number {
  const days = new Set(recentDates.map((iso) => new Date(iso).toDateString()));
  let streak = 0;
  const cursor = new Date(now);
  for (let i = 0; i < 60; i++) {
    if (days.has(cursor.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
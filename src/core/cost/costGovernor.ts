// Cost Governor — HEY Compute Units tracking
// Tracks HCU consumption across all engines with budget enforcement

export interface HcuBudget {
  perHour: number;
  perDay: number;
  perSession: number;
  usedThisHour: number;
  usedToday: number;
  usedThisSession: number;
}

export const DEFAULT_HCU_BUDGET: HcuBudget = {
  perHour: 50,
  perDay: 500,
  perSession: 20,
  usedThisHour: 0,
  usedToday: 0,
  usedThisSession: 0,
};

let hcuUsage: HcuBudget = { ...DEFAULT_HCU_BUDGET };
let sessionStart = Date.now();

export function track(amount: number): { success: boolean; hcuUsed: number; budget: HcuBudget } {
  hcuUsage.usedThisHour += amount;
  hcuUsage.usedToday += amount;
  hcuUsage.usedThisSession += amount;

  const success = hcuUsage.usedThisHour <= DEFAULT_HCU_BUDGET.perHour;

  return {
    success,
    hcuUsed: hcuUsage.usedThisHour,
    budget: { ...DEFAULT_HCU_BUDGET, usedThisHour: hcuUsage.usedThisHour },
  };
}

export function consume(amount: number): { success: boolean; hcuUsed: number; budget: HcuBudget } {
  return track(amount);
}

export function setBudget(budget: Partial<HcuBudget>): HcuBudget {
  hcuUsage = { ...hcuUsage, ...budget, usedThisHour: (budget.perHour || DEFAULT_HCU_BUDGET.perHour) };
  return hcuUsage;
}

export function getBudget(): HcuBudget {
  return { ...hcuUsage };
}

export function reset(): HcuBudget {
  hcuUsage = { ...DEFAULT_HCU_BUDGET };
  sessionStart = Date.now();
  return hcuUsage;
}

export function getUsage(): HcuBudget {
  const now = Date.now();
  if (now - sessionStart > 3600000) {
    // Hourly reset
    hcuUsage.usedThisHour = 0;
    hcuUsage.usedToday = Math.min(hcuUsage.usedToday, DEFAULT_HCU_BUDGET.perDay);
    hcuUsage.usedThisSession = 0;
    sessionStart = now;
  }
  return { ...hcuUsage };
}
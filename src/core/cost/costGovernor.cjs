// Cost Governor — HCU tracking with budget enforcement
// Tracks HEY Compute Units across all engines

const MAX_HCU = 1000; // Absolute ceiling

let currentHcu = 0;
let hourlyBudget = 50; // Default 50 HCU/hour
let lastReset = Date.now();

export function track(amount = 1) {
  currentHcu += amount;
  const now = Date.now();
  if (now - lastReset > 3600000) { // Hourly reset
    currentHcu = 0;
    lastReset = now;
  }
  if (currentHcu > hourlyBudget) {
    throw new Error(`HCU budget exceeded: ${currentHcu}/${hourlyBudget} HCU`);
  }
  return currentHcu;
}

export function consume(amount = 1) {
  return track(amount);
}

export function setBudget(budget) {
  hourlyBudget = budget;
  currentHcu = 0;
}

export function getCurrentHcu() {
  return currentHcu;
}

export function getRemainingHcu() {
  return hourlyBudget - currentHcu;
}

export function reset() {
  currentHcu = 0;
  lastReset = Date.now();
}

export function configure({ budget }) {
  if (budget) setBudget(budget);
}
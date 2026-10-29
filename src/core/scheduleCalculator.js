const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function parseField(text, min, max, names = []) {
  const values = new Set();
  const number = raw => {
    const named = names.indexOf(raw.toLowerCase());
    return named >= 0 ? named + min : /^\d+$/.test(raw) ? Number(raw) : NaN;
  };
  for (const part of text.split(',')) {
    const pieces = part.split('/');
    if (!part || pieces.length > 2) return null;
    const step = pieces[1] === undefined ? 1 : number(pieces[1]);
    if (!Number.isSafeInteger(step) || step <= 0) return null;
    const range = pieces[0] === '*' ? [min, max] : pieces[0].split('-').map(number);
    if (range.length > 2 || range.some(value => !Number.isInteger(value) || value < min || value > max)) return null;
    const start = range[0], end = range[1] ?? (pieces[1] === undefined ? start : max);
    if (start > end) return null;
    for (let value = start; value <= end; value += step) values.add(value);
  }
  return values;
}

export function nextCronRun(expression, now = new Date()) {
  if (typeof expression !== 'string' || expression.length > 256 || !Number.isFinite(now.getTime())) return null;
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const minutes = parseField(fields[0], 0, 59);
  const hours = parseField(fields[1], 0, 23);
  const days = parseField(fields[2], 1, 31);
  const months = parseField(fields[3], 1, 12, MONTHS);
  const weekdays = parseField(fields[4], 0, 7, WEEKDAYS);
  if (!minutes || !hours || !days || !months || !weekdays) return null;
  if (weekdays.has(7)) weekdays.add(0);
  const dayRestricted = !fields[2].includes('*'), weekdayRestricted = !fields[4].includes('*');
  // Scan calendar days, not every minute. Eight years includes a leap-year
  // occurrence even across a non-leap century. Runtime uses the device timezone.
  for (let offset = 0; offset <= 366 * 8; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    if (!months.has(day.getMonth() + 1)) continue;
    const dom = days.has(day.getDate()), dow = weekdays.has(day.getDay());
    if (!(dayRestricted && weekdayRestricted ? dom || dow : dom && dow)) continue;
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    const foldMs = Math.max(0, end.getTimezoneOffset() - start.getTimezoneOffset()) * 60000;
    let earliest = Infinity;
    for (const hour of hours) for (const minute of minutes) {
      const base = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
      for (const shift of foldMs ? [0, foldMs] : [0]) {
        const candidate = new Date(base.getTime() + shift);
        // A missing DST time normalizes forward; it must not run at another time.
        if (candidate.getDate() !== day.getDate() || candidate.getHours() !== hour || candidate.getMinutes() !== minute) continue;
        if (candidate > now) earliest = Math.min(earliest, candidate.getTime());
      }
    }
    if (Number.isFinite(earliest)) return new Date(earliest);
  }
  return null;
}

export function calculateNextScheduleRun(schedule, now = new Date()) {
  if (!Number.isFinite(now.getTime()) || schedule == null) return null;
  const future = value => { const date = new Date(value); return Number.isFinite(date.getTime()) && date > now ? date : null; };
  const interval = value => Number.isFinite(value) && value > 0 ? future(now.getTime() + Math.max(1000, value)) : null;
  if (schedule instanceof Date) return future(schedule);
  if (typeof schedule === 'number') return schedule > now.getTime() ? future(schedule) : interval(schedule);
  if (typeof schedule === 'string') {
    const text = schedule.trim();
    const macro = { '@hourly': '0 * * * *', '@daily': '0 0 * * *', '@weekly': '0 0 * * 0' }[text];
    if (macro) return nextCronRun(macro, now);
    const time = /^(\d{1,2}):(\d{2})$/.exec(text);
    if (time) return nextCronRun(`${Number(time[2])} ${Number(time[1])} * * *`, now);
    if (text.split(/\s+/).length === 5) return nextCronRun(text, now);
    return future(text);
  }
  if (typeof schedule !== 'object' || Array.isArray(schedule)) return null;
  // Arbitrary timezone overrides need a timezone-aware adapter; never ignore one.
  if (schedule.timezone || schedule.timeZone) return null;
  if (schedule.cron) return nextCronRun(schedule.cron, now);
  if (schedule.at || schedule.dateTime || schedule.date) return future(schedule.at || schedule.dateTime || schedule.date);
  if (schedule.time) {
    const time = /^(\d{1,2}):(\d{2})$/.exec(String(schedule.time));
    if (!time) return null;
    const weekdays = schedule.weekdays ?? schedule.daysOfWeek;
    if (weekdays != null && (!Array.isArray(weekdays) || !weekdays.length)) return null;
    const normalized = weekdays?.map(day => Number.isInteger(day) ? day : WEEKDAYS.indexOf(String(day).toLowerCase().slice(0, 3)));
    if (normalized?.some(day => day < 0 || day > 6)) return null;
    return nextCronRun(`${Number(time[2])} ${Number(time[1])} * * ${normalized?.join(',') || '*'}`, now);
  }
  const delay = schedule.intervalMs ?? (schedule.everyMinutes != null ? schedule.everyMinutes * 60000 : schedule.everyHours != null ? schedule.everyHours * 3600000 : schedule.everyDays != null ? schedule.everyDays * 86400000 : NaN);
  return interval(delay);
}

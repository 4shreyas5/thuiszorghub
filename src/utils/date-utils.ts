/**
 * Check if date is a weekend (Saturday = 6, Sunday = 0)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Check if date is a Dutch public holiday
 * Supported: New Year's Day, Good Friday, Easter Sunday/Monday, King's Day,
 * Liberation Day, Ascension Day, Whit Sunday/Monday, Christmas Day/Boxing Day
 */
export function isHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Fixed holidays
  const fixedHolidays = [
    [0, 1], // New Year's Day
    [4, 27], // King's Day (April 27, or 26 if 27 is Sunday)
    [4, 26], // King's Day alternate
    [5, 5], // Liberation Day
    [11, 25], // Christmas Day
    [11, 26], // Boxing Day
  ];

  if (fixedHolidays.some(([m, d]) => month === m && day === d)) {
    return true;
  }

  // Easter-based holidays (Good Friday, Easter Sunday, Easter Monday)
  const easter = getEasterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);
  const ascensionDay = new Date(easter);
  ascensionDay.setDate(ascensionDay.getDate() + 39);
  const whitMonday = new Date(easter);
  whitMonday.setDate(whitMonday.getDate() + 50);

  const dateStr = date.toISOString().split("T")[0];
  const holidays = [
    goodFriday,
    easter,
    easterMonday,
    ascensionDay,
    whitMonday,
  ];

  return holidays.some((h) => h.toISOString().split("T")[0] === dateStr);
}

/**
 * Calculate Easter date using Computus algorithm
 */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Get hours between two times (for billable hours calculation)
 */
export function getHoursBetween(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Get start and end of a billing period (month)
 */
export function getBillingPeriod(
  date: Date = new Date()
): { start: Date; end: Date } {
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  return { start, end };
}

/**
 * Format date as ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse ISO date string to Date
 */
export function fromISODateString(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if time is night shift (22:00 - 06:00)
 */
export function isNightShift(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
}

export function getWeekNumber(d: Date): number {
  // Copy check date
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function formatYear(date: Date): string {
  return `${date.getFullYear()}年`;
}

export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function getWeekDayName(date: Date): string {
  const map = ['日', '一', '二', '三', '四', '五', '六'];
  return map[date.getDay()];
}

export function startOfWeek(date: Date, startDay: number = 0): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  const diff = d.getDate() - day + (day < startDay ? -7 : 0) + startDay;
  d.setDate(diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

/** Month grid rows, padded with `null` before the 1st so every row holds 7 cells. */
export function buildMonthWeeks(year: number, month: number, firstDayOfWeek: number = 0): (Date | null)[][] {
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startDayOfWeek = (firstDay.getDay() - firstDayOfWeek + 7) % 7

    const gridDays: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
        gridDays.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        gridDays.push(new Date(year, month, i))
    }

    const weeks: (Date | null)[][] = []
    for (let i = 0; i < gridDays.length; i += 7) {
        weeks.push(gridDays.slice(i, i + 7))
    }
    return weeks
}

/** Single-letter weekday names in the system language, e.g. `S M T W T F S` / `日一二三四五六`. */
export function getWeekDayNarrowNames(firstDayOfWeek: number = 0): string[] {
    const sunday = new Date('1970/01/04')
    const format = new Intl.DateTimeFormat([], { weekday: 'narrow' }).format
    return Array.from({ length: 7 }).map((_, i) =>
        format(new Date(sunday.getTime() + ((i + firstDayOfWeek) % 7) * 86400000))
    )
}

/** Month name in the system language, uppercased: `AUGUST` / `八月`. */
export function formatMonthTitle(date: Date): string {
    return new Intl.DateTimeFormat([], { month: 'long' }).format(date).toUpperCase()
}

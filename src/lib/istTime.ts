// The academy runs on Indian Standard Time (UTC+05:30, no DST). All "today / this week"
// logic uses IST calendar days regardless of where the server runs (Vercel = UTC).

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

/** Midnight (as a UTC instant) of the IST calendar day that `date` falls on. Matches a Postgres DATE column. */
export function istDay(date: Date = new Date()): Date {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

export function addDays(day: Date, n: number): Date {
  return new Date(day.getTime() + n * DAY_MS);
}

/** Monday of the IST week containing `date` (as an istDay value). */
export function istWeekStart(date: Date = new Date()): Date {
  const today = istDay(date);
  const dow = today.getUTCDay(); // 0 = Sunday
  return addDays(today, -((dow + 6) % 7));
}

/** Minutes since IST midnight for `date`. */
export function istMinutesOfDay(date: Date = new Date()): number {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** "17:30" -> 1050. Returns null for anything that is not HH:MM. */
export function parseHHMM(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? null : h * 60 + min;
}

/** 1050 -> "5:30 PM" */
export function formatClock(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Today", "Tomorrow", or "Wed, 12 Nov" for an istDay value relative to today. */
export function relativeDayLabel(day: Date, today: Date = istDay()): string {
  const diff = Math.round((day.getTime() - today.getTime()) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${WEEKDAYS[day.getUTCDay()]}, ${day.getUTCDate()} ${MONTHS[day.getUTCMonth()]}`;
}

/** "just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago", "12 Nov". */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const secs = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return `${ist.getUTCDate()} ${MONTHS[ist.getUTCMonth()]}`;
}

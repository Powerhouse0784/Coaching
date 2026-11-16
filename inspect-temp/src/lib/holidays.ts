export interface NationalHoliday {
  title: string;
  date: string; // YYYY-MM-DD
  tentative?: boolean; // lunar/moon-sighting-dependent, subject to official confirmation
}

// Sourced from DoPT's 2026 gazetted holiday circular + widely observed festivals.
// Lunar/tithi-based festivals are marked tentative since exact dates are confirmed
// closer to the event by local authorities. Teachers can add/adjust holidays freely.
export const NATIONAL_HOLIDAYS_2026: NationalHoliday[] = [
  { title: "New Year's Day", date: "2026-01-01" },
  { title: "Makar Sankranti", date: "2026-01-14" },
  { title: "Republic Day", date: "2026-01-26" },
  { title: "Holika Dahan", date: "2026-03-03", tentative: true },
  { title: "Holi", date: "2026-03-04", tentative: true },
  { title: "Id-ul-Fitr", date: "2026-03-21", tentative: true },
  { title: "Ram Navami", date: "2026-03-26", tentative: true },
  { title: "Mahavir Jayanti", date: "2026-03-31", tentative: true },
  { title: "Good Friday", date: "2026-04-03" },
  { title: "Buddha Purnima", date: "2026-05-01", tentative: true },
  { title: "Id-ul-Zuha (Bakrid)", date: "2026-05-27", tentative: true },
  { title: "Muharram", date: "2026-06-26", tentative: true },
  { title: "Rath Yatra", date: "2026-07-16", tentative: true },
  { title: "Independence Day", date: "2026-08-15" },
  { title: "Milad-un-Nabi", date: "2026-08-26", tentative: true },
  { title: "Raksha Bandhan", date: "2026-08-28", tentative: true },
  { title: "Janmashtami", date: "2026-09-04", tentative: true },
  { title: "Gandhi Jayanti", date: "2026-10-02" },
  { title: "Dussehra", date: "2026-10-20", tentative: true },
  { title: "Diwali", date: "2026-11-08", tentative: true },
  { title: "Guru Nanak Jayanti", date: "2026-11-24", tentative: true },
  { title: "Christmas", date: "2026-12-25" },
];


export function getNationalHolidays(year: number): NationalHoliday[] {
  if (year === 2026) return NATIONAL_HOLIDAYS_2026;
  // Fallback for other years: no seeded data yet, return empty (teacher can add custom ones)
  return [];
}
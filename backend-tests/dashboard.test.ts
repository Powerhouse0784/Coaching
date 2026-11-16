import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
import { istDay, addDays, istMinutesOfDay, istWeekStart, formatClock, parseHHMM, timeAgo, relativeDayLabel } from "@/lib/istTime";

process.env.NEXTAUTH_SECRET = "test-secret";
const now = new Date();
const today = istDay(now);
const nowMin = istMinutesOfDay(now);
if (nowMin < 90 || nowMin > 1340) { console.log("SKIP: too close to IST midnight for the live-class fixture"); process.exit(0); }
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const weekStart = istWeekStart(now);
const dayIdx = Math.round((today.getTime() - weekStart.getTime()) / 86400000); // 0 = Monday

const logs = [
  { day: today, seconds: 45 * 60 },
  { day: addDays(today, -1), seconds: 60 * 60 },
  { day: addDays(today, -7), seconds: 30 * 60 },
  { day: addDays(today, -8), seconds: 30 * 60 },
].filter((l) => l.day >= addDays(weekStart, -7));

const calls: string[] = [];
(globalThis as any).prismaGlobal = {
  $disconnect: async () => {},
  user: { findUnique: async () => { calls.push("user"); return { id: "u1", email: "a@b.com", role: "STUDENT", name: "Asha", isActive: true }; } },
  student: { findUnique: async () => ({ id: "s1", grade: "Class 10", dailyGoalMinutes: 120 }) },
  watchLog: { findMany: async () => logs },
  videoProgress: {
    count: async ({ where }: any) => (where.completed ? 17 : 20),
    findMany: async () => [{ id: "p1", completed: true, updatedAt: new Date(now.getTime() - 2 * 3600e3), video: { title: "Trigonometry" } }],
  },
  quizAttempt: {
    count: async () => 3,
    findMany: async () => [{ id: "q1", title: "Algebra Basics Quiz", correct: 5, createdAt: new Date(now.getTime() - 3600e3) }],
  },
  assignmentSubmission: { count: async () => 2, findMany: async () => [] },
  assignmentV2: { count: async () => 1 },
  doubt: { findMany: async () => [] },
  scheduleSession: {
    findMany: async () => [
      { id: "old", subject: "History", class: "Class 10", date: today, startTime: hhmm(nowMin - 120), endTime: hhmm(nowMin - 60) },
      { id: "other", subject: "Physics", class: "Class 12 (Science)", date: today, startTime: hhmm(nowMin - 10), endTime: hhmm(nowMin + 50) },
      { id: "live", subject: "Mathematics", class: "Class 10", date: today, startTime: hhmm(nowMin - 10), endTime: hhmm(nowMin + 50) },
      { id: "later", subject: "Science", class: "Class 10", date: addDays(today, 1), startTime: "09:00", endTime: "10:00" },
    ],
  },
};

async function main() {
  const { GET } = await import("@/app/api/student/dashboard/route");
  const { NextRequest } = await import("next/server");
  const token = jwt.sign({ id: "u1", email: "a@b.com", role: "STUDENT", name: "Asha" }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });

  // (cookie-session path needs a real Next request scope; only bearer paths are exercised here)
  const forged = jwt.sign({ id: "u1" }, "wrong", { algorithm: "HS256" });
  assert.equal((await GET(new NextRequest("http://x/api/student/dashboard", { headers: { authorization: `Bearer ${forged}` } }))).status, 401);
  const none = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url") + "." + Buffer.from(JSON.stringify({ id: "u1" })).toString("base64url") + ".";
  assert.equal((await GET(new NextRequest("http://x/api/student/dashboard", { headers: { authorization: `Bearer ${none}` } }))).status, 401);

  const res = await GET(new NextRequest("http://x/api/student/dashboard", { headers: { authorization: `Bearer ${token}` } }));
  assert.equal(res.status, 200);
  const d = await res.json();
  console.log(JSON.stringify(d, null, 1));

  assert.deepEqual(d.goal, { doneMinutes: 45, targetMinutes: 120 });
  assert.equal(d.performance.overallProgress, 85);          // 17 / 20
  assert.equal(d.performance.topicsLearned, 17);
  assert.equal(d.performance.testsAttempted, 3);
  assert.equal(d.performance.weekly.length, 7);
  assert.equal(d.performance.weekly[dayIdx], 38);           // 45/120 -> 37.5 -> 38
  for (let i = dayIdx + 1; i < 7; i++) assert.equal(d.performance.weekly[i], 0);
  assert.equal(d.upcomingClass.id, "live");                 // not the finished one, not the other grade
  assert.equal(d.upcomingClass.isLive, true);
  assert.match(d.upcomingClass.when, /^Today • \d{1,2}:\d{2} (AM|PM) – \d{1,2}:\d{2} (AM|PM)$/);
  assert.equal(d.unreadNotifications, 1);
  assert.equal(d.recentActivity[0].kind, "quiz");           // 1h ago is newer than 2h ago
  assert.equal(d.recentActivity[0].xp, 25);
  assert.equal(d.recentActivity[1].title, "Completed: Trigonometry");
  assert.ok(!("at" in d.recentActivity[0]));
  assert.ok(typeof d.performance.achievements === "number");

  // cached account check: 4 requests above -> user table hit once for the valid token
  assert.equal(calls.length, 1, `expected 1 user lookup, got ${calls.length}`);

  // helpers
  assert.equal(formatClock(1050), "5:30 PM");
  assert.equal(formatClock(0), "12:00 AM");
  assert.equal(formatClock(720), "12:00 PM");
  assert.equal(parseHHMM("17:30"), 1050);
  assert.equal(parseHHMM("25:00"), null);
  assert.equal(timeAgo(new Date(now.getTime() - 2 * 3600e3), now), "2 hours ago");
  assert.equal(timeAgo(new Date(now.getTime() - 3600e3), now), "1 hour ago");
  assert.equal(relativeDayLabel(addDays(today, 1), today), "Tomorrow");
  assert.equal(istWeekStart(new Date("2026-11-08T10:00:00Z")).toISOString(), "2026-11-02T00:00:00.000Z"); // Sunday -> that week's Monday
  assert.equal(istDay(new Date("2026-11-05T19:00:00Z")).toISOString(), "2026-11-06T00:00:00.000Z");     // 00:30 IST next day
  console.log("\nALL DASHBOARD CHECKS PASSED");
}
main().catch((e) => { console.error(e); process.exit(1); });

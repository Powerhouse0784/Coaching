import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
import { istDay, addDays, istWeekStart } from "@/lib/istTime";

process.env.NEXTAUTH_SECRET = "test-secret";
const now = new Date();
const today = istDay(now);
const weekStart = istWeekStart(now);
const dayIdx = Math.round((today.getTime() - weekStart.getTime()) / 86400000);
const ago = (d: number) => new Date(now.getTime() - d * 86400e3);

const logs = [
  { userId: "a", day: today }, { userId: "b", day: today }, { userId: "a", day: addDays(today, -1) },
  { userId: "c", day: addDays(today, -9) },
].filter((l) => l.day >= addDays(weekStart, -7));

(globalThis as any).prismaGlobal = {
  $disconnect: async () => {},
  user: {
    findUnique: async ({ where }: any) => ({ id: where.id, email: "t@x.com", role: where.id === "s9" ? "STUDENT" : "TEACHER", name: "Saqib", isActive: true }),
    count: async ({ where }: any) => (where.createdAt?.lt ? 8 : 10),
    findMany: async ({ where }: any) => (where.createdAt ? [{ createdAt: ago(0) }, { createdAt: ago(2) }] : Array.from({ length: 10 }, (_, i) => ({ id: String.fromCharCode(97 + i) }))),
  },
  teacher: { findUnique: async () => ({ id: "T1" }) },
  note: { count: async () => 2, findMany: async () => [{ createdAt: ago(1) }] },
  assignmentV2: { count: async () => 3, findMany: async () => [] },
  doubt: {
    count: async ({ where }: any) => (where.isSolved === false ? 2 : where.createdAt?.lt ? 1 : 3),
    findMany: async ({ take, where }: any) =>
      take ? [{ id: "d1", title: "Why is sky blue?", subject: "Physics", class: "Class 10", createdAt: ago(0.01) }] : [{ createdAt: ago(0) }],
  },
  watchLog: { findMany: async () => logs },
  assignmentSubmission: {
    findMany: async () => [{ id: "s1", submittedAt: ago(0.1), assignment: { title: "Algebra" }, student: { user: { name: "Riya Sharma" } } }],
  },
};

async function main() {
  const { GET } = await import("@/app/api/teacher/dashboard/route");
  const { NextRequest } = await import("next/server");
  const req = (tok?: string) => new NextRequest("http://x/api/teacher/dashboard", { headers: tok ? { authorization: `Bearer ${tok}` } : { authorization: "Bearer bad" } });
  const tok = jwt.sign({ id: "t1", email: "t@x.com", role: "TEACHER", name: "Saqib" }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });

  assert.equal((await GET(req())).status, 401);
  const stok = jwt.sign({ id: "s9", email: "s@x.com", role: "STUDENT", name: "S" }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });
  assert.equal((await GET(req(stok))).status, 403, "students must not read the teacher dashboard");

  const res = await GET(req(tok));
  assert.equal(res.status, 200);
  const d = await res.json();
  assert.equal(d.stats.students.value, 10);
  assert.equal(d.stats.students.delta, 25); // 8 -> 10
  assert.equal(d.stats.students.spark.length, 7);
  assert.equal(d.stats.students.spark[6], 10);
  assert.equal(d.stats.notes.value, 2);
  assert.equal(d.stats.assignments.value, 3);
  assert.equal(d.stats.doubts.value, 2);
  assert.equal(d.engagement.weekly.length, 7);
  assert.equal(d.engagement.weekly[dayIdx], 20); // 2 of 10 students today
  assert.ok(d.engagement.percent >= 0 && d.engagement.percent <= 100);
  for (let i = dayIdx + 1; i < 7; i++) assert.equal(d.engagement.weekly[i], 0, "future days are 0");
  assert.equal(d.recentActivity[0].kind === "doubt" || d.recentActivity[0].kind === "submission", true);
  assert.ok(d.recentActivity.some((a: any) => a.title === "New doubt from Class 10"));
  assert.ok(d.recentActivity.some((a: any) => a.title === "Assignment submitted by Riya Sharma"));
  assert.equal(d.unreadNotifications, 2);
  // watch_logs table missing (migration not applied): counts must still load
  const g: any = globalThis;
  const p = g.prismaGlobal;
  const origLog = p.watchLog.findMany, origSub = p.assignmentSubmission.findMany;
  p.watchLog.findMany = async () => { throw new Error('relation "watch_logs" does not exist'); };
  p.assignmentSubmission.findMany = async () => { throw new Error("boom"); };
  const quiet = console.error; console.error = () => {};
  const res2 = await GET(req(tok));
  console.error = quiet;
  assert.equal(res2.status, 200, "optional sections must not 500 the dashboard");
  const d2 = await res2.json();
  assert.equal(d2.stats.students.value, 10);
  assert.equal(d2.stats.doubts.value, 2);
  assert.equal(d2.engagement.percent, 0);
  p.watchLog.findMany = origLog; p.assignmentSubmission.findMany = origSub;
  console.log("TEACHER DASHBOARD TESTS PASSED");
}
main().catch((e) => { console.error(e); process.exit(1); });

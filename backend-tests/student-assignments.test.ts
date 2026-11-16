import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
process.env.NEXTAUTH_SECRET = "test-secret";

// ---- fake database -------------------------------------------------------------------------------------------
type Row = Record<string, any>;
const teacher = { user: { name: "Prakash Jha", avatar: null } };
const mkAsg = (id: string, published = true): Row => ({
  id, title: "Assignment " + id, description: "d", subject: "Physics", class: "Class 12", dueDate: new Date("2026-12-01"), totalMarks: 10,
  fileUrl: null, fileName: null, fileSize: null, createdAt: new Date("2026-11-01"), isPublished: published, teacher,
});
const assignments: Row[] = [mkAsg("a1"), mkAsg("a2"), mkAsg("hidden", false)];
const submissions: Row[] = [];
let seq = 0;
const p2002 = () => Object.assign(new Error("Unique constraint failed"), { code: "P2002" });

const prismaFake: any = {
  $disconnect: async () => {},
  user: { findUnique: async ({ where }: any) => ({ id: where.id, email: where.id + "@x.com", role: "STUDENT", name: "N " + where.id, isActive: true }) },
  student: { findUnique: async ({ where }: any) => (where.userId === "ghost" ? null : { id: "stu_" + where.userId, userId: where.userId }) },
  assignmentV2: {
    findMany: async (args: any) =>
      assignments.filter((a) => a.isPublished === args.where.isPublished).map((a) => ({
        ...a,
        submissions: submissions.filter((s) => s.assignmentId === a.id && s.studentId === args.select.submissions.where.studentId),
        _count: { submissions: submissions.filter((s) => s.assignmentId === a.id).length, comments: 0 },
      })),
    findFirst: async ({ where }: any) => assignments.find((a) => a.id === where.id && a.isPublished === where.isPublished) ?? null,
  },
  assignmentSubmission: {
    create: async ({ data }: any) => {
      if (submissions.some((s) => s.assignmentId === data.assignmentId && s.studentId === data.studentId)) throw p2002(); // unique(assignmentId, studentId)
      const row = { id: "sub" + ++seq, submittedAt: new Date(), ...data };
      submissions.push(row);
      return row;
    },
    findFirst: async ({ where }: any) => submissions.find((s) => s.id === where.id && s.studentId === where.studentId) ?? null,
    update: async ({ where, data }: any) => Object.assign(submissions.find((s) => s.id === where.id)!, data),
  },
};
(globalThis as any).prismaGlobal = prismaFake;

const tok = (id: string) => jwt.sign({ id, email: id + "@x.com", role: "STUDENT", name: "x" }, "test-secret", { algorithm: "HS256" });

async function main() {
  const { GET, POST, PATCH } = await import("@/app/api/student/assignments/route");
  const { NextRequest } = await import("next/server");
  const req = (method: string, body: any, id?: string) =>
    new NextRequest("http://x/api/student/assignments", { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }), headers: { "content-type": "application/json", authorization: `Bearer ${id ? tok(id) : "invalid"}` } });
  const get = (id?: string) => GET(req("GET", undefined, id));
  const post = (body: any, id?: string) => POST(req("POST", body, id));
  const patch = (body: any, id?: string) => PATCH(req("PATCH", body, id));
  const quiet = async <T>(f: () => Promise<T>) => { const e = console.error; console.error = () => {}; try { return await f(); } finally { console.error = e; } };
  const good = { assignmentId: "a1", fileUrl: "https://files.example/x.pdf", fileName: "x.pdf", fileSize: "0.89 MB", remarks: "done" };

  // ---------- GET ----------
  assert.equal((await get()).status, 401);
  assert.equal((await get("ghost")).status, 404, "no student profile");
  let r = await get("alice"); let j: any = await r.json();
  assert.equal(r.status, 200);
  assert.deepEqual(j.assignments.map((a: any) => a.id), ["a1", "a2"], "published only");
  assert.ok(j.assignments.every((a: any) => a.mySubmission === null));

  // ---------- POST (submit) ----------
  assert.equal((await post(good)).status, 401);
  assert.equal((await post({ ...good, assignmentId: undefined }, "alice")).status, 400);
  assert.equal((await post({ ...good, fileUrl: "" }, "alice")).status, 400);
  assert.equal((await post({ ...good, fileName: 42 }, "alice")).status, 400, "non-string values rejected");
  assert.equal((await post({ ...good, fileUrl: "javascript:alert(1)" }, "alice")).status, 400, "only http(s) file links");
  assert.equal((await post({ ...good, fileUrl: "file:///etc/passwd" }, "alice")).status, 400);
  assert.equal((await post({ ...good, assignmentId: "nope" }, "alice")).status, 404);
  assert.equal((await post({ ...good, assignmentId: "hidden" }, "alice")).status, 404, "unpublished assignment cannot be submitted");
  assert.equal((await post(good, "ghost")).status, 404);

  r = await post({ ...good, remarks: "x".repeat(900), fileSize: undefined }, "alice"); j = await r.json();
  assert.equal(r.status, 201);
  assert.equal(j.submission.remarks.length, 500, "remarks capped at 500 chars");
  assert.equal(j.submission.fileSize, "0 MB", "missing size defaults");
  assert.equal(j.submission.status, "pending");
  assert.equal(j.submission.isCompleted, false);

  r = await post(good, "alice"); j = await r.json();
  assert.equal(r.status, 409, "second submit of the same assignment (double tap / second phone)");
  assert.match(j.error, /already submitted/);
  assert.equal(submissions.filter((s) => s.studentId === "stu_alice" && s.assignmentId === "a1").length, 1, "still exactly one row");

  j = await (await get("alice")).json();
  assert.equal(j.assignments.find((a: any) => a.id === "a1").mySubmission.fileName, "x.pdf");
  assert.equal(j.assignments.find((a: any) => a.id === "a1").stats.totalSubmissions, 1);
  assert.equal((await (await get("bob")).json()).assignments.find((a: any) => a.id === "a1").mySubmission, null, "others never see my submission");

  // rate limit: 10 attempts per 10 minutes per student, then 429
  const codes: number[] = [];
  for (let i = 0; i < 12; i++) codes.push((await post({ ...good, assignmentId: "a2" }, "spammer")).status);
  assert.deepEqual(codes, [201, 409, 409, 409, 409, 409, 409, 409, 409, 409, 429, 429]);

  // ---------- PATCH (mark done) ----------
  const mine = submissions.find((s) => s.studentId === "stu_alice")!;
  assert.equal((await patch({ submissionId: mine.id })).status, 401);
  assert.equal((await patch({}, "alice")).status, 400);
  assert.equal((await patch({ submissionId: mine.id }, "bob")).status, 404, "cannot touch someone else's submission");
  r = await patch({ submissionId: mine.id, isCompleted: true }, "alice"); j = await r.json();
  assert.deepEqual([r.status, j.submission.isCompleted, j.submission.status], [200, true, "completed"]);
  r = await patch({ submissionId: mine.id, isCompleted: false }, "alice"); j = await r.json();
  assert.deepEqual([j.submission.isCompleted, j.submission.status], [false, "pending"], "undo restores the status");
  r = await patch({ submissionId: mine.id }, "alice"); j = await r.json();
  assert.deepEqual([j.submission.isCompleted, j.submission.status], [true, "completed"], "flag and status can no longer disagree when the field is omitted");

  // errors never leak internals
  const saved = prismaFake.assignmentV2.findMany;
  prismaFake.assignmentV2.findMany = async () => { throw new Error("connection string postgres://secret"); };
  r = await quiet(() => get("alice")); j = await r.json();
  assert.equal(r.status, 500);
  assert.deepEqual(Object.keys(j), ["error"]);
  prismaFake.assignmentV2.findMany = saved;

  console.log("\nALL STUDENT-ASSIGNMENTS API CHECKS PASSED");
}
main().catch((e) => { console.error(e); process.exit(1); });

import jwt from "jsonwebtoken";
import assert from "node:assert/strict";

process.env.NEXTAUTH_SECRET = "test-secret";
const seen: any[] = [];
const all = [
  { id: "a", name: "Aara", role: "STUDENT", isActive: true, student: { grade: "Class 5" } },
  { id: "b", name: "Rohan", role: "STUDENT", isActive: false, student: null },
];
(globalThis as any).prismaGlobal = {
  user: {
    findUnique: async ({ where }: any) => ({ id: where.id, email: "x@x.com", role: where.id === "s9" ? "STUDENT" : "TEACHER", name: "T", isActive: true }),
    findMany: async (args: any) => { seen.push(args); return all.filter((u) => args.where.isActive !== true || u.isActive); },
    count: async ({ where }: any) => all.filter((u) => where.isActive !== true || u.isActive).length,
  },
  $disconnect: async () => {},
};

async function main() {
  const { GET } = await import("@/app/api/user/students/route");
  const { NextRequest } = await import("next/server");
  const tok = (id: string, role: string) => jwt.sign({ id, email: "x@x.com", role, name: "T" }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });
  const req = (qs: string, t: string) => new NextRequest(`http://x/api/user/students?${qs}`, { headers: { authorization: `Bearer ${t}` } });

  let d = await (await GET(req("role=STUDENT", tok("t1", "TEACHER")))).json();
  assert.equal(d.total, 1, "default: active only");
  d = await (await GET(req("role=STUDENT&includeInactive=1", tok("t1", "TEACHER")))).json();
  assert.equal(d.total, 2, "teacher can include inactive");
  assert.equal(d.users[0].student.grade, "Class 5");
  assert.ok(seen[seen.length - 1].select.student, "grade is selected for staff");
  const r = await GET(req("role=STUDENT&includeInactive=1", tok("s9", "STUDENT")));
  assert.equal(r.status, 403, "students cannot read the roster");
  const r2 = await GET(req("role=TEACHER&includeInactive=1", tok("s9", "STUDENT")));
  assert.equal(r2.status, 200);
  assert.ok(!seen[seen.length - 1].select.student, "students never get the staff fields");
  assert.equal(seen[seen.length - 1].where.isActive, true, "students cannot list inactive accounts");
  console.log("STUDENT DIRECTORY API TESTS PASSED");
}
main().catch((e) => { console.error(e); process.exit(1); });

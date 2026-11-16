import jwt from "jsonwebtoken";
import assert from "node:assert/strict";

process.env.NEXTAUTH_SECRET = "test-secret";

const updates: any[] = [];
const OWN = "a-own";
(globalThis as any).prismaGlobal = {
  user: { findUnique: async ({ where }: any) => ({ id: where.id, email: "x@x.com", role: "TEACHER", name: "T", isActive: true }) },
  teacher: { findUnique: async ({ where }: any) => (where.userId === "t1" ? { id: "T1" } : where.userId === "t2" ? { id: "T2" } : null) },
  assignmentV2: {
    findFirst: async ({ where }: any) => (where.id === OWN && where.teacherId === "T1" ? { id: OWN, title: "old" } : null),
    update: async (args: any) => { updates.push(args); return { id: args.where.id, ...args.data }; },
  },
  $disconnect: async () => {},
};

async function main() {
  const route = await import("@/app/api/teacher/assignments/route");
  const { NextRequest } = await import("next/server");
  const tok = (id: string) => jwt.sign({ id, email: "x@x.com", role: "TEACHER", name: "T" }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });
  const put = (token: string, body: any) =>
    new NextRequest("http://x/api/teacher/assignments", {
      method: "PUT",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  assert.equal((await route.PUT(put("bad.token", { id: OWN, title: "x" }))).status, 401);
  assert.equal((await route.PUT(put(tok("t1"), { title: "x" }))).status, 400, "id required");
  assert.equal((await route.PUT(put(tok("t2"), { id: OWN, title: "hacked" }))).status, 404, "other teacher cannot edit");
  assert.equal((await route.PUT(put(tok("nobody"), { id: OWN, title: "x" }))).status, 404, "no teacher profile");
  assert.equal(updates.length, 0, "rejected requests never write");

  assert.equal((await route.PUT(put(tok("t1"), { id: OWN, title: "   " }))).status, 400, "blank title");
  assert.equal((await route.PUT(put(tok("t1"), { id: OWN, dueDate: "nonsense" }))).status, 400, "bad date");
  assert.equal((await route.PUT(put(tok("t1"), { id: OWN, fileUrl: "https://f/x.pdf" }))).status, 400, "file url needs name");
  assert.equal((await route.PUT(put(tok("t1"), { id: OWN }))).status, 400, "nothing to update");
  assert.equal(updates.length, 0);

  const ok = await route.PUT(put(tok("t1"), { id: OWN, title: " New title ", class: "Class 10", dueDate: "2026-12-01T18:29:59.999Z", isPublished: false, teacherId: "T2" }));
  assert.equal(ok.status, 200);
  assert.equal(updates.length, 1);
  assert.deepEqual(Object.keys(updates[0].data).sort(), ["class", "dueDate", "title"], "only whitelisted fields; isPublished/teacherId ignored");
  assert.equal(updates[0].data.title, "New title");
  assert.ok(updates[0].data.dueDate instanceof Date);
  assert.deepEqual(updates[0].where, { id: OWN });

  const f = await route.PUT(put(tok("t1"), { id: OWN, fileUrl: "https://f/n.pdf", fileName: "n.pdf", fileSize: "1 MB" }));
  assert.equal(f.status, 200);
  assert.equal(updates[1].data.fileName, "n.pdf");
  console.log("teacher assignments PUT OK");
}
main().catch((e) => { console.error(e); process.exit(1); });

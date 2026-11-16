import jwt from "jsonwebtoken";
import assert from "node:assert/strict";

process.env.NEXTAUTH_SECRET = "test-secret";

// ---- fake database -------------------------------------------------------------------------------------
const calls: Record<string, any[]> = { findMany: [], create: [], update: [], updateMany: [], delete: [], findFirst: [] };
let failFindMany = false;
const mine = new Set(["own-1"]); // message ids that belong to teacher t1
const row = (id: string, minute: number, sender = "t2") => ({
  id, content: id, fileUrl: null, fileName: null, fileType: null, fileSize: null, isRead: false, readBy: [],
  createdAt: new Date(2026, 10, 14, 9, minute), updatedAt: new Date(2026, 10, 14, 9, minute), senderId: sender,
  sender: { id: sender, name: sender, avatar: null },
});

(globalThis as any).prismaGlobal = {
  user: {
    findUnique: async ({ where }: any) => ({ id: where.id, email: "x@x.com", role: where.id.startsWith("s") ? "STUDENT" : "TEACHER", name: "T", isActive: true }),
    findMany: async () => ["a", "b", "c", "d", "e"].map((n) => ({ id: `t-${n}`, name: `Teacher ${n}`, avatar: null })),
  },
  pushToken: { findMany: async () => [], deleteMany: async () => ({ count: 0 }) },
  teacherChatMessage: {
    findMany: async (args: any) => {
      calls.findMany.push(args);
      if (failFindMany) throw new Error("SECRET db password leaked");
      // newest first, like the real query: return limit+1 rows when asked to
      return [row("m3", 3), row("m2", 2), row("m1", 1)].slice(0, args.take);
    },
    findFirst: async (args: any) => { calls.findFirst.push(args); return mine.has(args.where.id) && args.where.senderId === "t1" ? { id: args.where.id } : null; },
    create: async (args: any) => { calls.create.push(args); return { ...row("new", 5, args.data.senderId), ...args.data }; },
    update: async (args: any) => { calls.update.push(args); return { id: args.where.id, content: args.data.content, updatedAt: new Date() }; },
    updateMany: async (args: any) => { calls.updateMany.push(args); return { count: 1 }; },
    delete: async (args: any) => { calls.delete.push(args); return {}; },
  },
  $disconnect: async () => {},
};

async function main() {
  const route = await import("@/app/api/teacher/chat/route");
  const { NextRequest } = await import("next/server");
  const tok = (id: string, role: string) => jwt.sign({ id, email: "x@x.com", role, name: "T" }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });
  const T1 = tok("t1", "TEACHER");
  const mk = (method: string, qs: string, token: string | null, body?: any) =>
    new NextRequest(`http://x/api/teacher/chat${qs}`, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  // 1) not signed in -> 401 on every verb (PUT used to work for anyone).
  //    "Not signed in" = an invalid bearer token (a request with no header falls through to next-auth's cookie
  //    session, which only exists inside the Next runtime).
  for (const [name, fn, body] of [
    ["GET", route.GET, undefined], ["POST", route.POST, { content: "x" }], ["PUT", route.PUT, { messageId: "own-1", content: "hacked" }],
    ["PATCH", route.PATCH, { messageIds: ["a"] }], ["DELETE", route.DELETE, undefined],
  ] as const) {
    const r = await (fn as any)(mk(name, name === "DELETE" ? "?id=own-1" : "", "not.a.valid.token", body));
    assert.equal(r.status, 401, `${name} without a token must be 401`);
  }
  assert.equal(calls.update.length, 0, "unauthenticated PUT must not touch the database");

  // 2) a student is signed in but not a teacher -> 403 (not 401: the app logs out on 401)
  const S = tok("s9", "STUDENT");
  assert.equal((await route.GET(mk("GET", "", S))).status, 403);
  assert.equal((await route.PUT(mk("PUT", "", S, { messageId: "own-1", content: "x" }))).status, 403);
  assert.equal((await route.POST(mk("POST", "", S, { content: "x" }))).status, 403);

  // 3) GET: limit clamp, hasMore, oldest-first, teacherCount, `before`
  let r = await route.GET(mk("GET", "?limit=999999", T1));
  assert.equal(calls.findMany.at(-1).take, 201, "limit is clamped to 200 (+1 to detect hasMore)");
  r = await route.GET(mk("GET", "?limit=abc", T1));
  assert.equal(calls.findMany.at(-1).take, 51, "bad limit falls back to 50");
  r = await route.GET(mk("GET", "?limit=2", T1));
  let d = await r.json();
  assert.equal(d.hasMore, true, "3 rows for limit 2 means older messages exist");
  assert.deepEqual(d.messages.map((m: any) => m.id), ["m2", "m3"], "page is oldest first and cut to the limit");
  assert.equal(d.meta.teacherCount, 5);
  assert.equal(d.meta.teachers.length, 5, "the members list comes with the first page");
  assert.ok(d.messages[0].updatedAt, "updatedAt is returned (needed for the edited label)");
  assert.equal(d.messages[0].isSelf, false);
  r = await route.GET(mk("GET", "?limit=2&before=2026-11-14T09:02:00.000Z", T1));
  d = await r.json();
  assert.ok(calls.findMany.at(-1).where.createdAt.lt instanceof Date, "before becomes a createdAt < filter");
  assert.equal(d.meta, undefined, "no count query on older pages");
  assert.equal((await route.GET(mk("GET", "?before=not-a-date", T1))).status, 400);

  // 4) POST validation
  assert.equal((await route.POST(mk("POST", "", T1, { content: "   " }))).status, 400, "empty");
  assert.equal((await route.POST(mk("POST", "", T1, { content: "x".repeat(4001) }))).status, 400, "too long");
  assert.equal((await route.POST(mk("POST", "", T1, { content: "hi", fileUrl: "javascript:alert(1)" }))).status, 400, "javascript: url");
  assert.equal((await route.POST(mk("POST", "", T1, { content: "hi", fileUrl: "file:///etc/passwd" }))).status, 400, "file: url");
  r = await route.POST(mk("POST", "", T1, { content: "  hello  " }));
  assert.equal(r.status, 201);
  assert.equal(calls.create.at(-1).data.content, "hello", "content is trimmed");
  assert.equal(calls.create.at(-1).data.senderId, "t1", "sender comes from the session, never the body");
  r = await route.POST(mk("POST", "", T1, { content: "", fileUrl: "https://cdn.x/a.pdf", fileName: "a.pdf", fileType: "pdf", fileSize: "0.82 MB" }));
  assert.equal(r.status, 201, "file-only message is allowed");
  assert.equal(calls.create.at(-1).data.fileName, "a.pdf");
  r = await route.POST(mk("POST", "", T1, { content: "hi", fileName: "ignored.pdf", fileType: "pdf" }));
  assert.equal(calls.create.at(-1).data.fileName, null, "file metadata is dropped when there is no file");

  // 5) PUT: only your own message
  r = await route.PUT(mk("PUT", "", T1, { messageId: "someone-elses", content: "hijack" }));
  assert.equal(r.status, 404);
  assert.equal(calls.update.length, 0, "editing another teacher's message must not update anything");
  assert.equal((await route.PUT(mk("PUT", "", T1, { messageId: "own-1", content: "   " }))).status, 400);
  assert.equal((await route.PUT(mk("PUT", "", T1, { messageId: "own-1", content: "x".repeat(4001) }))).status, 400);
  r = await route.PUT(mk("PUT", "", T1, { messageId: "own-1", content: "  fixed  " }));
  assert.equal(r.status, 200);
  assert.equal(calls.update.at(-1).data.content, "fixed");
  assert.ok((await r.json()).message.updatedAt, "edit returns updatedAt");

  // 6) PATCH mark read
  assert.equal((await route.PATCH(mk("PATCH", "", T1, { messageIds: [] }))).status, 400);
  assert.equal((await route.PATCH(mk("PATCH", "", T1, { messageIds: [1, 2] }))).status, 400);
  assert.equal((await route.PATCH(mk("PATCH", "", T1, { messageIds: Array.from({ length: 201 }, (_, i) => `m${i}`) }))).status, 400);
  assert.equal((await route.PATCH(mk("PATCH", "", T1, { messageIds: ["m1", "m2"] }))).status, 200);
  const w = calls.updateMany.at(-1).where;
  assert.deepEqual(w.senderId, { not: "t1" }, "never marks own messages");
  assert.deepEqual(w.NOT, { readBy: { has: "t1" } }, "never adds the same reader twice");

  // 7) DELETE: only your own
  assert.equal((await route.DELETE(mk("DELETE", "?id=someone-elses", T1))).status, 404);
  assert.equal(calls.delete.length, 0);
  assert.equal((await route.DELETE(mk("DELETE", "", T1))).status, 400);
  assert.equal((await route.DELETE(mk("DELETE", "?id=own-1", T1))).status, 200);
  assert.equal(calls.delete.length, 1);

  // 8) errors do not leak internals
  failFindMany = true;
  r = await route.GET(mk("GET", "", T1));
  assert.equal(r.status, 500);
  const text = JSON.stringify(await r.json());
  assert.ok(!text.includes("SECRET") && !text.includes("details"), "500 must not leak error.message");
  failFindMany = false;

  // 9) rate limit: a teacher cannot flood the room (30 / minute)
  let limited = 0;
  for (let i = 0; i < 40; i++) {
    const x = await route.POST(mk("POST", "", T1, { content: `spam ${i}` }));
    if (x.status === 429) limited++;
  }
  assert.ok(limited >= 5, `expected the flood to be rate limited (got ${limited} x 429)`);

  console.log("TEACHER CHAT API TESTS PASSED");
}
main().catch((e) => { console.error(e); process.exit(1); });

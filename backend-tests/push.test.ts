import jwt from "jsonwebtoken";
import assert from "node:assert/strict";

process.env.NEXTAUTH_SECRET = "test-secret";

const TOK_A = "ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]";
const TOK_B = "ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]";
const TOK_DEAD = "ExponentPushToken[dead_dead_dead_dead_]";

// ---- fake database ----------------------------------------------------------------------------------
const db = {
  tokens: [] as { token: string; userId: string; chatMuted: boolean; platform: string | null }[],
  tokenFind: [] as any[], deleted: [] as string[], created: [] as any[],
};
(globalThis as any).prismaGlobal = {
  user: {
    findUnique: async ({ where }: any) => ({ id: where.id, email: "x@x.com", role: where.id.startsWith("s") ? "STUDENT" : "TEACHER", name: "T", isActive: true }),
    findMany: async () => [],
  },
  pushToken: {
    upsert: async ({ where, create, update }: any) => {
      let r = db.tokens.find((t) => t.token === where.token);
      if (r) Object.assign(r, update); else { r = { chatMuted: false, ...create }; db.tokens.push(r!); }
      return { chatMuted: r!.chatMuted };
    },
    deleteMany: async ({ where }: any) => {
      const before = db.tokens.length;
      const list: string[] = where.token.in ?? [where.token];
      db.tokens = db.tokens.filter((t) => !(list.includes(t.token) && (!where.userId || t.userId === where.userId)));
      list.forEach((t) => db.deleted.push(t));
      return { count: before - db.tokens.length };
    },
    updateMany: async ({ where, data }: any) => {
      const hit = db.tokens.filter((t) => t.token === where.token && t.userId === where.userId);
      hit.forEach((t) => Object.assign(t, data));
      return { count: hit.length };
    },
    findFirst: async ({ where }: any) => db.tokens.find((t) => t.token === where.token && t.userId === where.userId) ?? null,
    findMany: async (args: any) => { db.tokenFind.push(args); return db.tokens.filter((t) => !t.chatMuted && t.userId !== "t1").map((t) => ({ token: t.token })); },
  },
  teacherChatMessage: {
    create: async (args: any) => { db.created.push(args); return { id: "msg1", ...args.data, isRead: false, readBy: [], createdAt: new Date(), updatedAt: new Date(), sender: { id: args.data.senderId, name: "Asha Sharma", avatar: null } }; },
  },
  $disconnect: async () => {},
};

// ---- fake Expo ------------------------------------------------------------------------------------------
const expo = { calls: [] as any[], mode: "ok" as "ok" | "down" | "dead" };
(globalThis as any).fetch = async (url: string, init: any) => {
  if (!String(url).includes("exp.host")) throw new Error("unexpected network call " + url);
  expo.calls.push(JSON.parse(init.body));
  if (expo.mode === "down") throw new Error("network down");
  const msgs = JSON.parse(init.body);
  return { ok: true, status: 200, json: async () => ({ data: msgs.map((m: any) => (expo.mode === "dead" && m.to === TOK_DEAD ? { status: "error", details: { error: "DeviceNotRegistered" } } : { status: "ok", id: "r" })) }) } as any;
};

async function main() {
  const reg = await import("@/app/api/push/register/route");
  const chat = await import("@/app/api/teacher/chat/route");
  const push = await import("@/lib/push");
  const { NextRequest } = await import("next/server");
  const tok = (id: string, role: string) => jwt.sign({ id, email: "x@x.com", role, name: "T" }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });
  const T1 = tok("t1", "TEACHER"), T2 = tok("t2", "TEACHER");
  const mk = (path: string, method: string, token: string | null, body?: any) =>
    new NextRequest(`http://x${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

  // pure helpers
  assert.ok(push.isExpoPushToken(TOK_A) && push.isExpoPushToken("ExpoPushToken[abc-DEF_1]"));
  for (const bad of ["", "abc", "ExponentPushToken[]", "ExponentPushToken[a b]", 5, null, "ExponentPushToken[" + "a".repeat(300) + "]"]) assert.ok(!push.isExpoPushToken(bad as any), String(bad));
  assert.equal(push.chatPreview("  hello \n  world ", false), "hello world");
  assert.equal(push.chatPreview("", true), "Sent an attachment");
  assert.equal(push.chatPreview("   ", false), "New message");
  assert.equal(push.chatPreview("x".repeat(500), false).length, 140);
  console.log("  01. token validation + preview text");

  // register: auth + validation
  assert.equal((await reg.POST(mk("/api/push/register", "POST", "not.a.valid.token", { token: TOK_A }))).status, 401);
  assert.equal((await reg.POST(mk("/api/push/register", "POST", T1, { token: "nope" }))).status, 400);
  let r = await reg.POST(mk("/api/push/register", "POST", T1, { token: TOK_A, platform: "android" }));
  assert.equal(r.status, 200);
  assert.deepEqual(db.tokens.map((t) => [t.token, t.userId]), [[TOK_A, "t1"]]);
  console.log("  02. register: 401 signed out, 400 bad token, saved for the teacher");

  // same phone signs into another account: the token MOVES, never duplicates
  await reg.POST(mk("/api/push/register", "POST", T2, { token: TOK_A }));
  assert.deepEqual(db.tokens.map((t) => [t.token, t.userId]), [[TOK_A, "t2"]]);
  console.log("  03. same phone, other account: token moves (no duplicate)");

  // mute / status / unregister are scoped to the owner
  assert.equal((await reg.PATCH(mk("/api/push/register", "PATCH", T1, { token: TOK_A, chatMuted: true }))).status, 404, "another account cannot mute it");
  assert.equal((await reg.PATCH(mk("/api/push/register", "PATCH", T2, { token: TOK_A, chatMuted: "yes" }))).status, 400);
  assert.equal((await reg.PATCH(mk("/api/push/register", "PATCH", T2, { token: TOK_A, chatMuted: true }))).status, 200);
  let st = await (await reg.GET(mk(`/api/push/register?token=${encodeURIComponent(TOK_A)}`, "GET", T2))).json();
  assert.deepEqual([st.registered, st.chatMuted], [true, true]);
  await reg.DELETE(mk("/api/push/register", "DELETE", T1, { token: TOK_A }));
  assert.equal(db.tokens.length, 1, "someone else cannot delete my token");
  await reg.DELETE(mk("/api/push/register", "DELETE", T2, { token: TOK_A }));
  assert.equal(db.tokens.length, 0);
  console.log("  04. mute/status/sign-out only work for the token's owner");

  // chat POST -> push to the OTHER teachers
  db.tokens = [
    { token: TOK_A, userId: "t2", chatMuted: false, platform: "android" },
    { token: TOK_B, userId: "t3", chatMuted: false, platform: "ios" },
    { token: "ExponentPushToken[mutedmutedmutedmuted]", userId: "t4", chatMuted: true, platform: "android" },
    { token: "ExponentPushToken[selfselfselfselfself]", userId: "t1", chatMuted: false, platform: "android" },
  ];
  expo.calls.length = 0;
  r = await chat.POST(mk("/api/teacher/chat", "POST", T1, { content: "Meeting at 4 pm in staff room" }));
  assert.equal(r.status, 201);
  assert.equal(expo.calls.length, 1, "one request to Expo");
  const sent = expo.calls[0];
  assert.deepEqual(sent.map((m: any) => m.to).sort(), [TOK_A, TOK_B].sort(), "other teachers only: not the sender, not muted");
  assert.equal(sent[0].body, "Meeting at 4 pm in staff room");
  assert.equal(sent[0].title, "Asha Sharma · Teacher Chat");
  assert.deepEqual(sent[0].data, { type: "teacher-chat", messageId: "msg1" });
  assert.equal(sent[0].channelId, "chat");
  const where = db.tokenFind.at(-1).where;
  assert.deepEqual([where.chatMuted, where.user.role, where.user.id], [false, "TEACHER", { not: "t1" }]);
  console.log("  05. new chat message -> push to the other teachers (not sender, not muted)");

  // attachment-only message
  expo.calls.length = 0;
  await chat.POST(mk("/api/teacher/chat", "POST", T1, { content: "", fileUrl: "https://x.com/a.pdf", fileName: "a.pdf" }));
  assert.equal(expo.calls[0][0].body, "Sent an attachment");
  console.log("  06. attachment-only message has a readable body");

  // Expo down: the message is still saved and returned
  expo.mode = "down"; db.created.length = 0;
  r = await chat.POST(mk("/api/teacher/chat", "POST", T1, { content: "still delivered" }));
  assert.equal(r.status, 201); assert.equal(db.created.length, 1);
  console.log("  07. Expo down: message still saved (201)");

  // dead token is cleaned up
  expo.mode = "dead";
  db.tokens.push({ token: TOK_DEAD, userId: "t5", chatMuted: false, platform: "android" });
  await chat.POST(mk("/api/teacher/chat", "POST", T1, { content: "hi" }));
  assert.ok(!db.tokens.some((t) => t.token === TOK_DEAD), "DeviceNotRegistered token removed");
  assert.ok(db.tokens.some((t) => t.token === TOK_A), "healthy tokens stay");
  console.log("  08. DeviceNotRegistered tokens are removed");

  // 250 recipients -> 3 requests of <=100
  expo.mode = "ok"; expo.calls.length = 0;
  db.tokens = Array.from({ length: 250 }, (_, i) => ({ token: `ExponentPushToken[t${String(i).padStart(6, "0")}]`, userId: `u${i}`, chatMuted: false, platform: "android" }));
  await chat.POST(mk("/api/teacher/chat", "POST", T1, { content: "all hands" }));
  assert.deepEqual(expo.calls.map((c) => c.length), [100, 100, 50]);
  console.log("  09. 250 teachers -> Expo batches of 100");

  console.log("\nPUSH SCENARIOS PASSED (9)");
}
main().catch((e) => { console.error(e); process.exit(1); });

import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
process.env.NEXTAUTH_SECRET = "test-secret";

type Row = Record<string, any>;
const p2002 = () => Object.assign(new Error("Unique"), { code: "P2002" });
const users: Row = {
  amit: { id: "amit", name: "Amit", avatar: null, role: "STUDENT" },
  riya: { id: "riya", name: "Riya", avatar: null, role: "STUDENT" },
  sir: { id: "sir", name: "Ravi Sir", avatar: null, role: "TEACHER" },
};
const students: Row = { amit: { id: "s_amit", userId: "amit" }, riya: { id: "s_riya", userId: "riya" } };
const doubts: Row[] = [
  { id: "d1", title: "Open one", description: "x", subject: "Physics", class: null, priority: "normal", status: "open", isSolved: false, views: 0, upvotes: 0, createdAt: new Date("2026-11-05"), studentId: "s_amit", imageUrl: null, pdfUrl: null },
  { id: "d2", title: "Solved of Riya", description: "x", subject: "Maths", class: null, priority: "normal", status: "solved", isSolved: true, views: 5, upvotes: 0, createdAt: new Date("2026-11-04"), studentId: "s_riya", imageUrl: null, pdfUrl: null },
];
const replies: Row[] = [
  { id: "r1", doubtId: "d1", userId: "sir", content: "Use Fleming", isPinned: false, isAccepted: false, upvotes: 0, createdAt: new Date("2026-11-05T10:00:00Z") },
  { id: "r2", doubtId: "d2", userId: "amit", content: "other doubt", isPinned: false, isAccepted: false, upvotes: 0, createdAt: new Date("2026-11-05T11:00:00Z") },
];
const dUp: Row[] = [];
const rUp: Row[] = [];
let raceOnNextDoubtVote = false;

const sidOf = (d: Row) => ({ user: users[Object.values(students).find((s: any) => s.id === d.studentId)!.userId] });
const withInc = (d: Row, uid: string, replyList = true) => ({
  ...d,
  student: sidOf(d),
  upvotedBy: dUp.filter((u) => u.doubtId === d.id && u.userId === uid).map((u) => ({ id: u.doubtId + u.userId })),
  _count: { replies: replies.filter((r) => r.doubtId === d.id).length, upvotedBy: dUp.filter((u) => u.doubtId === d.id).length },
  replies: replyList
    ? replies.filter((r) => r.doubtId === d.id).map((r) => ({ ...r, user: users[r.userId], upvotedBy: rUp.filter((u) => u.replyId === r.id && u.userId === uid).map(() => ({ id: "x" })) }))
    : undefined,
});
let explode = false;

(globalThis as any).prismaGlobal = {
  $disconnect: async () => {},
  user: { findUnique: async ({ where }: any) => ({ id: where.id, email: where.id + "@x.com", role: users[where.id].role, name: users[where.id].name, isActive: true }) },
  student: { findUnique: async ({ where }: any) => students[where.userId] ?? null },
  doubt: {
    findMany: async () => { if (explode) throw new Error("db password leaked"); return doubts.map((d) => withInc(d, currentUid)).sort((a, b) => +b.createdAt - +a.createdAt); },
    findUnique: async ({ where, include }: any) => {
      const d = doubts.find((x) => x.id === where.id);
      if (!d) return null;
      if (include?.student?.include?.user) return withInc(d, currentUid);
      if (include?.student === true) return { ...d, student: students[Object.keys(students).find((k) => students[k].id === d.studentId)!] };
      return include ? withInc(d, currentUid) : d;
    },
    create: async ({ data }: any) => { const d = { id: "d" + (doubts.length + 1), status: "open", isSolved: false, views: 0, upvotes: 0, createdAt: new Date(), ...data }; doubts.push(d); return { ...d, student: sidOf(d) }; },
    update: async ({ where, data }: any) => {
      const d = doubts.find((x) => x.id === where.id)!;
      for (const [k, v] of Object.entries<any>(data)) d[k] = v && typeof v === "object" && "increment" in v ? d[k] + v.increment : v;
      return d;
    },
    delete: async ({ where }: any) => { doubts.splice(doubts.findIndex((x) => x.id === where.id), 1); },
  },
  doubtUpvote: {
    findUnique: async ({ where }: any) => dUp.find((u) => u.doubtId === where.doubtId_userId.doubtId && u.userId === where.doubtId_userId.userId) ?? null,
    create: async ({ data }: any) => {
      const exists = dUp.some((u) => u.doubtId === data.doubtId && u.userId === data.userId);
      if (raceOnNextDoubtVote) { raceOnNextDoubtVote = false; if (!exists) dUp.push({ ...data }); throw p2002(); }
      if (exists) throw p2002();
      dUp.push({ ...data });
    },
    deleteMany: async ({ where }: any) => { for (let i = dUp.length - 1; i >= 0; i--) if (dUp[i].doubtId === where.doubtId && dUp[i].userId === where.userId) dUp.splice(i, 1); },
    count: async ({ where }: any) => dUp.filter((u) => u.doubtId === where.doubtId).length,
  },
  doubtReply: {
    findUnique: async ({ where }: any) => { const r = replies.find((x) => x.id === where.id); return r ? { ...r } : null; },
    updateMany: async ({ where, data }: any) => { replies.filter((r) => r.doubtId === where.doubtId).forEach((r) => Object.assign(r, data)); },
    update: async ({ where, data }: any) => { const r = replies.find((x) => x.id === where.id)!; Object.assign(r, data); return r; },
    create: async ({ data }: any) => { const r = { id: "r" + (replies.length + 1), isPinned: false, isAccepted: false, upvotes: 0, createdAt: new Date(), ...data }; replies.push(r); return { ...r, user: users[r.userId] }; },
    delete: async ({ where }: any) => { replies.splice(replies.findIndex((x) => x.id === where.id), 1); },
  },
  doubtReplyUpvote: {
    findUnique: async ({ where }: any) => rUp.find((u) => u.replyId === where.replyId_userId.replyId && u.userId === where.replyId_userId.userId) ?? null,
    create: async ({ data }: any) => { if (rUp.some((u) => u.replyId === data.replyId && u.userId === data.userId)) throw p2002(); rUp.push({ ...data }); },
    deleteMany: async ({ where }: any) => { for (let i = rUp.length - 1; i >= 0; i--) if (rUp[i].replyId === where.replyId && rUp[i].userId === where.userId) rUp.splice(i, 1); },
    count: async ({ where }: any) => rUp.filter((u) => u.replyId === where.replyId).length,
  },
};

let currentUid = "amit";
const tok = (id: string) => jwt.sign({ id, email: id + "@x.com", role: users[id]?.role ?? "STUDENT", name: id }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });

async function main() {
  const D = await import("@/app/api/doubts/route");
  const R = await import("@/app/api/doubts/reply/route");
  const { NextRequest } = await import("next/server");
  const call = async (fn: any, as: string | null, method: string, path: string, body?: any) => {
    currentUid = as ?? "amit";
    const res = await fn(new NextRequest("http://x" + path, { method, headers: { authorization: `Bearer ${as ? tok(as) : "bad"}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }));
    return { status: res.status, json: await res.json() };
  };

  // auth
  assert.equal((await call(D.GET, null, "GET", "/api/doubts")).status, 401);

  // list: everyone sees open AND solved doubts
  let r = await call(D.GET, "amit", "GET", "/api/doubts");
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.doubts.map((d: any) => d.id), ["d1", "d2"]);
  assert.equal(r.json.doubts[0].isMyDoubt, true);
  assert.equal(r.json.doubts[1].isMyDoubt, false);
  assert.equal(r.json.doubts[0].student.name, "Amit");

  // detail: +1 view once per user (not for the asker), 404 for unknown
  r = await call(D.GET, "riya", "GET", "/api/doubts?id=d1");
  assert.equal(r.json.doubt.views, 1);
  r = await call(D.GET, "riya", "GET", "/api/doubts?id=d1");
  assert.equal(r.json.doubt.views, 1, "same user within 30 min must not inflate views");
  r = await call(D.GET, "amit", "GET", "/api/doubts?id=d1");
  assert.equal(r.json.doubt.views, 1, "asker's own visit is not a view");
  assert.equal(r.json.doubt.replies[0].user.role, "TEACHER");
  assert.equal((await call(D.GET, "amit", "GET", "/api/doubts?id=nope")).status, 404);

  // upvote toggles, counter comes from the rows, race does not crash, unknown doubt 404
  r = await call(D.PATCH, "riya", "PATCH", "/api/doubts", { doubtId: "d1", action: "upvote" });
  assert.deepEqual([r.status, r.json.upvotes, r.json.hasUpvoted], [200, 1, true]);
  r = await call(D.PATCH, "riya", "PATCH", "/api/doubts", { doubtId: "d1", action: "upvote" });
  assert.deepEqual([r.json.upvotes, r.json.hasUpvoted], [0, false]);
  raceOnNextDoubtVote = true;
  r = await call(D.PATCH, "amit", "PATCH", "/api/doubts", { doubtId: "d1", action: "upvote" });
  assert.equal(r.status, 200, "a double tap racing must not 500");
  assert.equal(r.json.upvotes, 1);
  assert.equal(doubts[0].upvotes, 1, "stored counter matches the vote rows");
  assert.equal((await call(D.PATCH, "amit", "PATCH", "/api/doubts", { doubtId: "ghost", action: "upvote" })).status, 404);

  // accept: wrong doubt's reply, non-owner, owner, undo
  assert.equal((await call(D.PATCH, "amit", "PATCH", "/api/doubts", { doubtId: "d1", action: "accept", replyId: "r2" })).status, 404, "reply of another doubt");
  assert.equal((await call(D.PATCH, "riya", "PATCH", "/api/doubts", { doubtId: "d1", action: "accept", replyId: "r1" })).status, 403);
  r = await call(D.PATCH, "amit", "PATCH", "/api/doubts", { doubtId: "d1", action: "accept", replyId: "r1" });
  assert.equal(r.status, 200);
  assert.equal(replies[0].isAccepted, true);
  assert.equal(doubts[0].isSolved, true, "accepting an answer solves the doubt");
  await call(D.PATCH, "amit", "PATCH", "/api/doubts", { doubtId: "d1", action: "accept", replyId: "r1" });
  assert.equal(replies[0].isAccepted, false, "tap again = undo");

  // pin: teacher only
  assert.equal((await call(D.PATCH, "amit", "PATCH", "/api/doubts", { doubtId: "d1", action: "pin", replyId: "r1" })).status, 403);
  assert.equal((await call(D.PATCH, "sir", "PATCH", "/api/doubts", { doubtId: "d1", action: "pin", replyId: "r1" })).status, 200);

  // solve / delete permissions
  assert.equal((await call(D.PATCH, "riya", "PATCH", "/api/doubts", { doubtId: "d1", action: "solve" })).status, 403);
  assert.equal((await call(D.DELETE, "riya", "DELETE", "/api/doubts?id=d1")).status, 403);

  // ask a doubt: validation + sanitising
  assert.equal((await call(D.POST, "amit", "POST", "/api/doubts", { title: "", description: "d", subject: "s" })).status, 400);
  assert.equal((await call(D.POST, "sir", "POST", "/api/doubts", { title: "t", description: "d", subject: "s" })).status, 404, "teachers have no student profile");
  r = await call(D.POST, "amit", "POST", "/api/doubts", { title: "T".repeat(500), description: "d", subject: "Physics", priority: "hax", imageUrl: "javascript:alert(1)", pdfUrl: "https://f/x.pdf", pdfName: "x.pdf" });
  assert.equal(r.status, 201);
  assert.equal(r.json.doubt.title.length, 120);
  assert.equal(r.json.doubt.priority, "normal");
  assert.equal(r.json.doubt.imageUrl, null);
  assert.equal(r.json.doubt.pdfUrl, "https://f/x.pdf");

  // replies: attachment-only is allowed, empty is not, like toggles, 404s
  assert.equal((await call(R.POST, "riya", "POST", "/api/doubts/reply", { doubtId: "d1", content: "  " })).status, 400);
  r = await call(R.POST, "riya", "POST", "/api/doubts/reply", { doubtId: "d1", content: "", imageUrl: "https://f/a.png", imageName: "a.png" });
  assert.equal(r.status, 201);
  assert.equal((await call(R.POST, "riya", "POST", "/api/doubts/reply", { doubtId: "ghost", content: "hi" })).status, 404);
  const rid = r.json.reply.id;
  r = await call(R.PATCH, "amit", "PATCH", "/api/doubts/reply", { replyId: rid });
  assert.deepEqual([r.json.upvotes, r.json.hasUpvoted], [1, true]);
  r = await call(R.PATCH, "amit", "PATCH", "/api/doubts/reply", { replyId: rid });
  assert.deepEqual([r.json.upvotes, r.json.hasUpvoted], [0, false]);
  assert.equal((await call(R.PATCH, "amit", "PATCH", "/api/doubts/reply", { replyId: "ghost" })).status, 404);
  assert.equal((await call(R.DELETE, "amit", "DELETE", `/api/doubts/reply?id=${rid}`)).status, 403);
  assert.equal((await call(R.DELETE, "riya", "DELETE", `/api/doubts/reply?id=${rid}`)).status, 200);

  // errors never leak internals
  explode = true;
  r = await call(D.GET, "amit", "GET", "/api/doubts");
  assert.equal(r.status, 500);
  assert.ok(!JSON.stringify(r.json).includes("password"), "500 must not leak the DB error");

  console.log("ALL DOUBT CHECKS PASSED");
}
main().catch((e) => { console.error(e); process.exit(1); });

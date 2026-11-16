import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
process.env.NEXTAUTH_SECRET = "test-secret";

// ---- fake database -------------------------------------------------------------------------------------------
type Row = Record<string, any>;
const teacher = { user: { name: "Amit Sir", avatar: null } };
const notes: Row[] = [
  { id: "n1", title: "Real Numbers", description: null, subject: "Mathematics", class: "10", topic: null, chapter: "1", fileUrl: "https://f/1.pdf", fileName: "1.pdf", fileType: "pdf", fileSize: "2.1 MB", thumbnailUrl: null, isPinned: false, isPublished: true, downloads: 0, views: 0, createdAt: new Date("2026-11-01"), teacher },
  { id: "n2", title: "Ancient India", description: null, subject: "History", class: "10", topic: null, chapter: "2", fileUrl: "https://f/2.pdf", fileName: "2.pdf", fileType: "pdf", fileSize: "1.8 MB", thumbnailUrl: null, isPinned: true, isPublished: true, downloads: 0, views: 0, createdAt: new Date("2026-10-01"), teacher },
  { id: "draft", title: "Unpublished", description: null, subject: "Physics", class: "10", topic: null, chapter: null, fileUrl: "https://f/3.pdf", fileName: "3.pdf", fileType: "pdf", fileSize: "1 MB", thumbnailUrl: null, isPinned: false, isPublished: false, downloads: 0, views: 0, createdAt: new Date(), teacher },
];
const bookmarks: { noteId: string; studentId: string }[] = [];
let raceOnNextCreate = false; // simulates two phones bookmarking at the same instant

const p2002 = () => Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
const prismaFake: any = {
  $disconnect: async () => {},
  user: { findUnique: async ({ where }: any) => ({ id: where.id, email: where.id + "@x.com", role: where.id === "teacher1" ? "TEACHER" : "STUDENT", name: "N " + where.id, isActive: where.id !== "banned" }) },
  student: { findUnique: async ({ where }: any) => (["teacher1", "ghost"].includes(where.userId) ? null : { id: "stu_" + where.userId, userId: where.userId }) },
  note: {
    findMany: async (args: any) => {
      const bm = args.include?.bookmarks;
      return notes
        .filter((n) => n.isPublished === args.where.isPublished)
        .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.createdAt - a.createdAt)
        .map((n) => ({
          ...n,
          bookmarks: bm ? bookmarks.filter((b) => b.noteId === n.id && b.studentId === bm.where.studentId).map((b) => ({ id: b.noteId + b.studentId })) : undefined,
          _count: { bookmarks: bookmarks.filter((b) => b.noteId === n.id).length },
        }));
    },
    findFirst: async ({ where }: any) => notes.find((n) => n.id === where.id && n.isPublished === where.isPublished) ?? null,
    updateMany: async ({ where, data }: any) => {
      const n = notes.find((x) => x.id === where.id && x.isPublished === where.isPublished);
      if (!n) return { count: 0 };
      if (data.views) n.views += data.views.increment;
      if (data.downloads) n.downloads += data.downloads.increment;
      return { count: 1 };
    },
  },
  noteBookmark: {
    findUnique: async ({ where }: any) => bookmarks.find((b) => b.noteId === where.noteId_studentId.noteId && b.studentId === where.noteId_studentId.studentId) ?? null,
    create: async ({ data }: any) => {
      const exists = bookmarks.some((b) => b.noteId === data.noteId && b.studentId === data.studentId);
      if (raceOnNextCreate) { raceOnNextCreate = false; if (!exists) bookmarks.push({ ...data }); throw p2002(); }
      if (exists) throw p2002();
      bookmarks.push({ ...data });
      return data;
    },
    deleteMany: async ({ where }: any) => {
      const before = bookmarks.length;
      for (let i = bookmarks.length - 1; i >= 0; i--) if (bookmarks[i].noteId === where.noteId && bookmarks[i].studentId === where.studentId) bookmarks.splice(i, 1);
      return { count: before - bookmarks.length };
    },
  },
};
(globalThis as any).prismaGlobal = prismaFake;

const tok = (id: string) => jwt.sign({ id, email: id + "@x.com", role: id === "teacher1" ? "TEACHER" : "STUDENT", name: "x" }, "test-secret", { algorithm: "HS256" });

async function main() {
  const { GET, POST, PATCH } = await import("@/app/api/student/notes/route");
  const { NextRequest } = await import("next/server");
  const req = (method: string, body: any, id?: string) =>
    new NextRequest("http://x/api/student/notes", { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }), headers: { "content-type": "application/json", authorization: `Bearer ${id ? tok(id) : "invalid"}` } });
  const get = (id?: string) => GET(req("GET", undefined, id));
  const patch = (body: any, id?: string) => PATCH(req("PATCH", body, id));
  const post = (body: any, id?: string) => POST(req("POST", body, id));
  const quiet = async <T>(f: () => Promise<T>) => { const e = console.error; console.error = () => {}; try { return await f(); } finally { console.error = e; } };

  // ---------- GET ----------
  assert.equal((await get()).status, 401);
  assert.equal((await get("banned")).status, 401, "deactivated account is locked out");
  let r = await get("alice"); let j: any = await r.json();
  assert.equal(r.status, 200);
  assert.deepEqual(j.notes.map((n: any) => n.id), ["n2", "n1"], "published only, pinned first");
  assert.ok(j.notes.every((n: any) => n.isBookmarked === false));
  assert.equal(j.notes[0].teacher.name, "Amit Sir");
  j = await (await get("teacher1")).json();
  assert.equal(j.notes.length, 2, "a teacher without a student profile can still list notes");
  assert.ok(j.notes.every((n: any) => n.isBookmarked === false));

  // ---------- PATCH (bookmark) ----------
  assert.equal((await patch({ noteId: "n1" })).status, 401);
  assert.equal((await patch({}, "alice")).status, 400);
  assert.equal((await patch({ noteId: 123 }, "alice")).status, 400, "non-string id rejected");
  assert.equal((await patch({ noteId: "nope" }, "alice")).status, 404);
  assert.equal((await patch({ noteId: "draft" }, "alice")).status, 404, "unpublished note cannot be bookmarked");
  assert.equal((await patch({ noteId: "n1" }, "ghost")).status, 404, "no student profile");
  assert.equal((await patch("not json" as any, "alice")).status, 400);

  // idempotent "set" semantics (what the mobile app sends)
  r = await patch({ noteId: "n1", bookmarked: true }, "alice"); j = await r.json();
  assert.deepEqual([r.status, j.bookmarked, j.action], [200, true, "added"]);
  r = await patch({ noteId: "n1", bookmarked: true }, "alice"); j = await r.json();
  assert.deepEqual([r.status, j.bookmarked], [200, true], "repeating the same request is harmless");
  assert.equal(bookmarks.filter((b) => b.noteId === "n1" && b.studentId === "stu_alice").length, 1);
  j = await (await get("alice")).json();
  assert.equal(j.notes.find((n: any) => n.id === "n1").isBookmarked, true);
  assert.equal(j.notes.find((n: any) => n.id === "n1").stats.totalBookmarks, 1);
  assert.equal((await (await get("bob")).json()).notes.find((n: any) => n.id === "n1").isBookmarked, false, "bookmarks are per student");
  r = await patch({ noteId: "n1", bookmarked: false }, "alice"); j = await r.json();
  assert.deepEqual([r.status, j.bookmarked, j.action], [200, false, "removed"]);
  r = await patch({ noteId: "n1", bookmarked: false }, "alice"); j = await r.json();
  assert.deepEqual([r.status, j.bookmarked], [200, false], "removing twice is harmless");
  assert.equal(bookmarks.length, 0);

  // legacy toggle (what the website still sends)
  assert.equal((await (await patch({ noteId: "n2" }, "alice")).json()).bookmarked, true);
  assert.equal((await (await patch({ noteId: "n2" }, "alice")).json()).bookmarked, false);

  // race: a parallel request created the row first -> still success, still exactly one row
  raceOnNextCreate = true;
  r = await patch({ noteId: "n1", bookmarked: true }, "bob"); j = await r.json();
  assert.deepEqual([r.status, j.bookmarked], [200, true]);
  assert.equal(bookmarks.filter((b) => b.studentId === "stu_bob").length, 1);

  // ---------- POST (view / download tracking) ----------
  assert.equal((await post({ noteId: "n1", action: "view" })).status, 401);
  assert.equal((await post({ action: "view" }, "carol")).status, 400);
  assert.equal((await post({ noteId: "n1", action: "hack" }, "carol")).status, 400);
  assert.equal((await post({ noteId: "ghost-note", action: "view" }, "carol")).status, 404, "missing note is a clean 404, not a 500");
  assert.equal((await post({ noteId: "draft", action: "view" }, "carol")).status, 404, "unpublished note is not trackable");

  r = await post({ noteId: "n1", action: "view" }, "carol"); j = await r.json();
  assert.deepEqual([r.status, j.success, j.counted], [200, true, true]);
  assert.equal(notes[0].views, 1);
  await post({ noteId: "n1", action: "download" }, "carol");
  assert.deepEqual([notes[0].views, notes[0].downloads], [1, 1], "views and downloads are separate counters");

  // 5 per student per note per hour; the rest "succeed" silently but are not counted
  for (let i = 0; i < 12; i++) await post({ noteId: "n2", action: "view" }, "spammer");
  assert.equal(notes[1].views, 5, "a student can add at most 5 views to one note per hour");
  r = await post({ noteId: "n2", action: "view" }, "spammer"); j = await r.json();
  assert.deepEqual([r.status, j.success, j.counted], [200, true, false]);
  await post({ noteId: "n2", action: "view" }, "dave");
  assert.equal(notes[1].views, 6, "another student is not affected by the first one's limit");
  await post({ noteId: "n1", action: "view" }, "spammer");
  assert.equal(notes[0].views, 2, "the limit is per note");

  // errors never leak internals
  const savedFind = prismaFake.note.findMany;
  prismaFake.note.findMany = async () => { throw new Error("connection string postgres://secret"); };
  r = await quiet(() => get("alice")); j = await r.json();
  assert.equal(r.status, 500);
  assert.deepEqual(Object.keys(j), ["error"], "500 body has only a generic message");
  assert.ok(!JSON.stringify(j).includes("secret"));
  prismaFake.note.findMany = savedFind;

  console.log("\nALL STUDENT-NOTES API CHECKS PASSED");
}
main().catch((e) => { console.error(e); process.exit(1); });

import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
process.env.NEXTAUTH_SECRET = "test-secret";
const users: any[] = [{ id: "u1", email: "Asha@Mail.com", name: "Asha", role: "STUDENT", isActive: true, avatar: null, password: bcrypt.hashSync("secret12", 4) }];
(globalThis as any).prismaGlobal = {
  $disconnect: async () => {},
  user: {
    findFirst: async ({ where }: any) => users.find((u) => u.email.toLowerCase() === where.email.equals.toLowerCase()) ?? null,
    create: async ({ data }: any) => { const u = { id: "n" + users.length, ...data }; users.push(u); return u; },
  },
};
async function main() {
  const reg = (await import("@/app/api/auth/register/route")).POST;
  const login = (await import("@/app/api/auth/mobile-login/route")).POST;
  const { NextRequest } = await import("next/server");
  const call = (fn: any, body: any, ip = "1.1.1.1") => fn(new NextRequest("http://x", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-forwarded-for": ip } }));

  // teacher registration needs the server-side code
  const t = { name: "T", email: "t@x.com", password: "abcdef", role: "TEACHER" };
  assert.equal((await call(reg, t)).status, 403, "no env code configured -> teacher signup disabled");
  process.env.TEACHER_REGISTRATION_CODE = "P8YGJCVR2";
  assert.equal((await call(reg, t)).status, 403, "missing code");
  assert.equal((await call(reg, { ...t, teacherCode: "wrong" })).status, 403, "wrong code");
  assert.equal((await call(reg, { ...t, teacherCode: "p8ygjcvr2" })).status, 201, "right code (case-insensitive)");
  assert.equal((await call(reg, { name: "S", email: "s@x.com", password: "abcdef", role: "STUDENT" })).status, 201);
  assert.equal((await call(reg, { name: "S", email: "S@X.com", password: "abcdef", role: "STUDENT" })).status, 400, "duplicate differing only by case");
  assert.equal((await call(reg, { name: "S", email: "bad", password: "abcdef", role: "STUDENT" })).status, 400);
  assert.equal((await call(reg, { name: "S", email: "z@x.com", password: "abcdef", role: "ADMIN" })).status, 400, "cannot self-register as admin");
  assert.equal(users.find((u) => u.email === "s@x.com").email, "s@x.com");

  // mobile login: case-insensitive e-mail, wrong password, throttle, role check
  let r = await call(login, { email: "asha@mail.com", password: "secret12", role: "STUDENT" }, "2.2.2.2");
  assert.equal(r.status, 200); assert.ok((await r.json()).token);
  assert.equal((await call(login, { email: "asha@mail.com", password: "nope" }, "2.2.2.2")).status, 401);
  assert.equal((await call(login, { email: "nobody@mail.com", password: "nope" }, "2.2.2.2")).status, 401);
  assert.equal((await call(login, { email: "asha@mail.com", password: "secret12", role: "TEACHER" }, "2.2.2.2")).status, 400);
  let last = 0; for (let i = 0; i < 12; i++) last = (await call(login, { email: "brute@x.com", password: "x" + i }, "3.3.3.3")).status;
  assert.equal(last, 429, "brute force is throttled after 10 tries");
  console.log("ALL AUTH CHECKS PASSED"); process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

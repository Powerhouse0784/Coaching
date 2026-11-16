import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
process.env.NEXTAUTH_SECRET = "test-secret";

const row: Record<string, any> = { id: "amit", email: "amit@x.com", name: "Amit", role: "STUDENT", avatar: null, phone: "9810493309", bio: null, location: "Sohna", dateOfBirth: new Date("2006-12-14"), website: null, isActive: true };
let updates = 0;
(globalThis as any).prismaGlobal = {
  $disconnect: async () => {},
  user: {
    findUnique: async () => ({ ...row }),
    findFirst: async () => null,
    update: async ({ data }: any) => { updates++; Object.assign(row, data); return { ...row }; },
  },
};
const tok = jwt.sign({ id: "amit", email: "amit@x.com", role: "STUDENT", name: "Amit" }, "test-secret", { expiresIn: "1h", algorithm: "HS256" });

async function main() {
  const P = await import("@/app/api/user/profile/route");
  const { NextRequest } = await import("next/server");
  const put = async (body: any, auth = true) => {
    const res = await P.PUT(new NextRequest("http://x/api/user/profile", { method: "PUT", headers: { authorization: `Bearer ${auth ? tok : "bad"}`, "content-type": "application/json" }, body: JSON.stringify(body) }));
    return { status: res.status, json: await res.json() };
  };

  assert.equal((await put({ name: "A" }, false)).status, 401);

  // normal save, email echoed back unchanged (Settings does this) is fine
  let r = await put({ name: "Saqib Nadeem", email: "AMIT@x.com", phone: "+91 98104-93309", location: "Sohna", dateOfBirth: "2006-12-14", linkedin: "https://linkedin.com/in/saqib" });
  assert.equal(r.status, 200); assert.equal(r.json.name, "Saqib Nadeem"); assert.equal(updates, 1);

  // email change refused (no verification), nothing written
  r = await put({ email: "someone.else@x.com" });
  assert.equal(r.status, 400); assert.match(r.json.error, /Email can't be changed/); assert.equal(updates, 1);

  // phone
  for (const bad of ["abc", "12", "98104 93309 99999999", "<script>"]) assert.equal((await put({ phone: bad })).status, 400, bad);
  assert.equal((await put({ phone: "" })).status, 200); // clearing is allowed
  assert.equal(row.phone, null);

  // links must be http(s)
  for (const bad of ["javascript:alert(1)", "not a url", "ftp://x.com", "linkedin.com/in/x"]) assert.equal((await put({ website: bad })).status, 400, bad);
  assert.equal((await put({ website: "https://saqib.dev" })).status, 200);
  assert.equal((await put({ website: "" })).status, 200);

  // DOB
  assert.equal((await put({ dateOfBirth: "2999-01-01" })).status, 400);
  assert.equal((await put({ dateOfBirth: "1800-01-01" })).status, 400);
  assert.equal((await put({ dateOfBirth: "nope" })).status, 400);
  assert.equal((await put({ dateOfBirth: null })).status, 200);
  assert.equal(row.dateOfBirth, null);

  // empty name refused; fields not sent are untouched
  assert.equal((await put({ name: "  " })).status, 400);
  const before = row.location; await put({ bio: "hi" }); assert.equal(row.location, before);

  console.log("ALL PROFILE CHECKS PASSED");
}
main().catch((e) => { console.error(e); process.exit(1); });

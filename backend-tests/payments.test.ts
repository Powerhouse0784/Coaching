import jwt from "jsonwebtoken";
import assert from "node:assert/strict";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.ADMIN_EMAIL = "admin@x.com";
process.env.NEXTAUTH_URL = "https://app.test";

const created: any[] = [];
const orders = new Map<string, any>();
const prismaFake: any = {
  $disconnect: async () => {},
  user: { findUnique: async ({ where }: any) => ({ id: where.id, email: where.id + "@x.com", role: where.id === "admin" ? "ADMIN" : "STUDENT", name: "N " + where.id, isActive: where.id !== "banned" }) },
  note: { findMany: async ({ where }: any) => where.id.in.filter((i: string) => i === "n1").map((id: string) => ({ id, title: "Physics Notes", subject: "Physics", price: 30 })) },
  order: {
    create: async ({ data }: any) => { const o = { id: "ord_" + (created.length + 1) + "abcdef", ...data }; created.push(o); orders.set(o.id, { ...o, total: o.total }); return o; },
    findFirst: async ({ where }: any) => {
      for (const o of orders.values()) {
        const idOk = typeof where.id === "string" ? o.id === where.id : o.id.startsWith(where.id?.startsWith ?? "\0");
        const ownerOk = !where.OR || where.OR.some((c: any) => (c.userId && c.userId === o.userId) || (c.userEmail && c.userEmail === o.userEmail));
        if (idOk && ownerOk) return o;
      }
      return null;
    },
    findMany: async () => [...orders.values()],
    findUnique: async ({ where }: any) => orders.get(where.id) ?? null,
    updateMany: async ({ where, data }: any) => { const o = orders.get(where.id); if (o && o.status === where.status) { o.status = data.status; return { count: 1 }; } return { count: 0 }; },
    update: async ({ where, data }: any) => { Object.assign(orders.get(where.id), data); return orders.get(where.id); },
  },
};
(globalThis as any).prismaGlobal = prismaFake;

const tok = (id: string) => jwt.sign({ id, email: id + "@x.com", role: "STUDENT", name: "x" }, "test-secret", { algorithm: "HS256" });
async function main() {
  const { GET, POST } = await import("@/app/api/payments/route");
  const { NextRequest } = await import("next/server");
  const post = (body: any, id?: string) => POST(new NextRequest("http://x/api/payments", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", authorization: `Bearer ${id ? tok(id) : "invalid"}` } }));
  const get = (qs: string, id?: string) => GET(new NextRequest("http://x/api/payments?" + qs, { headers: { authorization: `Bearer ${id ? tok(id) : "invalid"}` } }));

  // 1. anonymous cannot create an order
  assert.equal((await post({ action: "create-order", items: [] })).status, 401);

  // 2. tampered client totals are ignored: cart says ₹1, server charges the real plan price
  let r = await post({
    action: "create-order", paymentMethod: "qr", userEmail: "victim@x.com", subtotal: 1, total: 1, couponCode: null,
    items: [{ id: "cls10-math", type: "fee", name: "cheap", price: 1 }, { id: "cls10-sci", type: "fee", price: 1 }],
  }, "stu1");
  assert.equal(r.status, 200);
  let o = (await r.json()).order;
  assert.equal(o.subtotal, 1200); assert.equal(o.total, 1200);
  assert.equal(o.userEmail, "stu1@x.com", "email must come from the session, not the body");
  assert.equal(o.userId, "stu1");

  // 3. coupon is recomputed server-side; invalid ones rejected
  r = await post({ action: "create-order", paymentMethod: "cod", couponCode: "SAVE20", items: [{ id: "cls10-math", type: "fee" }, { id: "cls10-sci", type: "fee" }] }, "stu1");
  o = (await r.json()).order; assert.equal(o.couponDiscount, 240); assert.equal(o.total, 960);
  assert.equal((await post({ action: "create-order", paymentMethod: "cod", couponCode: "HACK100", items: [{ id: "cls10-math", type: "fee" }] }, "stu1")).status, 400);

  // 4. unknown plan / duplicate / bad qty / below minimum
  assert.equal((await post({ action: "create-order", paymentMethod: "qr", items: [{ id: "free", type: "fee", price: 0 }] }, "stu1")).status, 400);
  assert.equal((await post({ action: "create-order", paymentMethod: "qr", items: [{ id: "cls10-math", type: "fee" }, { id: "cls10-math", type: "fee" }] }, "stu1")).status, 400);
  assert.equal((await post({ action: "create-order", paymentMethod: "qr", items: [{ id: "n1", type: "hardcopy", qty: 0 }], address: {} }, "stu1")).status, 400);
  r = await post({ action: "create-order", paymentMethod: "qr", items: [{ id: "n1", type: "hardcopy", qty: 2 }], address: { name: "A", phone: "9876543210", address: "x", city: "y", pincode: "110001" } }, "stu1");
  assert.equal(r.status, 400, "₹60 is below the ₹200 minimum");
  r = await post({ action: "create-order", paymentMethod: "qr", items: [{ id: "n1", type: "hardcopy", qty: 8 }, { id: "cls5-math", type: "fee" }], address: { name: "<b>A</b>", phone: "9876543210", address: "x", city: "y", pincode: "110001" } }, "stu1");
  assert.equal(r.status, 200); o = (await r.json()).order; assert.equal(o.total, 30 * 8 + 250);
  assert.equal((await post({ action: "create-order", paymentMethod: "qr", items: [{ id: "n1", type: "hardcopy", qty: 8 }, { id: "cls5-math", type: "fee" }], address: { name: "A", phone: "123", address: "x", city: "y", pincode: "110001" } }, "stu1")).status, 400, "bad phone");

  // 5. order-status: owner yes, stranger no, anonymous no
  const id = created[0].id;
  assert.equal((await get(`action=order-status&orderId=${id}`)).status, 401);
  assert.equal((await get(`action=order-status&orderId=${id}`, "stu2")).status, 404);
  assert.equal((await get(`action=order-status&orderId=${id}`, "stu1")).status, 200);
  assert.equal((await get(`action=order-status&orderId=${id.slice(0, 8)}`, "stu1")).status, 200);
  assert.equal((await get(`action=order-status&orderId=${id.slice(0, 8)}`, "stu2")).status, 404);
  assert.equal((await get(`action=admin-orders`, "stu1")).status, 403);
  assert.equal((await get(`action=admin-orders`, "admin")).status, 200);

  // 6. proof upload: owner only, uploadthing URL only
  assert.equal((await post({ action: "update-payment-proof", orderId: id, proofUrl: "https://utfs.io/f/abc" }, "stu2")).status, 404);
  assert.equal((await post({ action: "update-payment-proof", orderId: id, proofUrl: "https://evil.com/x.png" }, "stu1")).status, 400);
  assert.equal((await post({ action: "update-payment-proof", orderId: id, proofUrl: "https://abc123.ufs.sh/f/key" }, "stu1")).status, 200);

  // 7. approve: old unsigned link is dead, tampered signature rejected, GET never changes state, POST decides once
  assert.equal((await get(`action=approve-order&orderId=${id}`)).status, 400);
  assert.equal((await get(`action=decide-order&orderId=${id}&decision=approve&sig=deadbeef`)).status, 400);
  assert.equal((await post({ action: "decide-order", orderId: id, decision: "approve", sig: "nope" })).status, 400);
  // build the real signed link the way the e-mail does
  const crypto = await import("crypto");
  const sig = (d: string) => crypto.createHmac("sha256", "test-secret").update(`order:${id}:${d}`).digest("hex");
  const page = await get(`action=decide-order&orderId=${id}&decision=approve&sig=${sig("approve")}`);
  assert.equal(page.status, 200); assert.match(await page.text(), /Approve this order\?/);
  assert.equal(orders.get(id).status, "pending", "GET must not change the order");
  assert.equal((await post({ action: "decide-order", orderId: id, decision: "reject", sig: sig("approve") })).status, 400, "approve signature cannot be used to reject");
  assert.equal((await post({ action: "decide-order", orderId: id, decision: "approve", sig: sig("approve") })).status, 200);
  assert.equal(orders.get(id).status, "approved");
  assert.equal((await post({ action: "decide-order", orderId: id, decision: "reject", sig: sig("reject") })).status, 409, "already decided");
  assert.equal((await post({ action: "update-payment-proof", orderId: id, proofUrl: "https://utfs.io/f/zzz" }, "stu1")).status, 409, "no proof edits after decision");

  // 8. banned account's still-valid token is refused
  assert.equal((await post({ action: "create-order", paymentMethod: "qr", items: [{ id: "cls10-math", type: "fee" }] }, "banned")).status, 401);

  console.log("ALL PAYMENT CHECKS PASSED");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });

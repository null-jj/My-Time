import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";

const directory = mkdtempSync(join(tmpdir(), "dtr-built-test-"));
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
process.env.TURSO_CONNECTION_URL = `file:${join(directory, "test.db")}`;
delete process.env.TURSO_AUTH_TOKEN;
process.env.CLERK_SECRET_KEY = "sk_live_built_test_fixture";
process.env.CLERK_PUBLISHABLE_KEY = `pk_live_${Buffer.from("clerk.dtr.test$").toString("base64")}`;
process.env.CLERK_JWT_KEY = publicKey
  .export({ type: "spki", format: "pem" })
  .toString();
delete process.env.RESEND_API_KEY;
const db = createClient({ url: process.env.TURSO_CONNECTION_URL });
const now = Math.floor(Date.now() / 1000);
function cookie(userId, expired = false) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: "fixture-key" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "https://clerk.dtr.test",
      sub: userId,
      sid: `sess_${userId}`,
      iat: now - 30,
      nbf: now - 30,
      exp: expired ? now - 10 : now + 600,
      azp: "http://localhost:3000",
      org_id: "org_b",
      org_role: "org:admin",
    }),
  ).toString("base64url");
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    privateKey,
  ).toString("base64url");
  return `__session=${header}.${payload}.${signature}; __client_uat=${now - 60}`;
}
function user(id) {
  return {
    object: "user",
    id,
    first_name: id === "user_a" ? "Alice" : "Bob",
    last_name: "Test",
    username: null,
    primary_email_address_id: "email-1",
    email_addresses: [
      {
        object: "email_address",
        id: "email-1",
        email_address: "fixture@example.test",
        linked_to: [],
      },
    ],
    phone_numbers: [],
    external_accounts: [],
    web3_wallets: [],
    enterprise_accounts: [],
    saml_accounts: [],
    passkeys: [],
    public_metadata: {},
    private_metadata: {},
    unsafe_metadata: {},
    created_at: 0,
    updated_at: 0,
  };
}
const actualFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  const url = new URL(
    typeof input === "string" ? input : (input.url ?? input.toString()),
  );
  if (
    url.origin === "https://api.clerk.com" &&
    url.pathname.startsWith("/v1/users/")
  )
    return Response.json(user(url.pathname.split("/").at(-1)));
  if (url.origin === "https://api.clerk.com" && url.pathname === "/v1/users")
    return Response.json({
      data: [user("user_a"), user("user_b")],
      total_count: 2,
    });
  throw new Error(
    `Unexpected network access in built-app verification: ${url.origin}${url.pathname}`,
  );
};
try {
  await db.execute(
    `CREATE TABLE organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  );
  await db.execute(
    `CREATE TABLE user_organizations (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, org_id TEXT NOT NULL, role TEXT NOT NULL, joined_at TEXT NOT NULL)`,
  );
  await db.execute(
    `CREATE TABLE time_entries (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, org_id TEXT NOT NULL, date TEXT NOT NULL, time_in TEXT NOT NULL, time_out TEXT, note TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  );
  await db.execute(
    `INSERT INTO organizations VALUES ('org_a','Organization A',NULL,'2026-01-01','2026-01-01'),('org_b','Organization B',NULL,'2026-01-01','2026-01-01')`,
  );
  await db.execute(
    `INSERT INTO user_organizations VALUES (1,'user_a','org_a','member','2026-01-01'),(2,'user_b','org_b','admin','2026-01-01')`,
  );
  await db.execute(
    `INSERT INTO time_entries VALUES (1,'user_a','org_a','2026-01-01','2026-01-01T08:00:00Z','2026-01-01T16:00:00Z','Historical work','2026-01-01','2026-01-01'),(2,'user_b','org_b','2026-01-01','2026-01-01T08:00:00Z','2026-01-01T16:00:00Z','Other organization secret','2026-01-01','2026-01-01')`,
  );
  const { default: app } = await import(
    pathToFileURL(join(process.cwd(), ".output/server/_ssr/ssr.mjs")).href
  );
  for (const path of ["/", "/sign-in", "/sign-in/sso-callback", "/sign-up"]) {
    const response = await app.fetch(
      new Request(`http://localhost:3000${path}`),
    );
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /<!DOCTYPE html>/);
    assert.equal(response.headers.get("x-frame-options"), "DENY");
  }
  for (const path of [
    "/dashboard",
    "/dtr",
    "/tracker",
    "/calendar",
    "/admin",
    "/dtr/adjustments",
    "/tokens",
  ]) {
    const response = await app.fetch(
      new Request(`http://localhost:3000${path}`),
    );
    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get("location"), "/sign-in", path);
  }
  for (const [path, status] of [
    ["/dtr/api", 401],
    ["/api/cli/status", 401],
    ["/api/missing", 404],
  ]) {
    const response = await app.fetch(
      new Request(`http://localhost:3000${path}`),
    );
    assert.equal(response.status, status, path);
    assert.equal(
      response.headers.get("content-type")?.split(";")[0],
      "application/json",
    );
  }
  const headers = { cookie: `${cookie("user_a")}; selected-org-id=org_b` };
  const tracker = await app.fetch(
    new Request("http://localhost:3000/tracker", { headers }),
  );
  assert.equal(tracker.status, 200);
  const trackerHtml = await tracker.text();
  assert.match(trackerHtml, /lg:pl-64/);
  assert.match(trackerHtml, /<nav/);
  assert.match(trackerHtml, /DTR System/);
  assert.doesNotMatch(trackerHtml, />Admin Panel</);
  assert.match(trackerHtml, /Historical work/);
  assert.doesNotMatch(trackerHtml, /Other organization secret/);
  const dashboard = await app.fetch(
    new Request("http://localhost:3000/dashboard", { headers }),
  );
  assert.equal(dashboard.status, 200);
  const dashboardHtml = await dashboard.text();
  assert.match(dashboardHtml, /Alice Test/);
  assert.match(dashboardHtml, /<nav/);
  assert.match(dashboardHtml, /lg:pl-64/);
  const admin = await app.fetch(
    new Request("http://localhost:3000/admin", { headers }),
  );
  assert.equal(admin.status, 307);
  assert.equal(admin.headers.get("location"), "/dashboard");
  const refreshed = await app.fetch(
    new Request("http://localhost:3000/dashboard", {
      headers: { cookie: cookie("user_a", true), "sec-fetch-dest": "document" },
    }),
  );
  assert.equal(refreshed.status, 307);
  assert.match(refreshed.headers.get("location") ?? "", /clerk\.dtr\.test/);
  assert.ok(refreshed.headers.getSetCookie().length);
  console.log(
    "Verified built SSR pages, protected routes, JSON APIs, tracker history, organization isolation, role checks, and Clerk handshake headers without opening a server.",
  );
} finally {
  globalThis.fetch = actualFetch;
  db.close();
  rmSync(directory, { recursive: true });
}

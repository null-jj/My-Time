import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "dtr-auth-test-"));
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
process.env.TURSO_CONNECTION_URL = `file:${join(directory, "test.db")}`;
delete process.env.TURSO_AUTH_TOKEN;
process.env.CLERK_SECRET_KEY = "sk_live_local_test_fixture";
process.env.CLERK_PUBLISHABLE_KEY = `pk_live_${Buffer.from("clerk.dtr.test$").toString("base64")}`;
process.env.CLERK_JWT_KEY = publicKey
  .export({ type: "spki", format: "pem" })
  .toString();
globalThis.fetch = async () => {
  throw new Error("Auth tests must never access the network");
};

const { db } = await import("../../lib/db/config");
const { auth, withRequestAuth } = await import("../../lib/auth");
const { dispatchApiRequest } = await import("../../server/api");
const { generateApiToken, revokeApiToken } =
  await import("../../lib/api-tokens");
const now = Math.floor(Date.now() / 1000);

function sessionRequest(user: string, selectedOrg?: string, expired = false) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "https://clerk.dtr.test",
      sub: user,
      sid: `sess_${user}`,
      iat: now - 30,
      nbf: now - 30,
      exp: expired ? now - 10 : now + 600,
      azp: "http://dtr.test",
      org_id: "org_b",
      org_role: "org:admin",
    }),
  ).toString("base64url");
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(`${header}.${payload}`),
    privateKey,
  ).toString("base64url");
  return new Request("http://dtr.test/dashboard", {
    headers: {
      cookie: `__session=${header}.${payload}.${signature}; __client_uat=${now - 60}${selectedOrg ? `; selected-org-id=${selectedOrg}` : ""}`,
      "sec-fetch-dest": "document",
    },
  });
}

try {
  await db.run(
    `CREATE TABLE organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  );
  await db.run(
    `CREATE TABLE user_organizations (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, org_id TEXT NOT NULL, role TEXT NOT NULL, joined_at TEXT NOT NULL)`,
  );
  await db.run(
    `CREATE TABLE time_entries (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL, org_id TEXT NOT NULL, date TEXT NOT NULL, time_in TEXT NOT NULL, time_out TEXT, note TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  );
  await db.run(
    `CREATE TABLE api_tokens (id INTEGER PRIMARY KEY, token TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL, org_id TEXT NOT NULL, name TEXT NOT NULL, last_used_at TEXT, created_at TEXT NOT NULL, expires_at TEXT)`,
  );
  await db.$client.execute(
    "INSERT INTO organizations VALUES ('org_a','A',NULL,'2026-01-01','2026-01-01'),('org_b','B',NULL,'2026-01-01','2026-01-01'),('org_c','C',NULL,'2026-01-01','2026-01-01')",
  );
  await db.$client.execute(
    "INSERT INTO user_organizations VALUES (1,'user_a','org_a','member','2026-01-01'),(2,'user_b','org_b','admin','2026-01-01'),(3,'user_a','org_c','admin','2026-01-01')",
  );

  const forgedSelection = await auth(sessionRequest("user_a", "org_b"));
  assert.deepEqual(forgedSelection, {
    userId: "user_a",
    orgId: "org_a",
    orgRole: "member",
  });
  assert.deepEqual(await auth(sessionRequest("user_a", "org_c")), {
    userId: "user_a",
    orgId: "org_c",
    orgRole: "admin",
  });
  assert.equal(
    (await auth(new Request("http://dtr.test/dtr/api"))).userId,
    null,
  );

  const refresh = await withRequestAuth(
    sessionRequest("user_a", undefined, true),
    async () => {
      throw new Error(
        "Expired document session must redirect before rendering",
      );
    },
  );
  assert.equal(refresh.status, 307);
  assert.ok(refresh.headers.get("location")?.includes("clerk.dtr.test"));
  assert.ok(refresh.headers.getSetCookie().length > 0);

  const concurrent = await Promise.all(
    ["user_a", "user_b"].map((user) => {
      const request = sessionRequest(user);
      return withRequestAuth(request, async () => {
        await new Promise((resolve) =>
          setTimeout(resolve, user === "user_a" ? 10 : 1),
        );
        return Response.json(await auth(request));
      }).then((response) => response.json());
    }),
  );
  assert.deepEqual(concurrent, [
    { userId: "user_a", orgId: "org_a", orgRole: "member" },
    { userId: "user_b", orgId: "org_b", orgRole: "admin" },
  ]);

  const signedMember = sessionRequest("user_a");
  const adminAttempt = new Request(
    "http://dtr.test/api/admin/time-change-requests",
    { headers: signedMember.headers },
  );
  const denied = await withRequestAuth(adminAttempt, () =>
    dispatchApiRequest(adminAttempt),
  );
  assert.equal(denied.status, 403);
  assert.deepEqual(await denied.json(), { error: "Admin access required" });

  const token = await generateApiToken(
    "user_a",
    "org_a",
    "Local test token",
    1,
  );
  const cli = (path: string, method = "GET", note?: string) =>
    new Request(`http://dtr.test/api/cli/${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: note === undefined ? undefined : JSON.stringify({ note }),
    });
  const clockIn = await dispatchApiRequest(cli("clock-in", "POST"));
  assert.equal(clockIn.status, 200);
  const { entry } = await clockIn.json();
  assert.equal(entry.userId, "user_a");
  assert.equal(entry.orgId, "org_a");
  assert.equal((await dispatchApiRequest(cli("clock-in", "POST"))).status, 400);
  const status = await dispatchApiRequest(cli("status"));
  assert.equal((await status.json()).isClockedIn, true);
  assert.equal(
    (await dispatchApiRequest(cli("clock-out", "POST", ""))).status,
    400,
  );
  const clockOut = await dispatchApiRequest(
    cli("clock-out", "POST", "Completed local test"),
  );
  assert.equal(clockOut.status, 200);
  assert.equal((await clockOut.json()).entry.note, "Completed local test");
  const [savedToken] = (
    await db.$client.execute("SELECT id,last_used_at FROM api_tokens")
  ).rows;
  assert.ok(savedToken.last_used_at);
  await revokeApiToken(Number(savedToken.id), "user_a", "org_a");
  assert.equal((await dispatchApiRequest(cli("status"))).status, 401);

  await db.run("DROP TABLE api_tokens");
  for (const [path, method] of [
    ["status", "GET"],
    ["clock-in", "POST"],
    ["clock-out", "POST"],
  ]) {
    const failed = await dispatchApiRequest(cli(path, method));
    assert.equal(failed.status, 500);
    assert.equal(
      failed.headers.get("content-type")?.split(";")[0],
      "application/json",
    );
  }
  console.log(
    "Verified signed sessions, organization and role isolation, handshake headers, concurrent users, CLI clock-in/out and token revocation.",
  );
} finally {
  db.$client.close();
  rmSync(directory, { recursive: true });
}

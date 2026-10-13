import assert from "node:assert/strict";
import { test } from "node:test";

delete process.env.CLERK_SECRET_KEY;
delete process.env.CLERK_PUBLISHABLE_KEY;
delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const { dispatchApiRequest } = await import("../server/api");

test("dispatcher preserves API path and method contracts", async () => {
  const notFound = await dispatchApiRequest(
    new Request("http://dtr.test/api/missing"),
  );
  assert.equal(notFound.status, 404);

  const method = await dispatchApiRequest(
    new Request("http://dtr.test/api/cli/status", { method: "POST" }),
  );
  assert.equal(method.status, 405);

  for (const [method, path] of [
    ["GET", "/api/cli/status"],
    ["POST", "/api/cli/clock-in"],
    ["POST", "/api/cli/clock-out"],
  ] as const) {
    const cli = await dispatchApiRequest(
      new Request(`http://dtr.test${path}`, { method }),
    );
    assert.equal(cli.status, 401, `${method} ${path}`);
    assert.deepEqual(await cli.json(), {
      error: "Missing or invalid authorization header",
    });
  }
});

test("every browser API rejects requests without a verified Clerk session", async () => {
  const requests = [
    ["GET", "/dtr/api"],
    ["GET", "/calendar/api"],
    ["GET", "/tracker/api"],
    ["GET", "/admin/api"],
    ["POST", "/api/admin/dtr-export"],
    ["GET", "/api/admin/time-change-requests"],
    ["PATCH", "/api/admin/time-change-requests/42"],
    ["POST", "/api/invite/invitation-1"],
    ["GET", "/api/organizations"],
    ["GET", "/api/organizations/org-1"],
    ["POST", "/api/organizations/org-1/invite"],
    ["GET", "/api/organizations/org-1/members"],
    ["GET", "/api/time-change-requests"],
    ["GET", "/api/time-entries/history"],
    ["GET", "/api/tokens"],
  ] as const;

  for (const [method, path] of requests) {
    const response = await dispatchApiRequest(
      new Request(`http://dtr.test${path}`, { method }),
    );
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
  }
});

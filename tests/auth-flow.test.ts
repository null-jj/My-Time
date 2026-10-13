import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("signed sessions and CLI flows preserve access boundaries without network access", () => {
  const fixture = fileURLToPath(
    new URL("./fixtures/auth-flow.ts", import.meta.url),
  );
  const result = spawnSync(process.execPath, ["run", fixture], {
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Verified signed sessions/);
});

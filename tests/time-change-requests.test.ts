import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("approval moves the date with clock-in and preserves it for other changes", () => {
  const fixture = fileURLToPath(
    new URL("./fixtures/time-change-requests.ts", import.meta.url),
  );
  const result = spawnSync(process.execPath, ["run", fixture], {
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Verified isolated adjustment approval dates/);
});

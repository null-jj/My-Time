import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import solid from "@solidjs/vite-plugin";
import { JSDOM } from "jsdom";

test("Solid components preserve interactive controls and adjustment submission", async () => {
  const directory = mkdtempSync(join(tmpdir(), "dtr-ui-test-"));
  let dom: JSDOM | undefined;
  try {
    await build({
      configFile: false,
      logLevel: "error",
      define: {
        "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
          "pk_test_" + Buffer.from("clerk.fixture.test$").toString("base64"),
        ),
      },
      resolve: {
        alias: { "@": fileURLToPath(new URL("..", import.meta.url)) },
      },
      plugins: [solid()],
      build: {
        outDir: directory,
        lib: {
          entry: fileURLToPath(
            new URL("./fixtures/ui-flow.tsx", import.meta.url),
          ),
          formats: ["es"],
          fileName: "ui-flow",
        },
      },
    });
    dom = new JSDOM(
      '<!doctype html><html><body><div id="root"></div></body></html>',
      { url: "http://localhost:3000" },
    );
    for (const name of [
      "window",
      "document",
      "Node",
      "Element",
      "HTMLElement",
      "Event",
      "InputEvent",
      "MouseEvent",
      "KeyboardEvent",
      "SubmitEvent",
    ]) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        value: Reflect.get(dom.window, name),
      });
    }
    const intervals = new Set<ReturnType<typeof setInterval>>();
    const originalSetInterval = globalThis.setInterval;
    const originalClearInterval = globalThis.clearInterval;
    globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
      const timer = originalSetInterval(...args);
      intervals.add(timer);
      return timer;
    }) as typeof setInterval;
    globalThis.clearInterval = ((timer: ReturnType<typeof setInterval>) => {
      intervals.delete(timer);
      originalClearInterval(timer);
    }) as typeof clearInterval;
    const { runUIFlow } = await import(
      pathToFileURL(join(directory, "ui-flow.js")).href
    );
    try {
      const result = await runUIFlow(
        dom.window.document.getElementById("root"),
      );
      assert.match(result, /Verified reactive controls/);
      assert.equal(
        intervals.size,
        0,
        "Disposed components must clear every interval",
      );
    } finally {
      intervals.forEach(originalClearInterval);
      globalThis.setInterval = originalSetInterval;
      globalThis.clearInterval = originalClearInterval;
    }
  } finally {
    dom?.window.close();
    rmSync(directory, { recursive: true });
  }
});

import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/solid-start/server";
import { withRequestAuth } from "@/lib/auth";
import type { RequestHandler } from "@tanstack/solid-start/server";
import type { Register } from "@tanstack/solid-router";
const handle = createStartHandler(defaultStreamHandler);
const fetch: RequestHandler<Register> = (request, options) =>
  withRequestAuth(request, async () => {
    const response = await handle(request, options);
    const headers = new Headers(response.headers);
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set("X-DNS-Prefetch-Control", "on");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  });
export default { fetch };

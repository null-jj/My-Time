import { createFileRoute } from "@tanstack/solid-router";
import { dispatchApiRequest } from "@/server/api";
export const Route = createFileRoute("/admin/api")({
  server: {
    handlers: {
      GET: ({ request }) => dispatchApiRequest(request),
      POST: ({ request }) => dispatchApiRequest(request),
      PATCH: ({ request }) => dispatchApiRequest(request),
      PUT: ({ request }) => dispatchApiRequest(request),
      DELETE: ({ request }) => dispatchApiRequest(request),
      OPTIONS: ({ request }) => dispatchApiRequest(request),
      HEAD: ({ request }) => dispatchApiRequest(request),
    },
  },
});

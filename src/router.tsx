import { createRouter } from "@tanstack/solid-router";
export function getRouter() {
  return createRouter({ routeTree, scrollRestoration: true });
}
declare module "@tanstack/solid-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
import { routeTree } from "./routeTree.gen";

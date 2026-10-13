import { createFileRoute, redirect } from "@tanstack/solid-router";
import Home from "../pages/home";
import { getPublicSession } from "../server-data";
export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getPublicSession();
    if (session.userId) throw redirect({ href: "/dashboard" });
  },
  component: Home,
});

import { createFileRoute } from "@tanstack/solid-router";
import { getDashboardData } from "../server-data";
import { DashboardPage } from "../pages/dashboard";
export const Route = createFileRoute("/dashboard")({
  loader: () => getDashboardData(),
  component: Page,
});
function Page() {
  const data = Route.useLoaderData();
  return <DashboardPage data={data()} />;
}

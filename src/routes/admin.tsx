import { createFileRoute } from "@tanstack/solid-router";
import { getAdminData } from "../server-data";
import { AdminPage } from "../pages/admin";
export const Route = createFileRoute("/admin")({
  loader: () => getAdminData(),
  component: Page,
});
function Page() {
  const data = Route.useLoaderData();
  return <AdminPage data={data()} />;
}

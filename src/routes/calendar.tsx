import { createFileRoute } from "@tanstack/solid-router";
import FeaturePage from "../pages/calendar";
import { getSession } from "../server-data";
export const Route = createFileRoute("/calendar")({
  beforeLoad: () => getSession(),
  component: Page,
});
function Page() {
  return <FeaturePage />;
}

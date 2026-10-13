import { createFileRoute } from "@tanstack/solid-router";
import FeaturePage from "../pages/welcome";
import { getSession } from "../server-data";
export const Route = createFileRoute("/welcome")({
  beforeLoad: () => getSession(),
  component: Page,
});
function Page() {
  return <FeaturePage />;
}

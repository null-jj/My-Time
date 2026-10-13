import { createFileRoute } from "@tanstack/solid-router";
import FeaturePage from "../pages/tokens";
import { getSession } from "../server-data";
export const Route = createFileRoute("/tokens")({
  beforeLoad: () => getSession(),
  component: Page,
});
function Page() {
  return <FeaturePage />;
}

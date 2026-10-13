import { createFileRoute } from "@tanstack/solid-router";
import FeaturePage from "../pages/themes";
import { getSession } from "../server-data";
export const Route = createFileRoute("/themes")({
  beforeLoad: () => getSession(),
  component: Page,
});
function Page() {
  return <FeaturePage />;
}

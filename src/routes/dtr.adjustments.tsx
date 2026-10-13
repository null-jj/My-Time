import { createFileRoute } from "@tanstack/solid-router";
import { DtrAdjustmentsContent } from "@/components/dtr/dtr-adjustments-content";
import { getSession } from "../server-data";
export const Route = createFileRoute("/dtr/adjustments")({
  beforeLoad: () => getSession(),
  component: Page,
});
function Page() {
  return <DtrAdjustmentsContent />;
}

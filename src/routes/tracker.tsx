import { createFileRoute } from "@tanstack/solid-router";
import { getTrackerData } from "../server-data";
import { TrackerClient } from "@/components/tracker/tracker-client";
export const Route = createFileRoute("/tracker")({
  loader: () => getTrackerData(),
  component: Page,
});
function Page() {
  const data = Route.useLoaderData();
  return <TrackerClient records={data().records} userName={data().userName} />;
}

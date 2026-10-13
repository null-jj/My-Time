import { createFileRoute } from "@tanstack/solid-router";
import { getDtrData } from "../server-data";
import { DTRContent } from "@/components/dtr/dtr-content";
export const Route = createFileRoute("/dtr")({
  loader: () => getDtrData(),
  component: Page,
});
function Page() {
  const data = Route.useLoaderData();
  return (
    <DTRContent
      initialActiveEntry={data().activeEntry}
      initialTodayEntries={data().todayEntries}
      initialIsClockedIn={data().isClockedIn}
    />
  );
}

import { createSignal, createMemo } from "solid-js";
import { RealtimeTimeClock } from "@/components/dashboard/realtime-time-clock";
import { RealtimeTodayEntries } from "@/components/dashboard/realtime-today-entries";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
type DashboardClientProps = {
  initialActiveEntry: TimeEntryWithDuration | null;
  initialTodayEntries: TimeEntryWithDuration[];
  initialIsClockedIn: boolean;
};
export function DashboardClient(props: DashboardClientProps) {
  const [refreshKey, setRefreshKey] = createSignal(0);
  const handleTimeAction = () => {
    // Trigger refresh of other components when time action occurs
    setRefreshKey((prev) => prev + 1);
  };
  const view = createMemo(() => {
    return (
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <RealtimeTimeClock
          initialActiveEntry={props.initialActiveEntry}
          initialTodayEntries={props.initialTodayEntries}
          initialIsClockedIn={props.initialIsClockedIn}
          onTimeAction={handleTimeAction}
        />
        <RealtimeTodayEntries
          refreshKey={refreshKey()}
          initialEntries={props.initialTodayEntries}
          initialActiveEntry={props.initialActiveEntry}
          initialIsClockedIn={props.initialIsClockedIn}
        />
      </div>
    );
  });
  return <>{view()}</>;
}

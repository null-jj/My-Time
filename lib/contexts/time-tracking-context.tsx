import { createContext, useContext } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useRealtimeData } from "@/lib/hooks/use-realtime-data";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
type TimeTrackingData = {
  activeEntry: TimeEntryWithDuration | null;
  todayEntries: TimeEntryWithDuration[];
  isClockedIn: boolean;
};
type TimeTrackingContextValue = {
  readonly data: TimeTrackingData;
  readonly loading: boolean;
  readonly error: string | null;
  refresh: () => Promise<void>;
  readonly isRefreshing: boolean;
};
const TimeTrackingContext = createContext<TimeTrackingContextValue>();
export function TimeTrackingProvider(props: {
  children: JSX.Element;
  initialData: TimeTrackingData;
}) {
  const realtime = useRealtimeData(
    async () => {
      const response = await fetch("/dtr/api", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch time tracking data");
      return (await response.json()) as TimeTrackingData;
    },
    props.initialData,
    { interval: 30000, immediate: false },
  );
  return (
    <TimeTrackingContext
      value={{
        get data() {
          return realtime.data();
        },
        get loading() {
          return realtime.loading();
        },
        get error() {
          return realtime.error();
        },
        refresh: realtime.refresh,
        get isRefreshing() {
          return realtime.loading();
        },
      }}
    >
      {props.children}
    </TimeTrackingContext>
  );
}
export function useTimeTrackingContext() {
  const context = useContext(TimeTrackingContext);
  if (!context)
    throw new Error(
      "useTimeTrackingContext must be used within a TimeTrackingProvider.",
    );
  return context;
}

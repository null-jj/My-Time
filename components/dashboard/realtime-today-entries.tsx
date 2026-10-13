import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createEffect, createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageSquare } from "@/components/icons";
import { formatDuration } from "@/lib/time-entries-format";
import { formatTime } from "@/lib/time-format";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
type TodayEntriesData = {
  todayEntries: TimeEntryWithDuration[];
  activeEntry: TimeEntryWithDuration | null;
  isClockedIn: boolean;
};
type RealtimeTodayEntriesProps = {
  refreshKey?: number;
  initialEntries: TimeEntryWithDuration[];
  initialActiveEntry: TimeEntryWithDuration | null;
  initialIsClockedIn: boolean;
  onRefresh?: () => void;
};
export function RealtimeTodayEntries(props: RealtimeTodayEntriesProps) {
  const [loading, setLoading] = createSignal(false);
  const [currentTime, setCurrentTime] = createSignal<Date | null>(null);
  const [data, setData] = createSignal<TodayEntriesData>({
    todayEntries: props.initialEntries,
    activeEntry: props.initialActiveEntry,
    isClockedIn: props.initialIsClockedIn,
  });
  // Update current time every second for live duration calculation
  createEffect(
    () => [],
    () => {
      setCurrentTime(new Date());
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    },
  );
  createEffect(
    () => props.refreshKey,
    () => {
      if (
        props.refreshKey ||
        !props.initialEntries ||
        props.initialEntries.length === 0
      ) {
        refresh();
      }
    },
  );
  const fetchTodayData = async (): Promise<TodayEntriesData> => {
    const response = await fetch("/dtr/api", { credentials: "include" });
    if (!response.ok) {
      throw new Error("Failed to fetch today's entries");
    }
    return response.json();
  };
  const refresh = async () => {
    setLoading(true);
    try {
      const newData = await fetchTodayData();
      setData(newData);
      // Notify parent component that data was refreshed
      if (props.onRefresh) {
        props.onRefresh();
      }
    } catch (error) {
      console.error("Failed to refresh today entries:", error);
    } finally {
      setLoading(false);
    }
  };
  const getSessionDuration = (entry: TimeEntryWithDuration) => {
    const time = currentTime();
    if (entry.duration) {
      return formatDuration(entry.duration);
    } else if (entry.isActive && data().activeEntry?.id === entry.id && time) {
      // Show live duration for active session
      const now = time.getTime();
      const start = new Date(entry.timeIn).getTime();
      const minutes = Math.round((now - start) / (1000 * 60));
      return formatDuration(minutes) + " (live)";
    }
    return "0:00";
  };
  const getStatusBadge = (entry: TimeEntryWithDuration) => {
    if (!entry.timeIn) return <Badge variant="secondary">No Entry</Badge>;
    if (!entry.timeOut) return <Badge variant="default">In Progress</Badge>;
    return <Badge variant="default">Complete</Badge>;
  };
  usePageLoading(() => loading());
  const view = createMemo(() => {
    if (data().todayEntries.length === 0) {
      return (
        <Card class="h-full">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-5 w-5" />
              Today&apos;s Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-center py-8 text-muted-foreground">
              <Clock class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p>No time entries today</p>
              <p class="text-sm">Clock in to start tracking your time</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card class="h-full">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Clock class="h-5 w-5" />
            Today&apos;s Sessions
          </CardTitle>
        </CardHeader>
        <CardContent class="h-full">
          <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {data().todayEntries.map((entry, index) => (
              <div class="p-4 bg-muted/50 rounded-lg border border-border">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-foreground">
                      Session {index + 1}
                    </span>
                    {getStatusBadge(entry)}
                  </div>
                  <div class="font-medium text-primary">
                    {getSessionDuration(entry)}
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span class="text-muted-foreground">Clock In:</span>
                    <div class="font-medium text-foreground">
                      {formatTime(entry.timeIn)}
                    </div>
                  </div>
                  <div>
                    <span class="text-muted-foreground">Clock Out:</span>
                    <div class="font-medium text-foreground">
                      {entry.timeOut ? (
                        formatTime(entry.timeOut)
                      ) : (
                        <span class="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                </div>

                {entry.note && (
                  <div class="text-sm">
                    <div class="flex items-center gap-2 text-muted-foreground mb-1">
                      <MessageSquare class="h-3 w-3" />
                      <span>Note:</span>
                    </div>
                    <div class="text-foreground bg-background/50 p-2 rounded border">
                      {entry.note}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  });
  return <>{view()}</>;
}

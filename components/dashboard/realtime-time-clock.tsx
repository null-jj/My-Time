import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createEffect, createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Play, Square, MessageSquare } from "@/components/icons";
import {
  formatDuration,
  calculateTotalDuration,
} from "@/lib/time-entries-format";
import { formatTime } from "@/lib/time-format";
import { toast } from "@/components/ui/sonner";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
type RealtimeTimeClockProps = {
  initialActiveEntry: TimeEntryWithDuration | null;
  initialTodayEntries: TimeEntryWithDuration[];
  initialIsClockedIn: boolean;
  onTimeAction?: () => void;
};
export function RealtimeTimeClock(props: RealtimeTimeClockProps) {
  // Use null initial to avoid server/client mismatch, then hydrate on mount
  const [currentTime, setCurrentTime] = createSignal<Date | null>(null);
  const [mounted, setMounted] = createSignal(false);
  const [showNoteInput, setShowNoteInput] = createSignal(false);
  const [note, setNote] = createSignal("");
  const [data, setData] = createSignal({
    activeEntry: props.initialActiveEntry,
    todayEntries: props.initialTodayEntries,
    isClockedIn: props.initialIsClockedIn,
  });
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  // Hydrate time on mount, then tick every second
  createEffect(
    () => [],
    () => {
      setMounted(true);
      setCurrentTime(new Date());
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    },
  );
  const fetchTimeData = async () => {
    try {
      const response = await fetch("/dtr/api", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch time tracking data");
      }
      const newData = await response.json();
      setData(newData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    }
  };
  // Determine if clocked in based on active entry in database
  const isClockedIn = createMemo(() => {
    const activeEntry = data().activeEntry;
    return !!activeEntry && !activeEntry.timeOut;
  });
  const calculateLiveTodayHours = () => {
    const activeEntry = data().activeEntry;
    const now = currentTime();
    let totalMinutes = calculateTotalDuration(data().todayEntries);
    // Add current session time if clocked in
    if (activeEntry && isClockedIn() && now) {
      const start = new Date(activeEntry.timeIn).getTime();
      totalMinutes += Math.round((now.getTime() - start) / (1000 * 60));
    }
    return formatDuration(totalMinutes);
  };
  const calculateLiveCurrentSessionHours = () => {
    const activeEntry = data().activeEntry;
    const now = currentTime();
    if (!activeEntry || !isClockedIn() || !now) return "0:00";
    const start = new Date(activeEntry.timeIn).getTime();
    const minutes = Math.round((now.getTime() - start) / (1000 * 60));
    return formatDuration(minutes);
  };
  const displayTime = createMemo(() =>
    mounted()
      ? (currentTime()?.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) ?? "--:--:-- --")
      : "--:--:-- --",
  );
  const displayDate = createMemo(() =>
    mounted()
      ? (currentTime()?.toLocaleDateString([], {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }) ?? "")
      : "",
  );
  const getStatus = () => {
    if (!isClockedIn())
      return { text: "Not Clocked In", variant: "secondary" as const };
    return { text: "Clocked In", variant: "default" as const };
  };
  const handleClockIn = async () => {
    setLoading(true);
    try {
      const response = await fetch("/dtr/api", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      // Refresh only this component's data
      await fetchTimeData();
      toast.success("Successfully clocked in!", {
        description: "Your time tracking session has started.",
      });
      // Notify parent to refresh other components
      if (props.onTimeAction) {
        props.onTimeAction();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to clock in";
      toast.error("Failed to clock in", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleClockOut = async () => {
    if (!showNoteInput()) {
      setShowNoteInput(true);
      return;
    }
    if (!note().trim()) {
      return; // Note is required
    }
    setLoading(true);
    try {
      const response = await fetch("/dtr/api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: note().trim() }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      // Refresh only this component's data
      await fetchTimeData();
      setNote("");
      setShowNoteInput(false);
      toast.success("Successfully clocked out!", {
        description: "Your time tracking session has ended.",
      });
      // Notify parent to refresh other components
      if (props.onTimeAction) {
        props.onTimeAction();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to clock out";
      toast.error("Failed to clock out", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCancelClockOut = () => {
    setShowNoteInput(false);
    setNote("");
  };
  const status = createMemo(getStatus);
  usePageLoading(() => loading());
  const view = createMemo(() => {
    return (
      <Card class="hover:shadow-lg transition-shadow h-full">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Clock class="h-5 w-5" />
            Time Clock
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          {error() && (
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error()}
            </div>
          )}

          <div class="text-center">
            <div class="text-3xl font-mono font-bold text-foreground">
              {displayTime()}
            </div>
            <div class="text-sm text-muted-foreground">{displayDate()}</div>
          </div>

          <div class="flex justify-center">
            <Badge variant={status().variant} class="animate-pulse">
              {status().text}
            </Badge>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">Current Session:</span>
              <div class="font-medium text-foreground">
                {data().activeEntry
                  ? formatTime(data().activeEntry?.timeIn ?? "")
                  : "-"}
              </div>
            </div>
            <div>
              <span class="text-muted-foreground">Session Time:</span>
              <div class="font-medium text-primary">
                {calculateLiveCurrentSessionHours()}
              </div>
            </div>
          </div>

          <div class="text-center">
            <span class="text-muted-foreground">Today&apos;s Total:</span>
            <div class="text-xl font-bold text-primary">
              {calculateLiveTodayHours()}
            </div>
          </div>

          {data().todayEntries.length > 0 && (
            <div class="text-center text-sm text-muted-foreground">
              {data().todayEntries.length} session
              {data().todayEntries.length !== 1 ? "s" : ""} today
            </div>
          )}

          {!showNoteInput() ? (
            <div class="flex gap-2">
              {!isClockedIn() ? (
                <Button
                  onClick={handleClockIn}
                  disabled={loading()}
                  class="flex-1"
                >
                  <Play class="h-4 w-4 mr-2" />
                  Clock In
                </Button>
              ) : (
                <Button
                  onClick={handleClockOut}
                  disabled={loading()}
                  variant="destructive"
                  class="flex-1"
                >
                  <Square class="h-4 w-4 mr-2" />
                  Clock Out
                </Button>
              )}
            </div>
          ) : (
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare class="h-4 w-4" />
                <span>Add a note for this session:</span>
              </div>
              <Textarea
                value={note()}
                onInput={(e) => setNote(e.target.value)}
                placeholder="What did you work on?"
                class="min-h-[80px]"
                autofocus
              />
              <div class="flex gap-2">
                <Button
                  onClick={handleClockOut}
                  disabled={loading() || !note().trim()}
                  variant="destructive"
                  class="flex-1"
                >
                  <Square class="h-4 w-4 mr-2" />
                  Clock Out
                </Button>
                <Button onClick={handleCancelClockOut} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  });
  return <>{view()}</>;
}

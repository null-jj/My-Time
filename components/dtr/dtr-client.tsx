import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createMemo } from "solid-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Square, MessageSquare } from "@/components/icons";
import { toast } from "@/components/ui/sonner";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
type DTRClientProps = {
  initialActiveEntry: TimeEntryWithDuration | null;
  initialTodayEntries: TimeEntryWithDuration[];
  initialIsClockedIn: boolean;
  refreshData?: () => Promise<void>;
};
export function DTRClient(props: DTRClientProps) {
  // REMOVE local state for activeEntry, todayEntries, isClockedIn
  // const [activeEntry, setActiveEntry] = useState(initialActiveEntry);
  // const [todayEntries, setTodayEntries] = useState(initialTodayEntries);
  // const [isClockedIn, setIsClockedIn] = useState(initialIsClockedIn);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [showNoteInput, setShowNoteInput] = createSignal(false);
  const [note, setNote] = createSignal("");
  // Use props directly
  const isClockedIn = createMemo(() => props.initialIsClockedIn);
  const internalRefreshData = async () => {
    // No-op, should not be used
  };
  const refreshData = createMemo(
    () => props.refreshData || internalRefreshData,
  );
  const handleTimeIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/dtr/api", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      // Only call parent refreshData
      await refreshData()();
      toast.success("Clocked in successfully!", {
        description: "Your new time tracking session has started.",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error("Failed to clock in", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleTimeOut = async () => {
    if (!showNoteInput()) {
      setShowNoteInput(true);
      return;
    }
    if (!note().trim()) {
      setError("Note is required when clocking out");
      toast.error("Note required", {
        description:
          "Please add a note describing your work before clocking out.",
      });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/dtr/api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: note().trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      // Only call parent refreshData
      await refreshData()();
      setNote("");
      setShowNoteInput(false);
      toast.success("Clocked out successfully!", {
        description: "Your time tracking session has ended.",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
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
    setError(null);
  };
  usePageLoading(() => loading());
  const view = createMemo(() => {
    return (
      <div class="space-y-4">
        {error() && (
          <div class="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {error()}
          </div>
        )}

        {showNoteInput() && (
          <div class="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
            <div class="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare class="h-4 w-4" />
              Clock Out Note (Required)
            </div>
            <Textarea
              value={note()}
              onInput={(e) => setNote(e.target.value)}
              placeholder="Please describe what you worked on during this session..."
              class="min-h-[80px]"
              disabled={loading()}
            />
            <div class="flex gap-2">
              <Button
                onClick={handleTimeOut}
                disabled={loading() || !note().trim()}
                class="flex-1"
                size="sm"
              >
                <Square class="mr-2 h-3 w-3" />
                Confirm Clock Out
              </Button>
              <Button
                onClick={handleCancelClockOut}
                disabled={loading()}
                variant="outline"
                class="flex-1"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!showNoteInput() && (
          <div class="flex gap-3">
            <Button
              onClick={handleTimeIn}
              disabled={loading() || isClockedIn()}
              class="flex-1"
              size="lg"
            >
              <Play class="mr-2 h-4 w-4" />
              Clock In
            </Button>
            <Button
              onClick={handleTimeOut}
              disabled={loading() || !isClockedIn()}
              variant="secondary"
              class="flex-1"
              size="lg"
            >
              <Square class="mr-2 h-4 w-4" />
              Clock Out
            </Button>
          </div>
        )}
      </div>
    );
  });
  return <>{view()}</>;
}

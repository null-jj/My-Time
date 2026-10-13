import { createSignal } from "solid-js";
import { toast } from "@/components/ui/sonner";
import { useTimeTrackingContext } from "@/lib/contexts/time-tracking-context";
export function useTimeActions() {
  const [loading, setLoading] = createSignal(false);
  const { refresh } = useTimeTrackingContext();
  const clockIn = async () => {
    setLoading(true);
    try {
      const response = await fetch("/dtr/api", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      await refresh();
      toast.success("Successfully clocked in!", {
        description: "Your time tracking session has started.",
      });
    } catch (reason) {
      toast.error("Failed to clock in", {
        description:
          reason instanceof Error ? reason.message : "Failed to clock in",
      });
      throw reason;
    } finally {
      setLoading(false);
    }
  };
  const clockOut = async (note: string) => {
    if (!note.trim()) {
      const error = new Error("Note is required");
      toast.error("Note required", {
        description:
          "Please add a note describing your work before clocking out.",
      });
      throw error;
    }
    setLoading(true);
    try {
      const response = await fetch("/dtr/api", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: note.trim() }),
      });
      if (!response.ok) throw new Error(await response.text());
      await refresh();
      toast.success("Successfully clocked out!", {
        description: "Your time tracking session has ended.",
      });
    } catch (reason) {
      toast.error("Failed to clock out", {
        description:
          reason instanceof Error ? reason.message : "Failed to clock out",
      });
      throw reason;
    } finally {
      setLoading(false);
    }
  };
  return {
    clockIn,
    clockOut,
    get loading() {
      return loading();
    },
  };
}

import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createMemo } from "solid-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
type TimeChangeRequestFormProps = {
  entry: TimeEntryWithDuration;
  onClose: () => void;
  onSubmitted: () => void;
};
function toDatetimeLocalValue(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function TimeChangeRequestForm(props: TimeChangeRequestFormProps) {
  const [requestedTimeIn, setRequestedTimeIn] = createSignal(
    toDatetimeLocalValue(props.entry.timeIn),
  );
  const [requestedTimeOut, setRequestedTimeOut] = createSignal(
    props.entry.timeOut ? toDatetimeLocalValue(props.entry.timeOut) : "",
  );
  const [requestedNote, setRequestedNote] = createSignal(
    props.entry.note || "",
  );
  const [reason, setReason] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!reason().trim()) return;
    // Check if anything actually changed
    const timeInChanged =
      requestedTimeIn() !== toDatetimeLocalValue(props.entry.timeIn);
    const timeOutChanged = props.entry.timeOut
      ? requestedTimeOut() !== toDatetimeLocalValue(props.entry.timeOut)
      : requestedTimeOut() !== "";
    const noteChanged = requestedNote() !== (props.entry.note || "");
    if (!timeInChanged && !timeOutChanged && !noteChanged) {
      toast.error("No changes detected");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        timeEntryId: props.entry.id,
        reason: reason().trim(),
      };
      if (timeInChanged)
        body.requestedTimeIn = new Date(requestedTimeIn()).toISOString();
      if (timeOutChanged && requestedTimeOut())
        body.requestedTimeOut = new Date(requestedTimeOut()).toISOString();
      if (noteChanged) body.requestedNote = requestedNote().trim();
      const res = await fetch("/api/time-change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request");
      }
      toast.success("Change request submitted for admin approval");
      props.onSubmitted();
      props.onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit request",
      );
    } finally {
      setSubmitting(false);
    }
  };
  usePageLoading(() => submitting());
  const view = createMemo(() => {
    return (
      <form
        onSubmit={handleSubmit}
        class="space-y-3 p-3 bg-muted/50 rounded-lg border border-border"
      >
        <div class="text-sm font-medium text-foreground">
          Request Time Change
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label class="text-xs">Time In</Label>
            <Input
              type="datetime-local"
              value={requestedTimeIn()}
              onInput={(e) => setRequestedTimeIn(e.target.value)}
              class="text-sm"
            />
          </div>
          <div>
            <Label class="text-xs">Time Out</Label>
            <Input
              type="datetime-local"
              value={requestedTimeOut()}
              onInput={(e) => setRequestedTimeOut(e.target.value)}
              class="text-sm"
            />
          </div>
        </div>

        <div>
          <Label class="text-xs">Note</Label>
          <Input
            value={requestedNote()}
            onInput={(e) => setRequestedNote(e.target.value)}
            placeholder="Session note"
            class="text-sm"
          />
        </div>

        <div>
          <Label class="text-xs">Reason for change *</Label>
          <Textarea
            value={reason()}
            onInput={(e) => setReason(e.target.value)}
            placeholder="Why do you need this change?"
            class="text-sm min-h-[60px]"
            maxlength={500}
            required
          />
        </div>

        <div class="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={submitting() || !reason().trim()}
          >
            {submitting() ? "Submitting..." : "Submit Request"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={props.onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  });
  return <>{view()}</>;
}

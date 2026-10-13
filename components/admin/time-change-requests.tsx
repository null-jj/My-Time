import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createEffect, createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileEdit, Check, X, Clock } from "@/components/icons";
import { formatTime, formatDate } from "@/lib/time-format";
import { toast } from "@/components/ui/sonner";
import type { TimeChangeRequestWithEntry } from "@/lib/time-change-request-types";
type UserMap = Record<string, string>;
type AdminTimeChangeRequestsProps = {
  userMap: UserMap;
};
const statusConfig = {
  pending: { label: "Pending", variant: "outline" as const },
  approved: { label: "Approved", variant: "default" as const },
  rejected: { label: "Rejected", variant: "destructive" as const },
};
export function AdminTimeChangeRequests(props: AdminTimeChangeRequestsProps) {
  const [requests, setRequests] = createSignal<TimeChangeRequestWithEntry[]>(
    [],
  );
  const [loading, setLoading] = createSignal(true);
  const [reviewingId, setReviewingId] = createSignal<number | null>(null);
  const [reviewNote, setReviewNote] = createSignal("");
  const [processing, setProcessing] = createSignal(false);
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/time-change-requests", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } finally {
      setLoading(false);
    }
  };
  createEffect(
    () => [],
    () => {
      fetchRequests();
    },
  );
  const handleReview = async (
    requestId: number,
    action: "approved" | "rejected",
  ) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/time-change-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          reviewNote: reviewNote().trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process request");
      }
      toast.success(`Request ${action}`);
      setReviewingId(null);
      setReviewNote("");
      await fetchRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process");
    } finally {
      setProcessing(false);
    }
  };
  const pendingRequests = createMemo(() =>
    requests().filter((r) => r.status === "pending"),
  );
  const processedRequests = createMemo(() =>
    requests().filter((r) => r.status !== "pending"),
  );
  usePageLoading(() => loading() || processing());
  const view = createMemo(() => {
    if (loading()) {
      return (
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <FileEdit class="h-5 w-5" />
              Time Change Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p class="mt-2 text-muted-foreground">Loading requests...</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <div class="space-y-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <FileEdit class="h-5 w-5" />
              Pending Requests
              {pendingRequests().length > 0 && (
                <Badge variant="destructive">{pendingRequests().length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests().length === 0 ? (
              <div class="text-center py-8 text-muted-foreground">
                <FileEdit class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p>No pending change requests</p>
              </div>
            ) : (
              <div class="space-y-4">
                {pendingRequests().map((req) => (
                  <RequestCard
                    request={req}
                    userName={props.userMap[req.userId] || req.userId}
                    isReviewing={reviewingId() === req.id}
                    reviewNote={reviewingId() === req.id ? reviewNote() : ""}
                    processing={processing()}
                    onStartReview={() => {
                      setReviewingId(req.id);
                      setReviewNote("");
                    }}
                    onCancelReview={() => {
                      setReviewingId(null);
                      setReviewNote("");
                    }}
                    onReviewNoteChange={setReviewNote}
                    onApprove={() => handleReview(req.id, "approved")}
                    onReject={() => handleReview(req.id, "rejected")}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Requests (history) */}
        {processedRequests().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Clock class="h-5 w-5" />
                Request History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                {processedRequests()
                  .slice(0, 20)
                  .map((req) => {
                    const config =
                      statusConfig[req.status as keyof typeof statusConfig];
                    return (
                      <div class="p-3 bg-muted/50 rounded-lg border border-border space-y-1">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-medium">
                              {props.userMap[req.userId] || req.userId}
                            </span>
                            <Badge variant={config.variant}>
                              {config.label}
                            </Badge>
                          </div>
                          <span class="text-xs text-muted-foreground">
                            {formatDate(req.originalDate, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div class="text-xs text-muted-foreground">
                          Reason: {req.reason}
                        </div>
                        {req.reviewedAt && (
                          <div class="text-xs text-muted-foreground">
                            Reviewed{" "}
                            {formatDate(req.reviewedAt, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                            {req.reviewNote && ` — ${req.reviewNote}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  });
  return <>{view()}</>;
}
function RequestCard(props: {
  request: TimeChangeRequestWithEntry;
  userName: string;
  isReviewing: boolean;
  reviewNote: string;
  processing: boolean;
  onStartReview: () => void;
  onCancelReview: () => void;
  onReviewNoteChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const view = createMemo(() => {
    return (
      <div class="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="font-medium text-foreground">{props.userName}</span>
            <span class="text-sm text-muted-foreground ml-2">
              {formatDate(props.request.originalDate, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <span class="text-xs text-muted-foreground">
            Filed{" "}
            {formatDate(props.request.createdAt, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Changes */}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <div class="text-xs text-muted-foreground font-medium mb-1">
              Time In
            </div>
            <div class="flex items-center gap-2">
              <span
                class={
                  props.request.requestedTimeIn
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }
              >
                {formatTime(props.request.originalTimeIn)}
              </span>
              {props.request.requestedTimeIn && (
                <span class="text-primary font-medium">
                  → {formatTime(props.request.requestedTimeIn)}
                </span>
              )}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground font-medium mb-1">
              Time Out
            </div>
            <div class="flex items-center gap-2">
              <span
                class={
                  props.request.requestedTimeOut
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }
              >
                {props.request.originalTimeOut
                  ? formatTime(props.request.originalTimeOut)
                  : "—"}
              </span>
              {props.request.requestedTimeOut && (
                <span class="text-primary font-medium">
                  → {formatTime(props.request.requestedTimeOut)}
                </span>
              )}
            </div>
          </div>
        </div>

        {props.request.requestedNote && (
          <div class="text-sm">
            <span class="text-xs text-muted-foreground font-medium">
              Note change:{" "}
            </span>
            <span class="text-foreground">{props.request.requestedNote}</span>
          </div>
        )}

        <div class="text-sm bg-background/50 p-2 rounded border-l-2 border-primary/30">
          <span class="text-xs text-muted-foreground font-medium">
            Reason:{" "}
          </span>
          {props.request.reason}
        </div>

        {/* Review actions */}
        {!props.isReviewing ? (
          <div class="flex gap-2">
            <Button size="sm" onClick={props.onStartReview}>
              Review
            </Button>
          </div>
        ) : (
          <div class="space-y-2 pt-2 border-t border-border">
            <Textarea
              value={props.reviewNote}
              onInput={(e) => props.onReviewNoteChange(e.target.value)}
              placeholder="Optional admin note..."
              class="text-sm min-h-[50px]"
              maxlength={500}
            />
            <div class="flex gap-2">
              <Button
                size="sm"
                onClick={props.onApprove}
                disabled={props.processing}
              >
                <Check class="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={props.onReject}
                disabled={props.processing}
              >
                <X class="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={props.onCancelReview}
                disabled={props.processing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  });
  return <>{view()}</>;
}

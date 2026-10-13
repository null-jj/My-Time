import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createEffect, createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileEdit } from "@/components/icons";
import { formatTime, formatDate } from "@/lib/time-format";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import type { TimeChangeRequestWithEntry } from "@/lib/time-change-request-types";
const statusConfig = {
  pending: { label: "Pending", variant: "outline" as const },
  approved: { label: "Approved", variant: "default" as const },
  rejected: { label: "Rejected", variant: "destructive" as const },
};
export function TimeChangeRequestList(props: { refreshKey: number }) {
  const organizationContext = useOrganizationContext(),
    currentOrganization = () => organizationContext.currentOrganization;
  const [requests, setRequests] = createSignal<TimeChangeRequestWithEntry[]>(
    [],
  );
  const [loading, setLoading] = createSignal(false);
  createEffect(
    () => [currentOrganization(), props.refreshKey],
    () => {
      if (!currentOrganization()) return;
      const fetchRequests = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/time-change-requests", {
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
      fetchRequests();
    },
  );
  usePageLoading(() => loading());
  const view = createMemo(() => {
    if (loading() || requests().length === 0) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <FileEdit class="h-5 w-5" />
            Your Change Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            {requests().map((req) => {
              const config =
                statusConfig[req.status as keyof typeof statusConfig];
              return (
                <div class="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-foreground">
                        {formatDate(req.originalDate, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <span class="text-xs text-muted-foreground">
                      Filed{" "}
                      {formatDate(req.createdAt, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-xs">
                    {req.requestedTimeIn && (
                      <div>
                        <span class="text-muted-foreground">Time In: </span>
                        <span class="line-through text-muted-foreground">
                          {formatTime(req.originalTimeIn)}
                        </span>
                        <span class="text-foreground">
                          {" "}
                          → {formatTime(req.requestedTimeIn)}
                        </span>
                      </div>
                    )}
                    {req.requestedTimeOut && (
                      <div>
                        <span class="text-muted-foreground">Time Out: </span>
                        <span class="line-through text-muted-foreground">
                          {req.originalTimeOut
                            ? formatTime(req.originalTimeOut)
                            : "—"}
                        </span>
                        <span class="text-foreground">
                          {" "}
                          → {formatTime(req.requestedTimeOut)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div class="text-xs text-muted-foreground">
                    Reason: {req.reason}
                  </div>

                  {req.reviewNote && (
                    <div class="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2">
                      Admin: {req.reviewNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  });
  return <>{view()}</>;
}

import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createEffect, createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Clock, ChevronDown, ChevronUp } from "@/components/icons";
import { OrganizationSwitcher } from "@/components/ui/organization-switcher";
import { formatTime, formatDate } from "@/lib/time-format";
import { formatDuration } from "@/lib/time-entries-format";
import { TimeChangeRequestForm } from "@/components/dtr/time-change-request-form";
import { TimeChangeRequestList } from "@/components/dtr/time-change-request-list";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
type GroupedEntries = {
  date: string;
  entries: TimeEntryWithDuration[];
  totalMinutes: number;
};
function groupEntriesByDate(
  entries: TimeEntryWithDuration[],
): GroupedEntries[] {
  const groups: Record<string, GroupedEntries> = {};
  for (const entry of entries) {
    if (!groups[entry.date]) {
      groups[entry.date] = { date: entry.date, entries: [], totalMinutes: 0 };
    }
    groups[entry.date].entries.push(entry);
    if (entry.duration) {
      groups[entry.date].totalMinutes += entry.duration;
    }
  }
  return Object.values(groups).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
export function DtrAdjustmentsContent() {
  const organizationContext = useOrganizationContext(),
    currentOrganization = () => organizationContext.currentOrganization;
  const [entries, setEntries] = createSignal<TimeEntryWithDuration[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [editingEntryId, setEditingEntryId] = createSignal<number | null>(null);
  const [requestRefreshKey, setRequestRefreshKey] = createSignal(0);
  const [expandedDates, setExpandedDates] = createSignal<Set<string>>(
    new Set(),
  );
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries/history?days=30", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        // Auto-expand the first 3 dates
        const grouped = groupEntriesByDate(data.entries);
        setExpandedDates(new Set(grouped.slice(0, 3).map((g) => g.date)));
      }
    } finally {
      setLoading(false);
    }
  };
  createEffect(
    () => [currentOrganization(), fetchHistory],
    () => {
      if (currentOrganization()) {
        fetchHistory();
      }
    },
  );
  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };
  const grouped = createMemo(() => groupEntriesByDate(entries()));
  usePageLoading(() => loading());
  const view = createMemo(() => {
    return (
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-foreground mb-2">
              DTR Adjustments
            </h1>
            <p class="text-muted-foreground">
              Request changes to your past time records. Click any completed
              session to file an adjustment.
            </p>
          </div>
          <OrganizationSwitcher variant="compact" />
        </div>

        {/* Change Request History */}
        <TimeChangeRequestList refreshKey={requestRefreshKey()} />

        {/* Historical Entries */}
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-5 w-5" />
              Time Records (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading() ? (
              <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p class="mt-2 text-muted-foreground">Loading records...</p>
              </div>
            ) : grouped().length === 0 ? (
              <div class="text-center py-8 text-muted-foreground">
                <Clock class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p>No time records found</p>
                <p class="text-sm">
                  Start tracking time on the Time Clock page
                </p>
              </div>
            ) : (
              <div class="space-y-3">
                {grouped().map((props) => {
                  const isExpanded = expandedDates().has(props.date);
                  const completedCount = props.entries.filter(
                    (e) => e.timeOut,
                  ).length;
                  return (
                    <div class="rounded-lg border border-border overflow-hidden">
                      {/* Date header - clickable */}
                      <button
                        type="button"
                        class="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/80 transition-colors text-left"
                        onClick={() => toggleDate(props.date)}
                      >
                        <div class="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp class="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown class="h-4 w-4 text-muted-foreground" />
                          )}
                          <span class="font-medium text-foreground">
                            {formatDate(props.date + "T12:00:00", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <Badge variant="outline" class="text-xs">
                            {completedCount} session
                            {completedCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <span class="text-sm font-medium text-primary">
                          {formatDuration(props.totalMinutes)}
                        </span>
                      </button>

                      {/* Expanded entries */}
                      {isExpanded && (
                        <div class="p-3 space-y-2 border-t border-border">
                          {props.entries.map((entry, index) => (
                            <div class="space-y-2">
                              <div class="flex items-center justify-between p-2 bg-background rounded-md">
                                <div>
                                  <div class="text-sm font-medium text-foreground">
                                    Session {index + 1}
                                  </div>
                                  <div class="text-xs text-muted-foreground">
                                    {formatTime(entry.timeIn)} -{" "}
                                    {entry.timeOut
                                      ? formatTime(entry.timeOut)
                                      : "In Progress"}
                                  </div>
                                </div>
                                <div class="flex items-center gap-2">
                                  <div class="text-right">
                                    <div class="text-sm font-medium text-primary">
                                      {entry.isActive
                                        ? "Active"
                                        : formatDuration(entry.duration || 0)}
                                    </div>
                                    {entry.note && (
                                      <div class="text-xs text-muted-foreground max-w-[150px] truncate">
                                        {entry.note}
                                      </div>
                                    )}
                                  </div>
                                  {entry.timeOut && (
                                    <Button
                                      variant={
                                        editingEntryId() === entry.id
                                          ? "default"
                                          : "ghost"
                                      }
                                      size="sm"
                                      class="h-8 w-8 p-0"
                                      onClick={() =>
                                        setEditingEntryId(
                                          editingEntryId() === entry.id
                                            ? null
                                            : entry.id,
                                        )
                                      }
                                      title="Request time change"
                                    >
                                      <FileEdit class="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {editingEntryId() === entry.id && (
                                <TimeChangeRequestForm
                                  entry={entry}
                                  onClose={() => setEditingEntryId(null)}
                                  onSubmitted={() =>
                                    setRequestRefreshKey((k) => k + 1)
                                  }
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  });
  return <>{view()}</>;
}

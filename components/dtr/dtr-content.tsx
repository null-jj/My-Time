import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createMemo } from "solid-js";
import { DTRClient } from "@/components/dtr/dtr-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, FileEdit } from "@/components/icons";
import { OrganizationSwitcher } from "@/components/ui/organization-switcher";
import { formatTime, formatDate } from "@/lib/time-format";
import { formatDuration } from "@/lib/time-entries-format";
import { TimeChangeRequestForm } from "@/components/dtr/time-change-request-form";
import { TimeChangeRequestList } from "@/components/dtr/time-change-request-list";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
function calculateTotalDuration(entries: TimeEntryWithDuration[]): number {
  return entries.reduce(
    (sum: number, entry: TimeEntryWithDuration) => sum + (entry.duration || 0),
    0,
  );
}
function calculateTotalWorkedTime(
  entries: TimeEntryWithDuration[],
  activeEntry: TimeEntryWithDuration | null,
  isClockedIn: boolean,
): string {
  let totalMinutes = calculateTotalDuration(entries);
  if (activeEntry && isClockedIn) {
    const now = new Date().getTime();
    const start = new Date(activeEntry.timeIn).getTime();
    totalMinutes += Math.round((now - start) / (1000 * 60));
  }
  return formatDuration(totalMinutes);
}
function getStatus(
  isClockedIn: boolean,
  todayEntries: TimeEntryWithDuration[],
): {
  text: string;
  variant: "secondary" | "default" | "outline";
} {
  if (!isClockedIn && todayEntries.length === 0) {
    return { text: "Not Clocked In", variant: "secondary" };
  }
  if (isClockedIn) {
    return { text: "Clocked In", variant: "default" };
  }
  return { text: "Completed Sessions", variant: "outline" };
}
type DTRContentProps = {
  initialActiveEntry: TimeEntryWithDuration | null;
  initialTodayEntries: TimeEntryWithDuration[];
  initialIsClockedIn: boolean;
};
export function DTRContent(props: DTRContentProps) {
  const [activeEntry, setActiveEntry] = createSignal(props.initialActiveEntry);
  const [todayEntries, setTodayEntries] = createSignal(
    props.initialTodayEntries,
  );
  const [isClockedIn, setIsClockedIn] = createSignal(props.initialIsClockedIn);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [editingEntryId, setEditingEntryId] = createSignal<number | null>(null);
  const [requestRefreshKey, setRequestRefreshKey] = createSignal(0);
  const fetchDTRData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/dtr/api", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setActiveEntry(data.activeEntry);
        setTodayEntries(data.todayEntries);
        setIsClockedIn(data.isClockedIn);
      }
    } finally {
      setLoading(false);
    }
  };
  const totalWorkedTime = createMemo(() =>
    calculateTotalWorkedTime(todayEntries(), activeEntry(), isClockedIn()),
  );
  const status = createMemo(() => getStatus(isClockedIn(), todayEntries()));
  usePageLoading(() => loading());
  const view = createMemo(() => {
    return (
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-foreground mb-2">Time Clock</h1>
            <p class="text-muted-foreground">
              Track your daily work hours and manage your time records.
            </p>
          </div>
          <OrganizationSwitcher variant="compact" />
        </div>

        <Card class="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Clock class="h-5 w-5" />
                Today&apos;s Time Record
              </div>
              <Badge variant={status().variant}>{status().text}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div class="text-center">
                <div class="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                  <Calendar class="h-4 w-4" />
                  Date
                </div>
                <div class="font-semibold text-foreground">
                  {formatDate(new Date().toISOString(), {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <div class="text-center">
                <div class="text-sm text-muted-foreground mb-1">
                  Current Session
                </div>
                <div class="font-semibold text-primary">
                  {activeEntry()
                    ? formatTime(activeEntry()?.timeIn ?? "")
                    : "-"}
                </div>
              </div>
              <div class="text-center">
                <div class="text-sm text-muted-foreground mb-1">
                  Sessions Today
                </div>
                <div class="font-semibold text-primary">
                  {todayEntries().length}
                </div>
              </div>
            </div>

            <div class="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div class="text-sm text-muted-foreground mb-1">
                Total Hours Worked Today
              </div>
              <div class="text-3xl font-bold text-primary">
                {totalWorkedTime()}
              </div>
            </div>

            <DTRClient
              initialActiveEntry={activeEntry()}
              initialTodayEntries={todayEntries()}
              initialIsClockedIn={isClockedIn()}
              refreshData={fetchDTRData}
            />
          </CardContent>
        </Card>

        {todayEntries().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Clock class="h-5 w-5" />
                Today&apos;s Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                {todayEntries().map((entry, index) => (
                  <div class="space-y-2">
                    <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                      <div>
                        <div class="font-medium text-foreground">
                          Session {index + 1}
                        </div>
                        <div class="text-sm text-muted-foreground">
                          {formatTime(entry.timeIn)} -{" "}
                          {entry.timeOut
                            ? formatTime(entry.timeOut)
                            : "In Progress"}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="text-right">
                          <div class="font-medium text-primary">
                            {entry.isActive
                              ? "Active"
                              : formatDuration(entry.duration || 0)}
                          </div>
                          {entry.note && (
                            <div class="text-xs text-muted-foreground mt-1">
                              Note: {entry.note}
                            </div>
                          )}
                        </div>
                        {entry.timeOut && (
                          <Button
                            variant="ghost"
                            size="sm"
                            class="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setEditingEntryId(
                                editingEntryId() === entry.id ? null : entry.id,
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
                        onSubmitted={() => setRequestRefreshKey((k) => k + 1)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <TimeChangeRequestList refreshKey={requestRefreshKey()} />
      </div>
    );
  });
  return <>{view()}</>;
}

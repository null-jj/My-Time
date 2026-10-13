import { createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "@/components/icons";
import { format, parseISO } from "date-fns";
import { formatTimeOnly } from "@/lib/time-format";
import { formatDuration } from "@/lib/time-entries-format";
interface RecentActivityProps {
  records: Array<{
    date: string;
    timeIn?: string;
    timeOut?: string;
    message?: string;
    duration?: number; // Duration in minutes
  }>;
}
export function RecentActivity(props: RecentActivityProps) {
  const getStatusBadge = (timeIn?: string, timeOut?: string) => {
    if (!timeIn) return <Badge variant="secondary">No Entry</Badge>;
    if (!timeOut) return <Badge variant="default">In Progress</Badge>;
    return <Badge variant="default">Complete</Badge>;
  };
  const view = createMemo(() => {
    return (
      <Card class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            {props.records.length === 0 ? (
              <div class="text-center text-muted-foreground py-8">
                No recent activity
              </div>
            ) : (
              props.records.slice(0, 5).map((record) => (
                <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-foreground">
                        {format(parseISO(record.date), "MMM dd, yyyy")}
                      </span>
                      {getStatusBadge(record.timeIn, record.timeOut)}
                    </div>
                    <div class="text-sm text-muted-foreground flex items-center gap-4">
                      <span class="flex items-center gap-1">
                        <Clock class="h-3 w-3" />
                        {record.timeIn
                          ? formatTimeOnly(record.timeIn)
                          : "-"} -{" "}
                        {record.timeOut ? formatTimeOnly(record.timeOut) : "-"}
                      </span>
                      {record.duration && record.duration > 0 && (
                        <span class="font-medium text-primary">
                          {formatDuration(record.duration)}
                        </span>
                      )}
                    </div>
                    {record.message && (
                      <div class="text-xs text-muted-foreground mt-1 truncate">
                        {record.message}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  });
  return <>{view()}</>;
}

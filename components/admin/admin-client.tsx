import { createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/icons";
import { formatDuration } from "@/lib/time-entries-format";
import { formatTime } from "@/lib/time-format";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
type AdminClientProps = {
  records: Array<{
    userId: string;
    userName: string;
    dates: Array<{
      date: string;
      entries: TimeEntryWithDuration[];
      totalMinutes: number;
    }>;
  }>;
};
export function AdminClient(props: AdminClientProps) {
  const view = createMemo(() => {
    if (props.records.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Calendar class="h-5 w-5" />
              Time Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-center py-8 text-muted-foreground">
              <Calendar class="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p>No time records found</p>
              <p class="text-sm">No users have tracked time yet</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <div class="space-y-6">
        {props.records.map((props) => (
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Calendar class="h-5 w-5" />
                {props.userName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                {props.dates.map((props) => (
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-3">
                      <span class="font-medium">
                        {new Date(props.date).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span class="text-sm font-medium text-blue-600">
                        {formatDuration(props.totalMinutes)}
                      </span>
                    </div>
                    <div class="space-y-2">
                      {props.entries.map((entry, index) => (
                        <div class="flex items-center justify-between text-sm">
                          <span>Session {index + 1}</span>
                          <span class="text-gray-600">
                            {formatTime(entry.timeIn)} -{" "}
                            {entry.timeOut
                              ? formatTime(entry.timeOut)
                              : "In Progress"}
                          </span>
                          <span class="font-medium text-blue-600">
                            {entry.duration
                              ? formatDuration(entry.duration)
                              : "Active"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  });
  return <>{view()}</>;
}

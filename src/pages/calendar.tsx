import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createEffect, createMemo } from "solid-js";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { formatTimeOnly } from "@/lib/time-format";
import { OrganizationSwitcher } from "@/components/ui/organization-switcher";
type CalendarRecord = {
  date: string;
  timeIn: string;
  timeOut?: string;
  note?: string;
  duration: string | null;
  entries: Array<{
    id: number;
    userId: string;
    orgId: string;
    date: string;
    timeIn: string;
    timeOut?: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
  }>;
};
export default function CalendarPage() {
  const organizationContext = useOrganizationContext(),
    organization = () => organizationContext.currentOrganization,
    orgLoading = () => organizationContext.loading;
  const orgId = createMemo(() => organization()?.id);
  const [records, setRecords] = createSignal<CalendarRecord[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [currentDate, setCurrentDate] = createSignal(new Date());
  createEffect(
    () => [orgId(), currentDate()],
    () => {
      if (!orgId()) return;
      const fetchRecords = async () => {
        setLoading(true);
        setError(null);
        try {
          const month = format(currentDate(), "yyyy-MM");
          const res = await fetch(`/calendar/api?month=${month}`, {
            credentials: "include",
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          setRecords(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    },
  );
  const monthStart = createMemo(() => startOfMonth(currentDate()));
  const monthEnd = createMemo(() => endOfMonth(currentDate()));
  const calendarDays = createMemo(() =>
    eachDayOfInterval({ start: monthStart(), end: monthEnd() }),
  );
  const getRecordForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return records().find((record) => record.date === dateStr);
  };
  const getStatusColor = (record?: CalendarRecord) => {
    if (!record) return "";
    if (!record.timeIn) return "bg-gray-50";
    if (!record.timeOut) return "bg-blue-50 border-blue-200";
    return "bg-green-50 border-green-200";
  };
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(
      direction === "prev"
        ? subMonths(currentDate(), 1)
        : addMonths(currentDate(), 1),
    );
  };
  usePageLoading(() => orgLoading() || loading());
  const view = createMemo(() => {
    if (orgLoading() || loading()) {
      return (
        <div class="max-w-6xl mx-auto p-6">
          <div class="mb-6 flex items-center justify-between">
            <div class="space-y-2">
              <Skeleton class="h-8 w-48" />
              <Skeleton class="h-4 w-72" />
            </div>
            <Skeleton class="h-8 w-32 rounded-md" />
          </div>
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <Skeleton class="h-6 w-40" />
                <div class="flex gap-2">
                  <Skeleton class="h-8 w-8 rounded-md" />
                  <Skeleton class="h-8 w-8 rounded-md" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map(() => (
                  <Skeleton class="h-8 rounded" />
                ))}
                {Array.from({ length: 35 }).map(() => (
                  <Skeleton class="min-h-[100px] rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    if (error()) {
      return (
        <div class="max-w-6xl mx-auto p-6">
          <div class="text-center py-8">
            <p class="text-red-600">Error loading calendar: {error()}</p>
          </div>
        </div>
      );
    }
    return (
      <div class="max-w-6xl mx-auto p-6">
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-foreground mb-2">
              Calendar View
            </h1>
            <p class="text-muted-foreground">
              View your time records in a calendar format.
            </p>
          </div>
          <OrganizationSwitcher variant="compact" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Calendar class="h-5 w-5" />
                {format(currentDate(), "MMMM yyyy")}
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  class="h-8 w-8 p-0"
                >
                  <ChevronLeft class="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  class="h-8 w-8 p-0"
                >
                  <ChevronRight class="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div class="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before the 1st of the month */}
              {Array.from({ length: monthStart().getDay() }, () => (
                <div class="min-h-[100px]" />
              ))}

              {/* Calendar days */}
              {calendarDays().map((day) => {
                const isCurrentMonth = isSameMonth(day, currentDate());
                const isToday = isSameDay(day, new Date());
                const record = getRecordForDate(day);
                return (
                  <div
                    class={`
                    min-h-[100px] p-2 border border-border rounded-lg transition-colors
                    ${isCurrentMonth ? "bg-card" : "bg-muted/50"}
                    ${isToday ? "ring-2 ring-primary" : ""}
                    ${getStatusColor(record)}
                  `}
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span
                        class={`text-sm font-medium ${isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {format(day, "d")}
                      </span>
                      {record?.duration && (
                        <Badge variant="success" class="text-xs">
                          {record.duration}h
                        </Badge>
                      )}
                    </div>

                    {record && (
                      <div class="space-y-1 text-xs">
                        {record.timeIn && (
                          <div class="flex items-center gap-1">
                            <Clock class="h-3 w-3" />
                            <span>{formatTimeOnly(record.timeIn)}</span>
                          </div>
                        )}
                        {record.timeOut && (
                          <div class="flex items-center gap-1">
                            <Clock class="h-3 w-3" />
                            <span>{formatTimeOnly(record.timeOut)}</span>
                          </div>
                        )}
                        {record.note && (
                          <div
                            class="text-xs text-muted-foreground truncate"
                            title={record.note}
                          >
                            {record.note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  });
  return <>{view()}</>;
}

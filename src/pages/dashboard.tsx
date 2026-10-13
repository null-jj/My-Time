import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { OrganizationSwitcher } from "@/components/ui/organization-switcher";
import type { getDashboardData } from "../server-data";
export function DashboardPage(props: {
  data: Awaited<ReturnType<typeof getDashboardData>>;
}) {
  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-foreground">
            Welcome back, {props.data.userName}!
          </h1>
          <p class="text-muted-foreground">
            Here's your time tracking overview for today.
          </p>
        </div>
        <OrganizationSwitcher variant="compact" />
      </div>
      <StatsCards stats={props.data.stats} />
      <DashboardClient
        initialActiveEntry={props.data.activeEntry}
        initialTodayEntries={props.data.todayEntries}
        initialIsClockedIn={props.data.isClockedIn}
      />
      <RecentActivity
        records={props.data.recentRecords.map((entry) => ({
          date: entry.date,
          timeIn: entry.timeIn,
          timeOut: entry.timeOut || undefined,
          duration: entry.duration,
          message: entry.note || undefined,
        }))}
      />
    </div>
  );
}

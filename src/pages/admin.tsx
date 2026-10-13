import { createMemo } from "solid-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationManagement } from "@/components/admin/organization-management";
import { AdminClient } from "@/components/admin/admin-client";
import { AdminTimeChangeRequests } from "@/components/admin/time-change-requests";
import { DtrExport } from "@/components/admin/dtr-export";
import { OrganizationSwitcher } from "@/components/ui/organization-switcher";
import type { TimeEntryWithDuration } from "@/lib/time-entries-types";
import type { getAdminData } from "../server-data";
export function AdminPage(props: {
  data: Awaited<ReturnType<typeof getAdminData>>;
}) {
  const records = createMemo(() => {
    const users = new Map<
      string,
      {
        userId: string;
        userName: string;
        dates: Map<
          string,
          {
            date: string;
            entries: TimeEntryWithDuration[];
            totalMinutes: number;
          }
        >;
      }
    >();
    for (const entry of props.data.entries) {
      let user = users.get(entry.userId);
      if (!user) {
        user = {
          userId: entry.userId,
          userName: props.data.userMap[entry.userId] || entry.userId,
          dates: new Map(),
        };
        users.set(entry.userId, user);
      }
      let day = user.dates.get(entry.date);
      if (!day) {
        day = { date: entry.date, entries: [], totalMinutes: 0 };
        user.dates.set(entry.date, day);
      }
      day.entries.push(entry);
      day.totalMinutes += entry.duration || 0;
    }
    return [...users.values()].map((user) => ({
      ...user,
      dates: [...user.dates.values()].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    }));
  });
  return (
    <div class="max-w-6xl mx-auto p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p class="text-muted-foreground">
            Manage your organization and view team time records
          </p>
        </div>
        <OrganizationSwitcher variant="compact" />
      </div>
      <Tabs defaultValue="organization" class="space-y-6">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="time-records">Time Records</TabsTrigger>
          <TabsTrigger value="change-requests">Change Requests</TabsTrigger>
          <TabsTrigger value="export-dtr">Export DTR</TabsTrigger>
        </TabsList>
        <TabsContent value="organization">
          <OrganizationManagement />
        </TabsContent>
        <TabsContent value="time-records">
          <AdminClient records={records()} />
        </TabsContent>
        <TabsContent value="change-requests">
          <AdminTimeChangeRequests userMap={props.data.userMap} />
        </TabsContent>
        <TabsContent value="export-dtr">
          <DtrExport orgId={props.data.orgId} members={props.data.members} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

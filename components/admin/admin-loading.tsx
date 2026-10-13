import { createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings, BarChart3, Shield } from "@/components/icons";
export function AdminPageSkeleton() {
  const view = createMemo(() => {
    return (
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield class="h-8 w-8" />
              Admin Panel
            </h1>
            <p class="text-gray-600">
              Manage your organization and monitor team activity.
            </p>
          </div>
          <Skeleton class="h-10 w-32" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(() => (
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton class="h-4 w-24" />
                <Skeleton class="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton class="h-8 w-12 mb-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="organization" class="space-y-6">
          <TabsList>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="records">Time Records</TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            <OrganizationManagementSkeleton />
          </TabsContent>

          <TabsContent value="members">
            <MembersSkeleton />
          </TabsContent>

          <TabsContent value="records">
            <RecordsSkeleton />
          </TabsContent>
        </Tabs>
      </div>
    );
  });
  return <>{view()}</>;
}
export function OrganizationManagementSkeleton() {
  const view = createMemo(() => {
    return (
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5" />
            Organization Management
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton class="h-4 w-20 mb-2" />
              <Skeleton class="h-10 w-full" />
            </div>
            <div>
              <Skeleton class="h-4 w-24 mb-2" />
              <Skeleton class="h-20 w-full" />
            </div>
          </div>
          <Skeleton class="h-10 w-32" />
        </CardContent>
      </Card>
    );
  });
  return <>{view()}</>;
}
export function MembersSkeleton() {
  const view = createMemo(() => {
    return (
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Users class="h-5 w-5" />
            Organization Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            {[1, 2, 3, 4].map(() => (
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex-1">
                  <Skeleton class="h-5 w-32 mb-1" />
                  <Skeleton class="h-4 w-48" />
                </div>
                <div class="flex items-center gap-3">
                  <Skeleton class="h-6 w-16" />
                  <Skeleton class="h-8 w-20" />
                  <Skeleton class="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  });
  return <>{view()}</>;
}
export function RecordsSkeleton() {
  const view = createMemo(() => {
    return (
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <BarChart3 class="h-5 w-5" />
            Time Records (Past 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-6">
            {[1, 2, 3].map(() => (
              <div class="border rounded-lg p-4">
                <Skeleton class="h-6 w-40 mb-4" />
                <div class="space-y-4">
                  {[1, 2].map(() => (
                    <div class="bg-gray-50 rounded-lg p-3">
                      <div class="flex items-center justify-between mb-3">
                        <Skeleton class="h-4 w-20" />
                        <Skeleton class="h-4 w-16" />
                      </div>
                      <div class="space-y-2">
                        {[1, 2, 3].map(() => (
                          <div class="flex items-center justify-between text-sm">
                            <Skeleton class="h-3 w-16" />
                            <Skeleton class="h-3 w-24" />
                            <Skeleton class="h-3 w-12" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  });
  return <>{view()}</>;
}

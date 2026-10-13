import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
export function SidebarSkeleton() {
  return (
    <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div class="flex min-h-0 flex-1 flex-col bg-sidebar shadow-xl border-r border-sidebar-border">
        <div class="flex flex-1 flex-col">
          {/* Header */}
          <div class="flex items-center space-x-3 p-4 border-b border-sidebar-border">
            <Skeleton class="w-8 h-8 rounded-lg" />
            <Skeleton class="h-5 w-24" />
          </div>
          {/* Org selector */}
          <div class="px-4 py-3 border-b border-sidebar-border">
            <Skeleton class="h-9 w-full rounded-md" />
          </div>
          {/* Nav items */}
          <div class="flex-1 px-4 py-6 space-y-2">
            {Array.from({ length: 5 }).map(() => (
              <div class="flex items-center px-3 py-2 gap-3">
                <Skeleton class="h-5 w-5 rounded" />
                <Skeleton class="h-4 w-24" />
              </div>
            ))}
          </div>
          {/* User profile */}
          <div class="border-t border-sidebar-border p-4">
            <div class="flex items-center space-x-3">
              <Skeleton class="w-10 h-10 rounded-full" />
              <div class="flex-1 space-y-1.5">
                <Skeleton class="h-4 w-28" />
                <Skeleton class="h-3 w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function PageSkeleton() {
  return (
    <div class="space-y-6">
      {/* Page header */}
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <Skeleton class="h-8 w-64" />
          <Skeleton class="h-4 w-80" />
        </div>
        <Skeleton class="h-8 w-32 rounded-md" />
      </div>

      {/* Stats cards */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map(() => (
          <Card>
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton class="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content cards */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton class="h-5 w-28" />
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="text-center space-y-2">
              <Skeleton class="h-8 w-40 mx-auto" />
              <Skeleton class="h-4 w-48 mx-auto" />
            </div>
            <Skeleton class="h-10 w-full rounded-md" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton class="h-5 w-36" />
          </CardHeader>
          <CardContent class="space-y-3">
            {Array.from({ length: 3 }).map(() => (
              <div class="p-4 rounded-lg border border-border">
                <div class="flex justify-between mb-2">
                  <Skeleton class="h-4 w-20" />
                  <Skeleton class="h-4 w-12" />
                </div>
                <Skeleton class="h-3 w-40" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton class="h-5 w-32" />
      </CardHeader>
      <CardContent class="space-y-3">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton class="h-8 w-16 mb-1" />
        <Skeleton class="h-3 w-20" />
      </CardContent>
    </Card>
  );
}
export function TimeClockSkeleton() {
  return (
    <Card class="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Skeleton class="h-5 w-5" />
          <Skeleton class="h-5 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="text-center">
          <Skeleton class="h-12 w-48 mx-auto mb-2" />
          <Skeleton class="h-4 w-64 mx-auto" />
        </div>

        <div class="flex justify-center">
          <Skeleton class="h-6 w-24" />
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Skeleton class="h-4 w-20 mb-1" />
            <Skeleton class="h-5 w-16" />
          </div>
          <div>
            <Skeleton class="h-4 w-20 mb-1" />
            <Skeleton class="h-5 w-16" />
          </div>
        </div>

        <div class="text-center">
          <Skeleton class="h-4 w-24 mx-auto mb-1" />
          <Skeleton class="h-8 w-20 mx-auto" />
        </div>

        <div class="flex gap-3">
          <Skeleton class="h-12 flex-1" />
          <Skeleton class="h-12 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}
export function TodayEntriesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Skeleton class="h-5 w-5" />
          <Skeleton class="h-5 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          {[1, 2, 3].map(() => (
            <div class="p-4 rounded-lg border bg-gray-50">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <Skeleton class="h-4 w-16" />
                  <Skeleton class="h-5 w-12" />
                </div>
                <Skeleton class="h-5 w-20" />
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <Skeleton class="h-3 w-12 mb-1" />
                  <Skeleton class="h-4 w-16" />
                </div>
                <div>
                  <Skeleton class="h-3 w-12 mb-1" />
                  <Skeleton class="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
export function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Skeleton class="h-5 w-5" />
          <Skeleton class="h-5 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          {[1, 2, 3, 4, 5].map(() => (
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <Skeleton class="h-5 w-24" />
                  <Skeleton class="h-5 w-16" />
                </div>
                <div class="flex items-center gap-6 text-sm">
                  <Skeleton class="h-4 w-32" />
                  <Skeleton class="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

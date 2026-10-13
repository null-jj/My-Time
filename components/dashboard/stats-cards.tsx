import { createMemo } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, TrendingUp, Users } from "@/components/icons";
interface StatsCardsProps {
  stats: {
    todayHours: string;
    weekHours: string;
    monthHours: string;
    totalDays: number;
  };
}
export function StatsCards(props: StatsCardsProps) {
  const cards = createMemo(() => [
    {
      title: "Today's Hours",
      value: props.stats.todayHours,
      icon: Clock,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "This Week",
      value: props.stats.weekHours,
      icon: Calendar,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "This Month",
      value: props.stats.monthHours,
      icon: TrendingUp,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Total Days",
      value: props.stats.totalDays.toString(),
      icon: Users,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]);
  const view = createMemo(() => {
    return (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards().map((card) => {
          const Icon = card.icon;
          return (
            <Card class="hover:shadow-lg transition-shadow">
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div class={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon class={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold text-foreground">
                  {card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  });
  return <>{view()}</>;
}

import { Dynamic } from "@solidjs/web";
import { useTheme } from "@/lib/contexts/theme-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  BarChart3,
  Users,
  Calendar,
  Sun,
  Moon,
} from "@/components/icons";
const samples = [
  { label: "Today", value: "8h 12m", icon: Clock },
  { label: "This Week", value: "37h 45m", icon: BarChart3 },
  { label: "Team", value: "12 members", icon: Users },
  { label: "Calendar", value: "5 entries", icon: Calendar },
];
export function DarkModePreview() {
  const { theme, setTheme } = useTheme();
  return (
    <Card
      class={
        theme === "dark"
          ? "border-2 border-dashed border-primary/50"
          : "border-2 border-dashed border-muted-foreground/20"
      }
    >
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          {theme === "dark" ? (
            <Sun class="h-5 w-5" />
          ) : (
            <Moon class="h-5 w-5" />
          )}
          {theme === "dark" ? "Dark Mode Active" : "Dark Mode Preview"}
        </CardTitle>
        <CardDescription>
          {theme === "dark"
            ? "You're now viewing the improved dark mode theme"
            : "Switch to dark mode to see the improved theme"}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <ShowTheme dark={theme === "dark"} setTheme={setTheme} />
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium">Email</label>
            <Input type="email" placeholder="Enter your email" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Password</label>
            <Input type="password" placeholder="••••••••" />
          </div>
        </div>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" class="grid grid-cols-2 gap-3 pt-2">
            <ForCards />
          </TabsContent>
          <TabsContent value="activity" class="pt-2">
            <div class="rounded-md border p-4 text-sm text-muted-foreground">
              Recent time tracking activity appears here.
            </div>
          </TabsContent>
        </Tabs>
        <Button
          variant="outline"
          class="w-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun class="mr-2 h-4 w-4" />
          ) : (
            <Moon class="mr-2 h-4 w-4" />
          )}
          {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </Button>
      </CardContent>
    </Card>
  );
}
function ShowTheme(props: {
  dark: boolean;
  setTheme: (theme: "light" | "dark") => void;
}) {
  return props.dark ? (
    <Badge variant="success">Dark mode active</Badge>
  ) : (
    <Button class="w-full" onClick={() => props.setTheme("dark")}>
      <Moon class="mr-2 h-4 w-4" />
      Switch to Dark Mode
    </Button>
  );
}
function ForCards() {
  return (
    <>
      {samples.map((sample) => (
        <div class="rounded-md border p-3">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Dynamic component={sample.icon} class="h-4 w-4" />
            {sample.label}
          </div>
          <div class="mt-1 font-semibold">{sample.value}</div>
        </div>
      ))}
    </>
  );
}

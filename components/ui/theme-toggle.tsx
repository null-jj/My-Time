import { useTheme } from "@/lib/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Palette } from "@/components/icons";
export function ThemeToggle() {
  const context = useTheme();
  const cycleTheme = () => {
    const index = context.themes.indexOf(context.theme);
    context.setTheme(context.themes[(index + 1) % context.themes.length]!);
  };
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      class="h-9 w-9"
      title={`Current theme: ${context.theme}. Click to cycle themes.`}
    >
      <Palette class="h-4 w-4" />
      <span class="sr-only">Toggle theme</span>
    </Button>
  );
}

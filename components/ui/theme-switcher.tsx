import { Dynamic } from "@solidjs/web";
import { useTheme, type Theme } from "@/lib/contexts/theme-context";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Sun,
  Moon,
  Droplets,
  Leaf,
  Sparkles,
  Flame,
  Heart,
} from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const themeIcons = {
  light: Sun,
  dark: Moon,
  blue: Droplets,
  green: Leaf,
  purple: Sparkles,
  orange: Flame,
  rose: Heart,
} satisfies Record<Theme, typeof Sun>;
const themeNames: Record<Theme, string> = {
  light: "Light",
  dark: "Dark Mode",
  blue: "Ocean",
  green: "Forest",
  purple: "Royal",
  orange: "Sunset",
  rose: "Rose",
};
export function ThemeSwitcher() {
  const context = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" class="h-9 w-9">
          <Dynamic component={themeIcons[context.theme]} class="h-4 w-4" />
          <span class="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-48">
        <div class="flex items-center gap-2 px-2 py-1.5 text-sm font-medium">
          <Palette class="h-4 w-4" />
          Themes
        </div>
        {context.themes.map((option) => (
          <DropdownMenuItem
            onClick={() => context.setTheme(option)}
            class="flex items-center gap-2"
          >
            <Dynamic component={themeIcons[option]} class="h-4 w-4" />
            <span>{themeNames[option]}</span>
            {context.theme === option && (
              <div class="ml-auto h-2 w-2 rounded-full bg-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

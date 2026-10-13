import {
  createContext,
  createEffect,
  createSignal,
  useContext,
} from "solid-js";
import type { JSX } from "@solidjs/web";
export type Theme =
  "light" | "dark" | "blue" | "green" | "purple" | "orange" | "rose";
const themes: readonly Theme[] = [
  "light",
  "dark",
  "blue",
  "green",
  "purple",
  "orange",
  "rose",
];
type ThemeContextValue = {
  readonly theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: readonly Theme[];
};
const ThemeContext = createContext<ThemeContextValue>();
export function ThemeProvider(props: { children: JSX.Element }) {
  const [theme, setThemeState] = createSignal<Theme>("light");
  const setTheme = (nextTheme: Theme) => setThemeState(nextTheme);
  createEffect(
    () => undefined,
    () => {
      const saved = themes.find(
        (candidate) => candidate === localStorage.getItem("theme"),
      );
      if (saved) setThemeState(saved);
    },
  );
  createEffect(theme, (nextTheme) => {
    document.documentElement.classList.remove(...themes);
    document.documentElement.classList.add(nextTheme);
    localStorage.setItem("theme", nextTheme);
  });
  return (
    <ThemeContext
      value={{
        get theme() {
          return theme();
        },
        setTheme,
        themes,
      }}
    >
      {props.children}
    </ThemeContext>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context)
    throw new Error("useTheme must be used within a ThemeProvider.");
  return context;
}

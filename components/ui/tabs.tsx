import {
  createContext,
  createSignal,
  createUniqueId,
  omit,
  Show,
  useContext,
} from "solid-js";
import type { JSX } from "@solidjs/web";
import { cn } from "@/lib/utils";
import { invokeHandler } from "./events";
type TabsValue = {
  id: string;
  value: () => string;
  setValue: (value: string) => void;
};
const TabsContext = createContext<TabsValue>();
function useTabs() {
  const tabs = useContext(TabsContext);
  if (!tabs) throw new Error("Tab components must be used within Tabs.");
  return tabs;
}
export function Tabs(
  props: JSX.HTMLAttributes<HTMLDivElement> & {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  },
) {
  const [internalValue, setInternalValue] = createSignal(
    props.defaultValue ?? "",
  );
  const id = createUniqueId();
  const value = () => props.value ?? internalValue();
  const setValue = (next: string) => {
    if (props.value === undefined) setInternalValue(next);
    props.onValueChange?.(next);
  };
  const rest = omit(props, "defaultValue", "value", "onValueChange");
  return (
    <TabsContext value={{ id: props.id || id, value, setValue }}>
      <div {...rest} />
    </TabsContext>
  );
}
export function TabsList(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const rest = omit(props, "class", "onKeyDown");
  return (
    <div
      role="tablist"
      class={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        props.class,
      )}
      {...rest}
      onKeyDown={(event) => {
        invokeHandler(props.onKeyDown, event);
        if (
          event.defaultPrevented ||
          !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
        )
          return;
        const tabs = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
            '[role="tab"]:not([disabled])',
          ),
        ];
        if (!tabs.length) return;
        event.preventDefault();
        const current = tabs.findIndex((tab) => tab === document.activeElement);
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : (current + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) %
                tabs.length;
        tabs[index].focus();
        tabs[index].click();
      }}
    />
  );
}
export function TabsTrigger(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
  },
) {
  const tabs = useTabs();
  const active = () => tabs.value() === props.value;
  const rest = omit(props, "class", "value", "onClick", "aria-selected");
  return (
    <button
      type="button"
      role="tab"
      id={`${tabs.id}-tab-${props.value}`}
      aria-controls={`${tabs.id}-panel-${props.value}`}
      aria-selected={active() ? "true" : "false"}
      tabindex={active() ? 0 : -1}
      class={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        active() && "bg-background text-foreground shadow",
        props.class,
      )}
      {...rest}
      onClick={(event) => {
        invokeHandler(props.onClick, event);
        if (!event.defaultPrevented) tabs.setValue(props.value);
      }}
    />
  );
}
export function TabsContent(
  props: JSX.HTMLAttributes<HTMLDivElement> & {
    value: string;
  },
) {
  const tabs = useTabs();
  const rest = omit(props, "class", "value");
  return (
    <Show when={tabs.value() === props.value}>
      <div
        role="tabpanel"
        id={`${tabs.id}-panel-${props.value}`}
        aria-labelledby={`${tabs.id}-tab-${props.value}`}
        tabindex="0"
        class={cn(
          "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          props.class,
        )}
        {...rest}
      />
    </Show>
  );
}

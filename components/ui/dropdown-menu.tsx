import {
  createContext,
  createEffect,
  createSignal,
  omit,
  Show,
  useContext,
} from "solid-js";
import type { JSX } from "@solidjs/web";
import { cn } from "@/lib/utils";
import { invokeHandler } from "./events";
type MenuValue = {
  open: () => boolean;
  setOpen: (open: boolean) => void;
  trigger?: HTMLDivElement;
  content?: HTMLDivElement;
  close: () => void;
};
const MenuContext = createContext<MenuValue>();
function useMenu() {
  const menu = useContext(MenuContext);
  if (!menu)
    throw new Error("Dropdown components must be used within DropdownMenu.");
  return menu;
}
function focusTrigger(menu: MenuValue) {
  (
    menu.trigger?.querySelector<HTMLButtonElement>("button") ?? menu.trigger
  )?.focus();
}
export function DropdownMenu(props: { children: JSX.Element }) {
  const [open, setOpen] = createSignal(false);
  let root: HTMLDivElement | undefined;
  const menu: MenuValue = {
    open,
    setOpen,
    close() {
      setOpen(false);
      focusTrigger(menu);
    },
  };
  createEffect(open, (isOpen) => {
    if (!isOpen) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    queueMicrotask(() => {
      if (open())
        menu.content
          ?.querySelector<HTMLButtonElement>(
            '[role="menuitem"]:not([disabled])',
          )
          ?.focus();
    });
    return () => document.removeEventListener("pointerdown", outside);
  });
  const navigate = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      menu.close();
      return;
    }
    if (!open() || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
      return;
    const items = [
      ...(menu.content?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])',
      ) ?? []),
    ];
    if (!items.length) return;
    event.preventDefault();
    const current = items.findIndex((item) => item === document.activeElement);
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (current + (event.key === "ArrowUp" ? -1 : 1) + items.length) %
            items.length;
    items[index].focus();
  };
  return (
    <MenuContext value={menu}>
      <div ref={root} class="relative inline-block" onKeyDown={navigate}>
        {props.children}
      </div>
    </MenuContext>
  );
}
export function DropdownMenuTrigger(
  props: JSX.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  },
) {
  const menu = useMenu();
  const rest = omit(props, "asChild", "onClick", "onKeyDown", "children");
  return (
    <div
      ref={(element) => {
        menu.trigger = element;
      }}
      role={props.asChild ? undefined : "button"}
      tabindex={props.asChild ? undefined : 0}
      aria-haspopup="menu"
      aria-expanded={menu.open() ? "true" : "false"}
      {...rest}
      onClick={(event) => {
        invokeHandler(props.onClick, event);
        if (!event.defaultPrevented) menu.setOpen(!menu.open());
      }}
      onKeyDown={(event) => {
        invokeHandler(props.onKeyDown, event);
        if (event.defaultPrevented) return;
        if (
          event.key === "ArrowDown" ||
          (!props.asChild && (event.key === "Enter" || event.key === " "))
        ) {
          event.preventDefault();
          menu.setOpen(true);
        }
      }}
    >
      {props.children}
    </div>
  );
}
export function DropdownMenuContent(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const menu = useMenu();
  const [above, setAbove] = createSignal(false);
  createEffect(menu.open, (isOpen) => {
    if (!isOpen) return;
    const position = () => {
      if (!menu.open() || !menu.trigger || !menu.content) return;
      const trigger = menu.trigger.getBoundingClientRect();
      const availableBelow = window.innerHeight - trigger.bottom - 4;
      const availableAbove = trigger.top - 4;
      setAbove(
        menu.content.offsetHeight > availableBelow &&
          availableAbove > availableBelow,
      );
    };
    queueMicrotask(position);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  });
  const rest = omit(props, "class", "role");
  return (
    <Show when={menu.open()}>
      <div
        ref={(element) => {
          menu.content = element;
        }}
        role="menu"
        class={cn(
          "absolute right-0 z-50 min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          above() ? "bottom-full mb-1" : "top-full mt-1",
          props.class,
        )}
        {...rest}
      />
    </Show>
  );
}
export function DropdownMenuItem(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    inset?: boolean;
  },
) {
  const menu = useMenu();
  const rest = omit(props, "class", "inset", "onClick", "role");
  return (
    <button
      type="button"
      role="menuitem"
      class={cn(
        "relative flex w-full select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
        props.inset && "pl-8",
        props.class,
      )}
      {...rest}
      onClick={(event) => {
        invokeHandler(props.onClick, event);
        if (!event.defaultPrevented) menu.close();
      }}
    />
  );
}

import { createSignal, For, Show } from "solid-js";
import { useLocation } from "@tanstack/solid-router";
import { Dynamic } from "@solidjs/web";
import { useAuth, UserButton } from "@/lib/auth-client";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import {
  Clock,
  BarChart3,
  Users,
  Home,
  Menu,
  X,
  Calendar,
  Sparkles,
  KeyRound,
  FileEdit,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrganizationSelector } from "./organization-selector";
import { getClientUserDisplayName, getClientUserEmail } from "@/lib/user-utils";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Time Clock", href: "/dtr", icon: Clock },
  { name: "DTR Adjustments", href: "/dtr/adjustments", icon: FileEdit },
  { name: "Time Tracker", href: "/tracker", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "API Tokens", href: "/tokens", icon: KeyRound },
  { name: "Themes", href: "/themes", icon: Sparkles, adminOnly: true },
  { name: "Admin Panel", href: "/admin", icon: Users, adminOnly: true },
];
export function Sidebar() {
  const [open, setOpen] = createSignal(false);
  const auth = useAuth();
  const organization = useOrganizationContext();
  const location = useLocation();
  const pathname = () => location().pathname;
  const items = () =>
    navigation.filter(
      (item) =>
        !item.adminOnly ||
        organization.currentOrganization?.role === "admin" ||
        organization.loading,
    );
  const content = (close?: () => void) => (
    <div class="flex flex-1 flex-col">
      <div class="flex items-center justify-between border-b border-sidebar-border p-4">
        <div class="flex items-center space-x-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80">
            <Clock class="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 class="text-lg font-semibold text-sidebar-foreground">
            DTR System
          </h1>
        </div>
        <Show when={close}>
          <Button
            variant="ghost"
            size="icon"
            class="text-sidebar-foreground"
            onClick={close}
          >
            <X class="h-5 w-5" />
          </Button>
        </Show>
      </div>
      <OrganizationSelector />
      <nav class="flex-1 space-y-2 px-4 py-6">
        <For each={items()}>
          {(item) => (
            <a
              href={item.href}
              onClick={close}
              class={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                (
                  item.href === "/dtr"
                    ? pathname() === "/dtr"
                    : pathname() === item.href ||
                      pathname().startsWith(`${item.href}/`)
                )
                  ? "border-r-2 border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Dynamic component={item.icon} class="mr-3 h-5 w-5" />
              {item.name}
            </a>
          )}
        </For>
      </nav>
      <div class="border-t border-sidebar-border p-4">
        <div class="flex items-center space-x-3">
          <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
          <Show
            when={auth.loaded}
            fallback={
              <div
                class="min-w-0 flex-1 space-y-2"
                aria-label="Loading account"
              >
                <div class="h-4 w-24 animate-pulse rounded bg-muted" />
                <div class="h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
            }
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-sidebar-foreground">
                {getClientUserDisplayName(auth.user)}
              </p>
              <p class="truncate text-xs text-sidebar-foreground/60">
                {getClientUserEmail(auth.user)}
              </p>
            </div>
          </Show>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
  return (
    <>
      <Show when={open()}>
        <div
          class="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      </Show>
      <div
        class={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-xl transition-transform duration-300 lg:hidden",
          open() ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {content(() => setOpen(false))}
      </div>
      <div class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div class="flex min-h-0 flex-1 flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
          {content()}
        </div>
      </div>
      <div class="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          class="fixed left-4 top-4 z-40 border border-border bg-background/80"
          onClick={() => setOpen(true)}
        >
          <Menu class="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}

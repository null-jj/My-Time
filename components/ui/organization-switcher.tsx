import { createSignal, For, Show } from "solid-js";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Building2, Check } from "@/components/icons";
import { cn } from "@/lib/utils";
export function OrganizationSwitcher(props: {
  class?: string;
  variant?: "default" | "compact";
}) {
  const context = useOrganizationContext();
  const [open, setOpen] = createSignal(false);
  const compact = () => props.variant === "compact";
  return (
    <Show
      when={!context.loading}
      fallback={
        <div class={cn("animate-pulse", props.class)}>
          <div class="h-4 w-24 rounded bg-muted" />
        </div>
      }
    >
      <Show when={context.currentOrganization}>
        {(organization) => (
          <div class={cn("relative", props.class)}>
            <Button
              variant={compact() ? "ghost" : "outline"}
              size={compact() ? "sm" : "default"}
              class={compact() ? "h-8 px-2 text-xs" : "w-full justify-between"}
              onClick={() => setOpen(!open())}
              disabled={context.switching}
            >
              <Building2 class={compact() ? "mr-1 h-3 w-3" : "h-4 w-4"} />
              {context.switching ? "Switching..." : organization().name}
              <ChevronDown class={compact() ? "ml-1 h-3 w-3" : "h-4 w-4"} />
            </Button>
            <Show when={open()}>
              <div
                class={cn(
                  "absolute top-full z-50 mt-1",
                  compact() ? "right-0 min-w-[200px]" : "left-0 right-0",
                )}
              >
                <Card class="shadow-lg">
                  <CardContent class="p-2">
                    <For each={context.organizations}>
                      {(item) => (
                        <Button
                          variant="ghost"
                          class="h-auto w-full justify-start p-2"
                          disabled={context.switching}
                          onClick={() => {
                            context.switchOrganization(item.id);
                            setOpen(false);
                          }}
                        >
                          <Show when={organization().id === item.id}>
                            <Check class="mr-2 h-4 w-4 text-primary" />
                          </Show>
                          <div class="text-left">
                            <div class="font-medium">{item.name}</div>
                            <Badge
                              variant={
                                item.role === "admin" ? "default" : "secondary"
                              }
                              class="text-xs"
                            >
                              {item.role}
                            </Badge>
                          </div>
                        </Button>
                      )}
                    </For>
                  </CardContent>
                </Card>
              </div>
              <div class="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            </Show>
          </div>
        )}
      </Show>
    </Show>
  );
}

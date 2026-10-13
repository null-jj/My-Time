import { createSignal, For, Show } from "solid-js";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, Building2, Plus, Check } from "@/components/icons";
export function OrganizationSelector() {
  const context = useOrganizationContext();
  const [open, setOpen] = createSignal(false);
  const [creating, setCreating] = createSignal(false);
  const [name, setName] = createSignal("");
  const [description, setDescription] = createSignal("");
  const create = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!name().trim()) return;
    await context.createOrganization(name().trim(), description());
    setName("");
    setDescription("");
    setCreating(false);
    setOpen(false);
  };
  return (
    <Show
      when={!context.loading}
      fallback={
        <div class="px-4 py-2">
          <div class="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <div class="relative border-b border-sidebar-border px-4 py-2">
        <Button
          variant="ghost"
          class="h-auto w-full justify-between p-2 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setOpen(!open())}
          disabled={context.switching}
        >
          <div class="flex min-w-0 items-center gap-2">
            <Building2 class="h-4 w-4 shrink-0" />
            <div class="min-w-0 text-left">
              <div class="truncate font-medium">
                {context.switching
                  ? "Switching..."
                  : (context.currentOrganization?.name ??
                    "Select Organization")}
              </div>
              <Show when={context.currentOrganization && !context.switching}>
                <Badge
                  variant={
                    context.currentOrganization?.role === "admin"
                      ? "default"
                      : "secondary"
                  }
                  class="text-xs"
                >
                  {context.currentOrganization?.role}
                </Badge>
              </Show>
            </div>
          </div>
          <ChevronDown class="h-4 w-4 shrink-0" />
        </Button>
        <Show when={open()}>
          <div class="absolute left-4 right-4 top-full z-50 mt-1">
            <Card class="shadow-lg">
              <CardContent class="p-2">
                <For each={context.organizations}>
                  {(organization) => (
                    <Button
                      variant="ghost"
                      class="h-auto w-full justify-start p-2"
                      disabled={context.switching}
                      onClick={() => {
                        context.switchOrganization(organization.id);
                        setOpen(false);
                      }}
                    >
                      <Show
                        when={
                          context.currentOrganization?.id === organization.id
                        }
                      >
                        <Check class="mr-2 h-4 w-4 text-primary" />
                      </Show>
                      <div class="text-left">
                        <div class="font-medium">{organization.name}</div>
                        <Badge
                          variant={
                            organization.role === "admin"
                              ? "default"
                              : "secondary"
                          }
                          class="text-xs"
                        >
                          {organization.role}
                        </Badge>
                      </div>
                    </Button>
                  )}
                </For>
                <hr class="my-1 border-border" />
                <Show
                  when={!creating()}
                  fallback={
                    <form class="space-y-2 p-2" onSubmit={create}>
                      <Input
                        placeholder="Organization Name"
                        value={name()}
                        onInput={(event) => setName(event.currentTarget.value)}
                        required
                      />
                      <Input
                        placeholder="Description"
                        value={description()}
                        onInput={(event) =>
                          setDescription(event.currentTarget.value)
                        }
                      />
                      <div class="flex gap-1">
                        <Button type="submit" size="sm" class="flex-1">
                          Create
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCreating(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  }
                >
                  <Button
                    variant="ghost"
                    class="h-auto w-full justify-start p-2"
                    onClick={() => setCreating(true)}
                  >
                    <Plus class="mr-2 h-4 w-4" />
                    Create Organization
                  </Button>
                </Show>
              </CardContent>
            </Card>
          </div>
          <div class="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        </Show>
      </div>
    </Show>
  );
}

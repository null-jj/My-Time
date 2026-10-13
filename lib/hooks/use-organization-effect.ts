import { createEffect } from "solid-js";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
export function useOrganizationEffect(callback: () => void | Promise<void>) {
  const context = useOrganizationContext();
  let previousId: string | undefined;
  createEffect(
    () => context.currentOrganization?.id,
    (id) => {
      if (id && id !== previousId) void callback();
      previousId = id;
    },
  );
}

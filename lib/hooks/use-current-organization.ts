import { createMemo } from "solid-js";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
export function useCurrentOrganizationId() {
  const context = useOrganizationContext();
  return createMemo(() => context.currentOrganization?.id);
}

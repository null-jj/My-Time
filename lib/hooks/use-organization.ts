import { createEffect, createSignal } from "solid-js";
import { useAuth } from "@/lib/auth-client";
import type { OrganizationWithRole } from "@/lib/organizations";
export function useOrganization(orgId?: string) {
  const auth = useAuth();
  const [organizations, setOrganizations] = createSignal<
    OrganizationWithRole[]
  >([]);
  const [organization, setOrganization] =
    createSignal<OrganizationWithRole | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const refresh = async () => {
    if (!auth.user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/organizations", {
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload))
        throw new Error("Organizations response is invalid.");
      const items = payload.filter((item): item is OrganizationWithRole =>
        Boolean(item && typeof item === "object"),
      );
      setOrganizations(items);
      setOrganization(
        items.find((item) => item.id === orgId) ?? items[0] ?? null,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Failed to fetch organizations",
      );
    } finally {
      setLoading(false);
    }
  };
  createEffect(
    () => `${auth.user?.id ?? ""}:${orgId ?? ""}`,
    () => void refresh(),
  );
  const switchOrganization = (id: string) =>
    setOrganization(organizations().find((item) => item.id === id) ?? null);
  return {
    get organization() {
      return organization();
    },
    get organizations() {
      return organizations();
    },
    get membership() {
      const current = organization();
      return current ? { role: current.role } : null;
    },
    get loading() {
      return loading();
    },
    get error() {
      return error();
    },
    switchOrganization,
    refresh,
  };
}

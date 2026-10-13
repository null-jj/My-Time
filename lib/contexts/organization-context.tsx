import {
  createContext,
  createEffect,
  createSignal,
  useContext,
  untrack,
  onCleanup,
} from "solid-js";
import type { JSX } from "@solidjs/web";
import { useAuth } from "@/lib/auth-client";
import type { OrganizationWithRole } from "@/lib/organizations";
type OrganizationContextValue = {
  readonly currentOrganization: OrganizationWithRole | null;
  readonly organizations: OrganizationWithRole[];
  readonly loading: boolean;
  readonly switching: boolean;
  readonly error: string | null;
  switchOrganization: (orgId: string) => void;
  createOrganization: (
    name: string,
    description?: string,
  ) => Promise<OrganizationWithRole>;
  joinOrganization: (orgId: string) => Promise<void>;
  leaveOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
};
const OrganizationContext = createContext<OrganizationContextValue>();
function isOrganization(value: unknown): value is OrganizationWithRole {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string" &&
    (item.role === "admin" || item.role === "member") &&
    (item.description === undefined ||
      item.description === null ||
      typeof item.description === "string")
  );
}
async function organizationsFrom(response: Response) {
  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload.every(isOrganization))
    throw new Error("Organizations response is invalid.");
  return payload;
}
function saveSelection(orgId: string | null) {
  if (orgId) localStorage.setItem("selected-org-id", orgId);
  else localStorage.removeItem("selected-org-id");
  document.cookie = `selected-org-id=${orgId ? encodeURIComponent(orgId) : ""}; path=/; max-age=${orgId ? 60 * 60 * 24 * 30 : 0}; SameSite=Lax`;
}
export function OrganizationProvider(props: {
  children: JSX.Element;
  initialData?: {
    userId: string | null;
    orgId: string | null;
    organizations: OrganizationWithRole[];
  };
}) {
  const auth = useAuth();
  const initial = untrack(() => props.initialData);
  let loadedForUser = initial?.userId ?? null;
  let membershipGeneration = 0;
  let disposed = false;
  onCleanup(() => {
    disposed = true;
    membershipGeneration++;
  });
  const [organizations, setOrganizations] = createSignal<
    OrganizationWithRole[]
  >(initial?.organizations ?? []);
  const [currentOrganization, setCurrentOrganization] =
    createSignal<OrganizationWithRole | null>(
      initial?.organizations.find(
        (organization) => organization.id === initial.orgId,
      ) ?? null,
    );
  const [loading, setLoading] = createSignal(!initial);
  const [switching, setSwitching] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const fetchOrganizations = async () => {
    const generation = ++membershipGeneration;
    const userId = loadedForUser;
    const isCurrent = () =>
      !disposed &&
      generation === membershipGeneration &&
      userId === loadedForUser;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/organizations", {
        credentials: "include",
      });
      if (!response.ok)
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      const nextOrganizations = await organizationsFrom(response);
      if (!isCurrent()) return;
      setOrganizations(nextOrganizations);
      const savedId = document.cookie
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("selected-org-id="))
        ?.slice("selected-org-id=".length);
      const selected =
        nextOrganizations.find((organization) => organization.id === savedId) ??
        nextOrganizations[0] ??
        null;
      setCurrentOrganization(selected);
      if (selected) saveSelection(selected.id);
    } catch (reason) {
      if (!isCurrent()) return;
      setError(
        reason instanceof Error
          ? reason.message
          : "Failed to fetch organizations",
      );
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };
  createEffect(
    () => ({ loaded: auth.loaded, userId: auth.user?.id }),
    ({ loaded, userId }) => {
      if (!loaded) return;
      if (!userId) {
        membershipGeneration++;
        loadedForUser = null;
        setOrganizations([]);
        setCurrentOrganization(null);
        setLoading(false);
        return;
      }
      if (loadedForUser === userId) return;
      setOrganizations([]);
      setCurrentOrganization(null);
      loadedForUser = userId;
      void fetchOrganizations();
    },
  );
  const switchOrganization = (orgId: string) => {
    const next = organizations().find(
      (organization) => organization.id === orgId,
    );
    if (!next) return;
    setSwitching(true);
    setCurrentOrganization(next);
    saveSelection(orgId);
    window.location.reload();
  };
  const createOrganization = async (name: string, description?: string) => {
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "create", name, description }),
    });
    if (!response.ok)
      throw new Error(`Failed to create organization: ${response.status}`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object")
      throw new Error("Created organization response is invalid.");
    const organization = { ...payload, role: "admin" };
    if (!isOrganization(organization))
      throw new Error("Created organization response is invalid.");
    setOrganizations((current) => [...current, organization]);
    setCurrentOrganization(organization);
    saveSelection(organization.id);
    return organization;
  };
  const joinOrganization = async (orgId: string) => {
    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "join", orgId }),
    });
    if (!response.ok)
      throw new Error(`Failed to join organization: ${response.status}`);
    await fetchOrganizations();
  };
  const leaveOrganization = async (orgId: string) => {
    const response = await fetch(`/api/organizations/${orgId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "leave" }),
    });
    if (!response.ok)
      throw new Error(`Failed to leave organization: ${response.status}`);
    const wasSelected = currentOrganization()?.id === orgId;
    const remaining = organizations().filter(
      (organization) => organization.id !== orgId,
    );
    setOrganizations(remaining);
    if (wasSelected) {
      const next = remaining[0] ?? null;
      setCurrentOrganization(next);
      saveSelection(next?.id ?? null);
      window.location.reload();
    }
  };
  return (
    <OrganizationContext
      value={{
        get currentOrganization() {
          return currentOrganization();
        },
        get organizations() {
          return organizations();
        },
        get loading() {
          return loading();
        },
        get switching() {
          return switching();
        },
        get error() {
          return error();
        },
        switchOrganization,
        createOrganization,
        joinOrganization,
        leaveOrganization,
        refreshOrganizations: fetchOrganizations,
      }}
    >
      {props.children}
    </OrganizationContext>
  );
}
export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context)
    throw new Error(
      "useOrganizationContext must be used within an OrganizationProvider.",
    );
  return context;
}
export function useCurrentOrganization() {
  const context = useOrganizationContext();
  return () => context.currentOrganization;
}
export function useOrganizations() {
  const context = useOrganizationContext();
  return {
    get organizations() {
      return context.organizations;
    },
    get loading() {
      return context.loading;
    },
    get error() {
      return context.error;
    },
  };
}

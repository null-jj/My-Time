import { createClerkClient, type ClerkClient } from "@clerk/backend";
import { getUserOrganizations } from "@/lib/organizations";
import { AsyncLocalStorage } from "node:async_hooks";
let clerkClient: ClerkClient | undefined;
type Authentication = Awaited<ReturnType<ClerkClient["authenticateRequest"]>>;
const requestAuth = new AsyncLocalStorage<{
  request: Request;
  authentication: Authentication | null;
}>();
function getCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  for (const value of cookie.split(";")) {
    const [key, ...rest] = value.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
export function getClerkClient(): ClerkClient | null {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  clerkClient ??= createClerkClient({
    secretKey,
    publishableKey:
      process.env.CLERK_PUBLISHABLE_KEY ??
      process.env.VITE_CLERK_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    jwtKey: process.env.CLERK_JWT_KEY,
  });
  return clerkClient;
}
export async function withRequestAuth(
  request: Request,
  next: () => Promise<Response>,
): Promise<Response> {
  if (new URL(request.url).pathname.startsWith("/api/cli/")) return next();
  const clerk = getClerkClient();
  const authentication = clerk
    ? await clerk.authenticateRequest(request)
    : null;
  if (authentication?.status === "handshake") {
    return new Response(null, { status: 307, headers: authentication.headers });
  }
  return requestAuth.run({ request, authentication }, async () => {
    const response = await next();
    if (!authentication) return response;
    const headers = new Headers(response.headers);
    authentication.headers.forEach((value, name) => {
      if (name !== "set-cookie") headers.set(name, value);
    });
    for (const cookie of authentication.headers.getSetCookie())
      headers.append("set-cookie", cookie);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  });
}
export async function auth(request: Request) {
  const clerk = getClerkClient();
  if (!clerk) return { userId: null, orgId: null, orgRole: null };
  const context = requestAuth.getStore();
  const requestState =
    context?.request === request
      ? context.authentication
      : await clerk.authenticateRequest(request);
  if (!requestState?.isAuthenticated) {
    return { userId: null, orgId: null, orgRole: null };
  }
  const { userId } = requestState.toAuth();
  if (!userId) {
    return { userId: null, orgId: null, orgRole: null };
  }
  // Get selected organization from cookie or use default
  const selectedOrgId = getCookie(request, "selected-org-id");
  // Organization access and roles come from our database, never client claims.
  const userOrgs = await getUserOrganizations(userId);
  let currentOrg;
  if (selectedOrgId) {
    currentOrg = userOrgs.find((org) => org.id === selectedOrgId);
  }
  // If no selected org or invalid org, use first available
  if (!currentOrg && userOrgs.length > 0) {
    currentOrg = userOrgs[0];
  }
  return {
    userId,
    orgId: currentOrg?.id || null,
    orgRole: currentOrg?.role || null,
  };
}

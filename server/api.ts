import { admin, calendar, tracker } from "@/server/routes/dashboard";
import { dtr } from "@/server/routes/dtr";
import { cliClockIn, cliClockOut, cliStatus } from "@/server/routes/cli";
import { dtrExport } from "@/server/routes/export";
import {
  invitation,
  organization,
  organizationInvite,
  organizationMembers,
  organizations,
} from "@/server/routes/organizations";
import {
  adminTimeChangeRequests,
  timeChangeRequests,
  timeHistory,
} from "@/server/routes/time";
import { tokens } from "@/server/routes/tokens";

function methodNotAllowed(): Response {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

function hasMethod(request: Request, methods: readonly string[]): boolean {
  return methods.includes(request.method);
}

export async function dispatchApiRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === "/dtr/api")
    return hasMethod(request, ["GET", "POST", "PATCH"])
      ? dtr(request)
      : methodNotAllowed();
  if (pathname === "/calendar/api")
    return hasMethod(request, ["GET"]) ? calendar(request) : methodNotAllowed();
  if (pathname === "/tracker/api")
    return hasMethod(request, ["GET"]) ? tracker(request) : methodNotAllowed();
  if (pathname === "/admin/api")
    return hasMethod(request, ["GET", "POST"])
      ? admin(request)
      : methodNotAllowed();
  if (pathname === "/api/admin/dtr-export")
    return hasMethod(request, ["POST"])
      ? dtrExport(request)
      : methodNotAllowed();
  if (pathname === "/api/admin/time-change-requests")
    return hasMethod(request, ["GET"])
      ? adminTimeChangeRequests(request)
      : methodNotAllowed();
  if (pathname === "/api/time-change-requests")
    return hasMethod(request, ["GET", "POST"])
      ? timeChangeRequests(request)
      : methodNotAllowed();
  if (pathname === "/api/time-entries/history")
    return hasMethod(request, ["GET"])
      ? timeHistory(request)
      : methodNotAllowed();
  if (pathname === "/api/tokens")
    return hasMethod(request, ["GET", "POST", "DELETE"])
      ? tokens(request)
      : methodNotAllowed();
  if (pathname === "/api/cli/clock-in")
    return hasMethod(request, ["POST"])
      ? cliClockIn(request)
      : methodNotAllowed();
  if (pathname === "/api/cli/clock-out")
    return hasMethod(request, ["POST"])
      ? cliClockOut(request)
      : methodNotAllowed();
  if (pathname === "/api/cli/status")
    return hasMethod(request, ["GET"])
      ? cliStatus(request)
      : methodNotAllowed();

  const timeChangeMatch = /^\/api\/admin\/time-change-requests\/([^/]+)$/.exec(
    pathname,
  );
  if (timeChangeMatch)
    return hasMethod(request, ["PATCH"])
      ? adminTimeChangeRequests(request, timeChangeMatch[1])
      : methodNotAllowed();
  const inviteMatch = /^\/api\/invite\/([^/]+)$/.exec(pathname);
  if (inviteMatch)
    return hasMethod(request, ["POST"])
      ? invitation(request, inviteMatch[1])
      : methodNotAllowed();
  const membersMatch = /^\/api\/organizations\/([^/]+)\/members$/.exec(
    pathname,
  );
  if (membersMatch)
    return hasMethod(request, ["GET"])
      ? organizationMembers(request, membersMatch[1])
      : methodNotAllowed();
  const orgInviteMatch = /^\/api\/organizations\/([^/]+)\/invite$/.exec(
    pathname,
  );
  if (orgInviteMatch)
    return hasMethod(request, ["POST"])
      ? organizationInvite(request, orgInviteMatch[1])
      : methodNotAllowed();
  const orgMatch = /^\/api\/organizations\/([^/]+)$/.exec(pathname);
  if (orgMatch)
    return hasMethod(request, ["GET", "PATCH", "DELETE"])
      ? organization(request, orgMatch[1])
      : methodNotAllowed();
  if (pathname === "/api/organizations")
    return hasMethod(request, ["GET", "POST"])
      ? organizations(request)
      : methodNotAllowed();

  return Response.json({ error: "Not found" }, { status: 404 });
}

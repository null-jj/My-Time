import { validateApiToken } from "@/lib/api-tokens";
import {
  clockIn,
  clockOut,
  getActiveTimeEntry,
  getTodayTimeEntries,
  isUserClockedIn,
} from "@/lib/time-entries";

type CliAuth =
  | { kind: "missing-header" }
  | { kind: "invalid-token" }
  | { kind: "authenticated"; userId: string; orgId: string };

async function cliAuth(request: Request): Promise<CliAuth> {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer "))
    return { kind: "missing-header" };
  const token = await validateApiToken(header.slice(7));
  return token
    ? { kind: "authenticated", ...token }
    : { kind: "invalid-token" };
}

function cliAuthError(auth: CliAuth): Response | null {
  if (auth.kind === "missing-header")
    return Response.json(
      { error: "Missing or invalid authorization header" },
      { status: 401 },
    );
  if (auth.kind === "invalid-token")
    return Response.json(
      { error: "Invalid or expired token" },
      { status: 401 },
    );
  return null;
}

function isCliAuthenticated(
  auth: CliAuth,
): auth is Extract<CliAuth, { kind: "authenticated" }> {
  return auth.kind === "authenticated";
}

export async function cliClockIn(request: Request): Promise<Response> {
  try {
    const token = await cliAuth(request);
    const error = cliAuthError(token);
    if (error) return error;
    if (!isCliAuthenticated(token))
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    if (await isUserClockedIn(token.userId, token.orgId))
      return Response.json(
        { error: "You are already clocked in. Please clock out first." },
        { status: 400 },
      );
    const entry = await clockIn(token.userId, token.orgId);
    return Response.json({
      success: true,
      entry,
      message: "Successfully clocked in",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to clock in" },
      { status: 500 },
    );
  }
}

export async function cliClockOut(request: Request): Promise<Response> {
  try {
    const token = await cliAuth(request);
    const error = cliAuthError(token);
    if (error) return error;
    if (!isCliAuthenticated(token))
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    const { note } = await request.json();
    if (!note || note.trim() === "")
      return Response.json(
        { error: "Note is required when clocking out" },
        { status: 400 },
      );
    if (!(await isUserClockedIn(token.userId, token.orgId)))
      return Response.json(
        { error: "You are not clocked in. Please clock in first." },
        { status: 400 },
      );
    const entry = await clockOut(token.userId, token.orgId, note);
    return Response.json({
      success: true,
      entry,
      message: "Successfully clocked out",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to clock out" },
      { status: 500 },
    );
  }
}

export async function cliStatus(request: Request): Promise<Response> {
  try {
    const token = await cliAuth(request);
    const error = cliAuthError(token);
    if (error) return error;
    if (!isCliAuthenticated(token))
      return Response.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    const [activeEntry, todayEntries, isClockedIn] = await Promise.all([
      getActiveTimeEntry(token.userId, token.orgId),
      getTodayTimeEntries(token.userId, token.orgId),
      isUserClockedIn(token.userId, token.orgId),
    ]);
    return Response.json({ activeEntry, todayEntries, isClockedIn });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

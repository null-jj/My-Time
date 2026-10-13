import { auth } from "@/lib/auth";
import { getTimeEntriesForRange } from "@/lib/time-entries";
import {
  createChangeRequest,
  getChangeRequestsForUser,
  getPendingRequestsForOrg,
  reviewChangeRequest,
} from "@/lib/time-change-requests";

export async function timeHistory(request: Request): Promise<Response> {
  const { userId, orgId } = await auth(request);
  if (!userId || !orgId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(
    parseInt(new URL(request.url).searchParams.get("days") || "30", 10),
    90,
  );
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  try {
    const entries = await getTimeEntriesForRange(
      userId,
      orgId,
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0],
    );
    return Response.json({ entries });
  } catch {
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function timeChangeRequests(request: Request): Promise<Response> {
  const { userId, orgId } = await auth(request);
  if (!userId || !orgId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (request.method === "GET")
      return Response.json({
        requests: await getChangeRequestsForUser(userId, orgId),
      });
    const {
      timeEntryId,
      requestedTimeIn,
      requestedTimeOut,
      requestedNote,
      reason,
    } = await request.json();
    if (!timeEntryId || typeof timeEntryId !== "number")
      return Response.json(
        { error: "Valid timeEntryId is required" },
        { status: 400 },
      );
    if (!reason || typeof reason !== "string" || reason.trim().length === 0)
      return Response.json({ error: "Reason is required" }, { status: 400 });
    if (reason.trim().length > 500)
      return Response.json(
        { error: "Reason must be 500 characters or less" },
        { status: 400 },
      );
    const changeRequest = await createChangeRequest(
      userId,
      orgId,
      timeEntryId,
      {
        requestedTimeIn: requestedTimeIn || undefined,
        requestedTimeOut: requestedTimeOut || undefined,
        requestedNote: requestedNote || undefined,
        reason: reason.trim(),
      },
    );
    return Response.json({ success: true, request: changeRequest });
  } catch (error) {
    if (request.method === "GET")
      return Response.json(
        { error: "Failed to fetch change requests" },
        { status: 500 },
      );
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create change request",
      },
      { status: 400 },
    );
  }
}

export async function adminTimeChangeRequests(
  request: Request,
  id?: string,
): Promise<Response> {
  const { userId, orgId, orgRole } = await auth(request);
  if (!userId || !orgId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (orgRole !== "admin")
    return Response.json({ error: "Admin access required" }, { status: 403 });
  try {
    if (!id)
      return Response.json({ requests: await getPendingRequestsForOrg(orgId) });
    const requestId = parseInt(id, 10);
    if (Number.isNaN(requestId))
      return Response.json({ error: "Invalid request ID" }, { status: 400 });
    const { action, reviewNote } = await request.json();
    if (action !== "approved" && action !== "rejected")
      return Response.json(
        { error: 'Action must be "approved" or "rejected"' },
        { status: 400 },
      );
    if (reviewNote && typeof reviewNote === "string" && reviewNote.length > 500)
      return Response.json(
        { error: "Review note must be 500 characters or less" },
        { status: 400 },
      );
    return Response.json({
      success: true,
      request: await reviewChangeRequest(
        requestId,
        userId,
        orgId,
        action,
        reviewNote,
      ),
    });
  } catch (error) {
    return Response.json(
      {
        error: id
          ? error instanceof Error
            ? error.message
            : "Failed to process request"
          : "Failed to fetch change requests",
      },
      { status: id ? 400 : 500 },
    );
  }
}

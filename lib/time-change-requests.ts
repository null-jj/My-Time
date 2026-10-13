import { db } from "@/lib/db/config";
import { timeChangeRequests, timeEntries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type {
  TimeChangeRequest,
  TimeChangeRequestWithEntry,
} from "./time-change-request-types";
import { getDateFromDateTime } from "./time-entries-date";
export async function createChangeRequest(
  userId: string,
  orgId: string,
  timeEntryId: number,
  data: {
    requestedTimeIn?: string;
    requestedTimeOut?: string;
    requestedNote?: string;
    reason: string;
  },
): Promise<TimeChangeRequest> {
  // Verify the time entry belongs to this user and org
  const entry = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.id, timeEntryId),
        eq(timeEntries.userId, userId),
        eq(timeEntries.orgId, orgId),
      ),
    )
    .limit(1);
  if (entry.length === 0) {
    throw new Error("Time entry not found");
  }
  // Must request at least one change
  if (!data.requestedTimeIn && !data.requestedTimeOut && !data.requestedNote) {
    throw new Error("At least one change must be requested");
  }
  // Validate time order if both times provided
  if (data.requestedTimeIn && data.requestedTimeOut) {
    if (new Date(data.requestedTimeIn) >= new Date(data.requestedTimeOut)) {
      throw new Error("Requested time in must be before time out");
    }
  }
  const now = new Date().toISOString();
  const [request] = await db
    .insert(timeChangeRequests)
    .values({
      timeEntryId,
      userId,
      orgId,
      requestedTimeIn: data.requestedTimeIn || null,
      requestedTimeOut: data.requestedTimeOut || null,
      requestedNote: data.requestedNote || null,
      reason: data.reason,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return request as TimeChangeRequest;
}
export async function getChangeRequestsForUser(
  userId: string,
  orgId: string,
): Promise<TimeChangeRequestWithEntry[]> {
  const requests = await db
    .select({
      id: timeChangeRequests.id,
      timeEntryId: timeChangeRequests.timeEntryId,
      userId: timeChangeRequests.userId,
      orgId: timeChangeRequests.orgId,
      requestedTimeIn: timeChangeRequests.requestedTimeIn,
      requestedTimeOut: timeChangeRequests.requestedTimeOut,
      requestedNote: timeChangeRequests.requestedNote,
      reason: timeChangeRequests.reason,
      status: timeChangeRequests.status,
      reviewedBy: timeChangeRequests.reviewedBy,
      reviewedAt: timeChangeRequests.reviewedAt,
      reviewNote: timeChangeRequests.reviewNote,
      createdAt: timeChangeRequests.createdAt,
      updatedAt: timeChangeRequests.updatedAt,
      originalTimeIn: timeEntries.timeIn,
      originalTimeOut: timeEntries.timeOut,
      originalNote: timeEntries.note,
      originalDate: timeEntries.date,
    })
    .from(timeChangeRequests)
    .innerJoin(timeEntries, eq(timeChangeRequests.timeEntryId, timeEntries.id))
    .where(
      and(
        eq(timeChangeRequests.userId, userId),
        eq(timeChangeRequests.orgId, orgId),
      ),
    )
    .orderBy(desc(timeChangeRequests.createdAt));
  return requests as TimeChangeRequestWithEntry[];
}
export async function getPendingRequestsForOrg(
  orgId: string,
): Promise<TimeChangeRequestWithEntry[]> {
  const requests = await db
    .select({
      id: timeChangeRequests.id,
      timeEntryId: timeChangeRequests.timeEntryId,
      userId: timeChangeRequests.userId,
      orgId: timeChangeRequests.orgId,
      requestedTimeIn: timeChangeRequests.requestedTimeIn,
      requestedTimeOut: timeChangeRequests.requestedTimeOut,
      requestedNote: timeChangeRequests.requestedNote,
      reason: timeChangeRequests.reason,
      status: timeChangeRequests.status,
      reviewedBy: timeChangeRequests.reviewedBy,
      reviewedAt: timeChangeRequests.reviewedAt,
      reviewNote: timeChangeRequests.reviewNote,
      createdAt: timeChangeRequests.createdAt,
      updatedAt: timeChangeRequests.updatedAt,
      originalTimeIn: timeEntries.timeIn,
      originalTimeOut: timeEntries.timeOut,
      originalNote: timeEntries.note,
      originalDate: timeEntries.date,
    })
    .from(timeChangeRequests)
    .innerJoin(timeEntries, eq(timeChangeRequests.timeEntryId, timeEntries.id))
    .where(eq(timeChangeRequests.orgId, orgId))
    .orderBy(desc(timeChangeRequests.createdAt));
  return requests as TimeChangeRequestWithEntry[];
}
export async function reviewChangeRequest(
  requestId: number,
  adminUserId: string,
  orgId: string,
  action: "approved" | "rejected",
  reviewNote?: string,
): Promise<TimeChangeRequest> {
  return await db.transaction(async (tx) => {
    // Fetch the request
    const [request] = await tx
      .select()
      .from(timeChangeRequests)
      .where(
        and(
          eq(timeChangeRequests.id, requestId),
          eq(timeChangeRequests.orgId, orgId),
          eq(timeChangeRequests.status, "pending"),
        ),
      )
      .limit(1);
    if (!request) {
      throw new Error("Pending request not found");
    }
    const now = new Date().toISOString();
    // If approved, update the time entry
    if (action === "approved") {
      const updates: Record<string, string> = { updatedAt: now };
      if (request.requestedTimeIn) {
        updates.timeIn = request.requestedTimeIn;
        updates.date = getDateFromDateTime(request.requestedTimeIn);
      }
      if (request.requestedTimeOut) updates.timeOut = request.requestedTimeOut;
      if (request.requestedNote) updates.note = request.requestedNote;
      await tx
        .update(timeEntries)
        .set(updates)
        .where(eq(timeEntries.id, request.timeEntryId));
    }
    // Update the request status
    const [updated] = await tx
      .update(timeChangeRequests)
      .set({
        status: action,
        reviewedBy: adminUserId,
        reviewedAt: now,
        reviewNote: reviewNote || null,
        updatedAt: now,
      })
      .where(eq(timeChangeRequests.id, requestId))
      .returning();
    return updated as TimeChangeRequest;
  });
}

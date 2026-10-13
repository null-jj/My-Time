import { auth } from "@/lib/auth";
import { db } from "@/lib/db/config";
import { timeEntries, userOrganizations } from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export async function dtrExport(request: Request): Promise<Response> {
  try {
    const { userId, orgId } = await auth(request);
    if (!userId || !orgId)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    const membership = await db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.orgId, orgId),
        ),
      )
      .limit(1);
    if (!membership.length || membership[0].role !== "admin")
      return Response.json({ error: "Admin access required" }, { status: 403 });
    const {
      startDate,
      endDate,
      userId: requestedUserId,
    } = await request.json();
    if (!startDate || !endDate)
      return Response.json(
        { error: "Start and end dates are required" },
        { status: 400 },
      );
    const date = /^\d{4}-\d{2}-\d{2}$/;
    if (
      !date.test(startDate) ||
      !date.test(endDate) ||
      Number.isNaN(new Date(startDate).getTime()) ||
      Number.isNaN(new Date(endDate).getTime())
    )
      return Response.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 },
      );
    const conditions = [
      eq(timeEntries.orgId, orgId),
      gte(timeEntries.date, startDate),
      lte(timeEntries.date, endDate),
    ];
    if (requestedUserId)
      conditions.push(eq(timeEntries.userId, requestedUserId));
    const entries = await db
      .select()
      .from(timeEntries)
      .where(and(...conditions))
      .orderBy(timeEntries.date, timeEntries.timeIn);
    const grouped: Record<
      string,
      Array<(typeof entries)[number] & { duration?: number }>
    > = {};
    for (const entry of entries) {
      grouped[entry.userId] ??= [];
      const duration = entry.timeOut
        ? Math.max(
            0,
            Math.round(
              (new Date(entry.timeOut).getTime() -
                new Date(entry.timeIn).getTime()) /
                60000,
            ),
          )
        : undefined;
      grouped[entry.userId].push({ ...entry, duration });
    }
    return Response.json(grouped);
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

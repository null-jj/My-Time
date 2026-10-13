import { auth, getClerkClient } from "@/lib/auth";
import { db } from "@/lib/db/config";
import { timeEntries } from "@/lib/db/schema";
import {
  getOrganizationMembers,
  removeUserFromOrganization,
  updateUserRole,
} from "@/lib/organizations";
import {
  getUserDisplayName,
  getUserEmail,
  getUserImageUrl,
} from "@/lib/user-utils";
import { and, eq, gte, lte } from "drizzle-orm";

function pastSevenDays(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    return day.toISOString().slice(0, 10);
  });
}

export async function tracker(request: Request): Promise<Response> {
  const { userId, orgId } = await auth(request);
  if (!userId || !orgId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const days = pastSevenDays();
    const records = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          eq(timeEntries.orgId, orgId),
          gte(timeEntries.date, days[days.length - 1]),
        ),
      )
      .orderBy(timeEntries.date, timeEntries.timeIn);
    return Response.json(
      records.map((record) => ({
        ...record,
        duration: record.timeOut
          ? Math.round(
              (new Date(record.timeOut).getTime() -
                new Date(record.timeIn).getTime()) /
                60000,
            )
          : undefined,
        isActive: !record.timeOut,
      })),
    );
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function calendar(request: Request): Promise<Response> {
  const { userId, orgId } = await auth(request);
  if (!userId || !orgId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const month = new URL(request.url).searchParams.get("month");
    if (!month)
      return Response.json(
        { error: "Month parameter is required" },
        { status: 400 },
      );
    const startDate = `${month}-01`;
    const endDate = new Date(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth() + 1,
      0,
    )
      .toISOString()
      .slice(0, 10);
    const records = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          eq(timeEntries.orgId, orgId),
          gte(timeEntries.date, startDate),
          lte(timeEntries.date, endDate),
        ),
      )
      .orderBy(timeEntries.date, timeEntries.timeIn);
    const grouped: Record<
      string,
      {
        date: string;
        timeIn: string;
        timeOut?: string;
        note?: string;
        duration: number;
        entries: typeof records;
      }
    > = {};
    for (const record of records) {
      grouped[record.date] ??= {
        date: record.date,
        timeIn: record.timeIn,
        timeOut: record.timeOut || undefined,
        note: record.note || undefined,
        duration: 0,
        entries: [],
      };
      grouped[record.date].entries.push(record);
      if (record.timeOut)
        grouped[record.date].duration +=
          (new Date(record.timeOut).getTime() -
            new Date(record.timeIn).getTime()) /
          3_600_000;
    }
    return Response.json(
      Object.values(grouped).map((record) => ({
        ...record,
        duration: record.duration > 0 ? record.duration.toFixed(1) : null,
      })),
    );
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function admin(request: Request): Promise<Response> {
  const { userId, orgId, orgRole } = await auth(request);
  if (!userId || !orgId || orgRole !== "admin")
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (request.method === "POST") {
      const { action, targetUserId, role } = await request.json();
      if (action === "remove" && targetUserId) {
        await removeUserFromOrganization(targetUserId, orgId);
        return Response.json({ success: true });
      }
      if (action === "role" && targetUserId && role) {
        await updateUserRole(targetUserId, orgId, role);
        return Response.json({ success: true });
      }
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const clerk = getClerkClient();
    if (!clerk)
      return Response.json({ error: "Internal server error" }, { status: 500 });
    if (new URL(request.url).searchParams.get("members") === "1") {
      const members = await getOrganizationMembers(orgId);
      const users = await clerk.users.getUserList({
        userId: members.map((member) => member.userId),
      });
      const userMap = new Map(users.data.map((user) => [user.id, user]));
      return Response.json(
        members.map((member) => {
          const user = userMap.get(member.userId);
          return {
            userId: member.userId,
            name: getUserDisplayName(user),
            email: getUserEmail(user),
            role: member.role,
            joinedAt: member.joinedAt,
            imageUrl: getUserImageUrl(user),
          };
        }),
      );
    }
    const days = pastSevenDays();
    const records = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.orgId, orgId),
          gte(timeEntries.date, days[days.length - 1]),
        ),
      )
      .orderBy(timeEntries.date, timeEntries.timeIn);
    const users = await clerk.users.getUserList({
      userId: Array.from(new Set(records.map((record) => record.userId))),
    });
    const names = new Map(
      users.data.map((user) => [user.id, getUserDisplayName(user)]),
    );
    return Response.json(
      records.map((record) => ({
        ...record,
        userName: names.get(record.userId) || record.userId,
        duration: record.timeOut
          ? Math.round(
              (new Date(record.timeOut).getTime() -
                new Date(record.timeIn).getTime()) /
                60000,
            )
          : 0,
      })),
    );
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

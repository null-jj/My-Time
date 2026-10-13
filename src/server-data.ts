import { createServerFn } from "@tanstack/solid-start";
import { getRequest } from "@tanstack/solid-start/server";
import { redirect } from "@tanstack/solid-router";
async function requireSession() {
  const { auth } = await import("@/lib/auth");
  const session = await auth(getRequest());
  if (!session.userId) throw redirect({ href: "/sign-in" });
  return { ...session, userId: session.userId };
}
async function requireOrganization(requireAdmin = false) {
  const session = await requireSession();
  if (!session.orgId) throw redirect({ href: "/welcome" });
  if (requireAdmin && session.orgRole !== "admin")
    throw redirect({ href: "/dashboard" });
  return { ...session, orgId: session.orgId };
}

export const getSession = createServerFn({ method: "GET" }).handler(() =>
  requireSession(),
);
export const getPublicSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { auth } = await import("@/lib/auth");
    return auth(getRequest());
  },
);
export const getLayoutData = createServerFn({ method: "GET" }).handler(
  async () => {
    const { auth } = await import("@/lib/auth");
    const { getUserOrganizations } = await import("@/lib/organizations");
    const session = await auth(getRequest());
    const organizations = session.userId
      ? await getUserOrganizations(session.userId)
      : [];
    return { userId: session.userId, orgId: session.orgId, organizations };
  },
);
export const getDtrData = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireOrganization();
    const { getTodayTimeEntries } = await import("@/lib/time-entries");
    const todayEntries = await getTodayTimeEntries(
      session.userId,
      session.orgId,
    );
    const activeEntry = todayEntries.find((entry) => !entry.timeOut) ?? null;
    return { activeEntry, todayEntries, isClockedIn: activeEntry !== null };
  },
);
export const getDashboardData = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireOrganization();
    const { getClerkClient } = await import("@/lib/auth");
    const { getActiveTimeEntry, getTodayTimeEntries, getTimeEntriesForRange } =
      await import("@/lib/time-entries");
    const { getTodayDate } = await import("@/lib/time-entries-date");
    const { calculateTotalDuration, formatDuration } =
      await import("@/lib/time-entries-format");
    const { getUserDisplayName } = await import("@/lib/user-utils");
    const today = getTodayDate();
    const monthStart = `${today.slice(0, 7)}-01`;
    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - 7);
    const weekStart = weekStartDate.toISOString().slice(0, 10);
    const [todayEntries, activeEntry, records, user] = await Promise.all([
      getTodayTimeEntries(session.userId, session.orgId),
      getActiveTimeEntry(session.userId, session.orgId),
      getTimeEntriesForRange(
        session.userId,
        session.orgId,
        monthStart < weekStart ? monthStart : weekStart,
        today,
      ),
      getClerkClient()?.users.getUser(session.userId),
    ]);
    const activeMinutes = activeEntry
      ? Math.max(
          0,
          Math.round((Date.now() - Date.parse(activeEntry.timeIn)) / 60000),
        )
      : 0;
    return {
      userName: getUserDisplayName(user),
      activeEntry: activeEntry ? { ...activeEntry, isActive: true } : null,
      todayEntries,
      isClockedIn: activeEntry !== null,
      recentRecords: records.filter((entry) => entry.date >= weekStart),
      stats: {
        todayHours: formatDuration(
          calculateTotalDuration(todayEntries) + activeMinutes,
        ),
        weekHours: formatDuration(
          calculateTotalDuration(
            records.filter((entry) => entry.date >= weekStart),
          ),
        ),
        monthHours: formatDuration(
          calculateTotalDuration(
            records.filter((entry) => entry.date >= monthStart),
          ),
        ),
        totalDays: new Set(
          records
            .filter((entry) => entry.duration && entry.duration > 0)
            .map((entry) => entry.date),
        ).size,
      },
    };
  },
);
export const getTrackerData = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireOrganization();
    const { getClerkClient } = await import("@/lib/auth");
    const { db } = await import("@/lib/db/config");
    const { timeEntries } = await import("@/lib/db/schema");
    const { eq, and, desc } = await import("drizzle-orm");
    const { calculateDuration } = await import("@/lib/time-entries-format");
    const { getUserDisplayName } = await import("@/lib/user-utils");
    const [entries, user] = await Promise.all([
      db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.userId, session.userId),
            eq(timeEntries.orgId, session.orgId),
          ),
        )
        .orderBy(desc(timeEntries.date), desc(timeEntries.timeIn)),
      getClerkClient()?.users.getUser(session.userId),
    ]);
    const records = entries.map((entry) => ({
      ...entry,
      duration: calculateDuration(entry.timeIn, entry.timeOut),
      isActive: !entry.timeOut,
    }));
    return { records, userName: getUserDisplayName(user) };
  },
);
export const getAdminData = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireOrganization(true);
    const { db } = await import("@/lib/db/config");
    const { timeEntries, userOrganizations } = await import("@/lib/db/schema");
    const { eq, desc } = await import("drizzle-orm");
    const { getClerkClient } = await import("@/lib/auth");
    const { getUserDisplayName, getUserEmail } =
      await import("@/lib/user-utils");
    const { calculateDuration } = await import("@/lib/time-entries-format");
    const [entries, members] = await Promise.all([
      db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.orgId, session.orgId))
        .orderBy(desc(timeEntries.date), desc(timeEntries.timeIn)),
      db
        .select()
        .from(userOrganizations)
        .where(eq(userOrganizations.orgId, session.orgId)),
    ]);
    const userIds = [
      ...new Set([
        ...entries.map((entry) => entry.userId),
        ...members.map((member) => member.userId),
      ]),
    ];
    const clerk = getClerkClient();
    const users =
      userIds.length && clerk
        ? (await clerk.users.getUserList({ userId: userIds, limit: 100 })).data
        : [];
    const userMap = Object.fromEntries(
      users.map((user) => [user.id, getUserDisplayName(user)]),
    );
    return {
      orgId: session.orgId,
      userMap,
      entries: entries.map((entry) => ({
        ...entry,
        duration: calculateDuration(entry.timeIn, entry.timeOut),
        isActive: !entry.timeOut,
      })),
      members: members.map((member) => {
        const user = users.find((user) => user.id === member.userId);
        return {
          userId: member.userId,
          name: getUserDisplayName(user),
          email: getUserEmail(user),
          role: member.role,
        };
      }),
    };
  },
);
export const getInviteData = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await requireSession();
    const { getInvitation } = await import("@/lib/invitations");
    const { getOrganizationById } = await import("@/lib/organizations");
    const invitation = await getInvitation(id);
    if (!invitation)
      return {
        error: "Invitation not found",
        invitation: null,
        organization: null,
      };
    if (
      invitation.status !== "pending" ||
      Date.parse(invitation.expiresAt) < Date.now()
    ) {
      return {
        error:
          invitation.status === "accepted"
            ? "This invitation has already been accepted."
            : "This invitation has expired.",
        invitation: null,
        organization: null,
      };
    }
    const organization = await getOrganizationById(invitation.orgId);
    return organization
      ? { error: null, invitation, organization }
      : {
          error: "Organization not found",
          invitation: null,
          organization: null,
        };
  });

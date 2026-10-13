// WARNING: Do NOT import this file in client components. This file uses server-only code (database access, process.env, etc).
// Pure utility functions and types have been moved to lib/time-entries-utils.ts
import { db } from "@/lib/db/config";
import { timeEntries } from "@/lib/db/schema";
import {
  getTodayDate,
  getDateFromDateTime,
  getCurrentDateTime,
  getYesterdayDate,
} from "./time-entries-date";
import { calculateDuration } from "./time-entries-format";
import { TimeEntry, TimeEntryWithDuration } from "./time-entries-types";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
// Clock in - create a new time entry
export async function clockIn(
  userId: string,
  orgId: string,
): Promise<TimeEntry> {
  const now = getCurrentDateTime();
  // Use local date from the actual clock-in time to handle cross-midnight scenarios
  const dateFromClockIn = getDateFromDateTime(now);
  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId,
      orgId,
      date: dateFromClockIn,
      timeIn: now,
      timeOut: null,
      note: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return entry;
}
// Clock out - update the most recent active entry with time out and note
export async function clockOut(
  userId: string,
  orgId: string,
  note: string,
): Promise<TimeEntry> {
  if (!note || note.trim() === "") {
    throw new Error("Note is required when clocking out");
  }
  const now = getCurrentDateTime();
  // Find the most recent active entry (no timeOut) - don't filter by date to handle cross-midnight
  const activeEntry = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.orgId, orgId),
        isNull(timeEntries.timeOut),
      ),
    )
    .orderBy(desc(timeEntries.timeIn))
    .limit(1);
  if (activeEntry.length === 0) {
    throw new Error("No active time entry found. Please clock in first.");
  }
  const [updatedEntry] = await db
    .update(timeEntries)
    .set({
      timeOut: now,
      note: note.trim(),
      updatedAt: now,
    })
    .where(eq(timeEntries.id, activeEntry[0].id))
    .returning();
  return updatedEntry;
}
// Get current active time entry (if any) - works across midnight
export async function getActiveTimeEntry(
  userId: string,
  orgId: string,
): Promise<TimeEntry | null> {
  const activeEntries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.orgId, orgId),
        isNull(timeEntries.timeOut),
      ),
    )
    .orderBy(desc(timeEntries.timeIn))
    .limit(1);
  return activeEntries[0] || null;
}
// Get all time entries for a specific date
export async function getTimeEntriesForDate(
  userId: string,
  orgId: string,
  date: string,
): Promise<TimeEntryWithDuration[]> {
  const entries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.orgId, orgId),
        eq(timeEntries.date, date),
      ),
    )
    .orderBy(timeEntries.timeIn);
  return entries.map((entry) => ({
    ...entry,
    duration: calculateDuration(entry.timeIn, entry.timeOut),
    isActive: !entry.timeOut,
  }));
}
// Get time entries for a date range
export async function getTimeEntriesForRange(
  userId: string,
  orgId: string,
  startDate: string,
  endDate: string,
): Promise<TimeEntryWithDuration[]> {
  const entries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        eq(timeEntries.orgId, orgId),
        sql`${timeEntries.date} >= ${startDate}`,
        sql`${timeEntries.date} <= ${endDate}`,
      ),
    )
    .orderBy(desc(timeEntries.date), timeEntries.timeIn);
  return entries.map((entry) => ({
    ...entry,
    duration: calculateDuration(entry.timeIn, entry.timeOut),
    isActive: !entry.timeOut,
  }));
}
// Get today's time entries (includes cross-midnight entries)
export async function getTodayTimeEntries(
  userId: string,
  orgId: string,
): Promise<TimeEntryWithDuration[]> {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  // Get entries from today and yesterday (to catch cross-midnight scenarios)
  const [todayEntries, yesterdayEntries] = await Promise.all([
    getTimeEntriesForDate(userId, orgId, today),
    getTimeEntriesForDate(userId, orgId, yesterday),
  ]);
  // Filter yesterday entries to only include cross-midnight ones (timeOut is today)
  const crossMidnightEntries = yesterdayEntries.filter((entry) => {
    if (!entry.timeOut) return false; // Still active entries are handled separately
    const timeOutDate = getDateFromDateTime(entry.timeOut);
    return timeOutDate === today;
  });
  // Combine and sort by timeIn
  const allEntries = [...todayEntries, ...crossMidnightEntries];
  return allEntries.sort(
    (a, b) => new Date(a.timeIn).getTime() - new Date(b.timeIn).getTime(),
  );
}
// Check if user is currently clocked in
export async function isUserClockedIn(
  userId: string,
  orgId: string,
): Promise<boolean> {
  const activeEntry = await getActiveTimeEntry(userId, orgId);
  return activeEntry !== null;
}

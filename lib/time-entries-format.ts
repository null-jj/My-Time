// Duration calculation and formatting utilities for time entries. Safe for client and server.
import type { TimeEntryWithDuration } from "./time-entries-types";
// Calculate duration in minutes between timeIn and timeOut
export function calculateDuration(
  timeIn: string,
  timeOut?: string | null,
): number | undefined {
  if (!timeIn || !timeOut) return undefined;
  const start = new Date(timeIn).getTime();
  const end = new Date(timeOut).getTime();
  if (isNaN(start) || isNaN(end)) return undefined;
  return Math.max(0, Math.round((end - start) / 60000));
}
// Calculate total duration in minutes for an array of entries
export function calculateTotalDuration(
  entries: TimeEntryWithDuration[],
): number {
  return entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
}
// Format duration in minutes as H:MM
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

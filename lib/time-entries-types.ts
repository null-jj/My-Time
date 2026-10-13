// Types for time entries. Safe for client and server.
export type TimeEntry = {
  id: number;
  userId: string;
  orgId: string;
  date: string;
  timeIn: string;
  timeOut?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};
export type TimeEntryWithDuration = TimeEntry & {
  duration?: number; // in minutes
  isActive: boolean;
};

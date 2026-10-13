export type TimeChangeRequest = {
  id: number;
  timeEntryId: number;
  userId: string;
  orgId: string;
  requestedTimeIn: string | null;
  requestedTimeOut: string | null;
  requestedNote: string | null;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};
export type TimeChangeRequestWithEntry = TimeChangeRequest & {
  originalTimeIn: string;
  originalTimeOut: string | null;
  originalNote: string | null;
  originalDate: string;
  userName?: string;
};

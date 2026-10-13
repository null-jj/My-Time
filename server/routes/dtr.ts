import { auth } from "@/lib/auth";
import {
  clockIn,
  clockOut,
  getActiveTimeEntry,
  getTodayTimeEntries,
} from "@/lib/time-entries";

export async function dtr(request: Request): Promise<Response> {
  const { userId, orgId } = await auth(request);
  if (!userId || !orgId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (request.method === "GET") {
      const todayEntries = await getTodayTimeEntries(userId, orgId);
      const activeEntry = todayEntries.find((entry) => !entry.timeOut) ?? null;
      return Response.json({
        activeEntry,
        todayEntries,
        isClockedIn: activeEntry !== null,
      });
    }

    if (request.method === "POST") {
      if (await getActiveTimeEntry(userId, orgId)) {
        return Response.json(
          { error: "You are already clocked in. Please clock out first." },
          { status: 400 },
        );
      }
      const entry = await clockIn(userId, orgId);
      return Response.json({
        success: true,
        entry,
        message: "Successfully clocked in",
      });
    }

    if (request.method === "PATCH") {
      const { note } = await request.json();
      if (!note || note.trim() === "")
        return Response.json(
          { error: "Note is required when clocking out" },
          { status: 400 },
        );
      if (!(await getActiveTimeEntry(userId, orgId))) {
        return Response.json(
          { error: "You are not clocked in. Please clock in first." },
          { status: 400 },
        );
      }
      const entry = await clockOut(userId, orgId, note);
      return Response.json({
        success: true,
        entry,
        message: "Successfully clocked out",
      });
    }

    return Response.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json(
      { error: request.method === "PATCH" ? message : "Internal server error" },
      { status: 500 },
    );
  }
}

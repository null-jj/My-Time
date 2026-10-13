import { db } from "@/lib/db/config";
import { invitations } from "@/lib/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
export type Invitation = {
  id: string;
  email: string;
  orgId: string;
  inviterId: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string | null;
};
export async function createInvitation({
  email,
  orgId,
  inviterId,
}: {
  email: string;
  orgId: string;
  inviterId: string;
}): Promise<Invitation> {
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString(); // 7 days from now
  const invitationId = nanoid();
  const [invitation] = await db
    .insert(invitations)
    .values({
      id: invitationId,
      email: email.toLowerCase().trim(),
      orgId,
      inviterId,
      status: "pending" as const,
      expiresAt,
      createdAt: now,
      acceptedAt: null,
    })
    .returning();
  return invitation as Invitation;
}
export async function getInvitation(
  invitationId: string,
): Promise<Invitation | null> {
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);
  return invitation as Invitation | null;
}
export async function getPendingInvitations(
  orgId: string,
): Promise<Invitation[]> {
  const results = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.orgId, orgId),
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date().toISOString()),
      ),
    );
  return results as Invitation[];
}
export async function acceptInvitation(
  invitationId: string,
  _userId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(invitations)
    .set({
      status: "accepted",
      acceptedAt: now,
    })
    .where(eq(invitations.id, invitationId));
}
export async function expireInvitation(invitationId: string): Promise<void> {
  await db
    .update(invitations)
    .set({
      status: "expired",
    })
    .where(eq(invitations.id, invitationId));
}
export async function deleteInvitation(invitationId: string): Promise<void> {
  await db.delete(invitations).where(eq(invitations.id, invitationId));
}
export async function cleanupExpiredInvitations(): Promise<void> {
  const now = new Date().toISOString();
  await db
    .update(invitations)
    .set({
      status: "expired",
    })
    .where(
      and(eq(invitations.status, "pending"), lt(invitations.expiresAt, now)),
    );
}

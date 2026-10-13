import { db } from "@/lib/db/config";
import { organizations, userOrganizations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
export type Organization = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};
export type UserOrganization = {
  id: number;
  userId: string;
  orgId: string;
  role: "admin" | "member";
  joinedAt: string;
};
export type OrganizationWithRole = Organization & {
  role: "admin" | "member";
};
export async function getUserOrganizations(
  userId: string,
): Promise<OrganizationWithRole[]> {
  const userOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      description: organizations.description,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
      role: userOrganizations.role,
    })
    .from(userOrganizations)
    .innerJoin(organizations, eq(userOrganizations.orgId, organizations.id))
    .where(eq(userOrganizations.userId, userId));
  return userOrgs as OrganizationWithRole[];
}
export async function getOrganizationById(
  orgId: string,
): Promise<Organization | null> {
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return result[0] || null;
}
export async function getUserOrganization(
  userId: string,
  orgId: string,
): Promise<OrganizationWithRole | null> {
  const result = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      description: organizations.description,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
      role: userOrganizations.role,
    })
    .from(userOrganizations)
    .innerJoin(organizations, eq(userOrganizations.orgId, organizations.id))
    .where(
      and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.orgId, orgId),
      ),
    )
    .limit(1);
  return (result[0] as OrganizationWithRole) || null;
}
export async function createOrganization(
  name: string,
  description: string | undefined | null,
  creatorUserId: string,
): Promise<Organization> {
  const now = new Date().toISOString();
  const orgId = nanoid();
  const org = await db.transaction(async (tx) => {
    const [newOrg] = await tx
      .insert(organizations)
      .values({
        id: orgId,
        name,
        description,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    // Add creator as admin
    await tx.insert(userOrganizations).values({
      userId: creatorUserId,
      orgId,
      role: "admin",
      joinedAt: now,
    });
    return newOrg;
  });
  return org;
}
export async function addUserToOrganization(
  userId: string,
  orgId: string,
  role: "admin" | "member" = "member",
): Promise<void> {
  const now = new Date().toISOString();
  await db.insert(userOrganizations).values({
    userId,
    orgId,
    role,
    joinedAt: now,
  });
}
export async function removeUserFromOrganization(
  userId: string,
  orgId: string,
): Promise<void> {
  await db
    .delete(userOrganizations)
    .where(
      and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.orgId, orgId),
      ),
    );
}
export async function updateUserRole(
  userId: string,
  orgId: string,
  role: "admin" | "member",
): Promise<void> {
  await db
    .update(userOrganizations)
    .set({ role })
    .where(
      and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.orgId, orgId),
      ),
    );
}
export async function getOrganizationMembers(orgId: string) {
  return await db
    .select({
      userId: userOrganizations.userId,
      role: userOrganizations.role,
      joinedAt: userOrganizations.joinedAt,
    })
    .from(userOrganizations)
    .where(eq(userOrganizations.orgId, orgId));
}
export async function isUserAdmin(
  userId: string,
  orgId: string,
): Promise<boolean> {
  const result = await db
    .select({ role: userOrganizations.role })
    .from(userOrganizations)
    .where(
      and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.orgId, orgId),
      ),
    )
    .limit(1);
  return result[0]?.role === "admin";
}

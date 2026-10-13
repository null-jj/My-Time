import { auth, getClerkClient } from "@/lib/auth";
import {
  getUserDisplayName,
  getUserEmail,
  getUserImageUrl,
} from "@/lib/user-utils";
import {
  acceptInvitation,
  createInvitation,
  expireInvitation,
  getInvitation,
} from "@/lib/invitations";
import { sendInvitationEmail } from "@/lib/email";
import {
  addUserToOrganization,
  createOrganization,
  getOrganizationById,
  getOrganizationMembers,
  getUserOrganization,
  getUserOrganizations,
  isUserAdmin,
  removeUserFromOrganization,
  updateUserRole,
} from "@/lib/organizations";

export async function organizations(request: Request): Promise<Response> {
  const { userId } = await auth(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (request.method === "GET")
      return Response.json(await getUserOrganizations(userId));
    const { name, description, action } = await request.json();
    if (action !== "create")
      return Response.json({ error: "Invalid action" }, { status: 400 });
    if (!name)
      return Response.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    return Response.json(await createOrganization(name, description, userId));
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function organization(
  request: Request,
  orgId: string,
): Promise<Response> {
  const { userId } = await auth(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (request.method === "GET") {
      const value = await getUserOrganization(userId, orgId);
      return value
        ? Response.json(value)
        : Response.json(
            { error: "Organization not found or access denied" },
            { status: 404 },
          );
    }
    const { targetUserId, action, role } = await request.json();
    if (request.method === "DELETE") {
      if (action === "remove_member") {
        if (!(await isUserAdmin(userId, orgId)))
          return Response.json(
            { error: "Admin access required" },
            { status: 403 },
          );
        if (!(await getUserOrganization(targetUserId, orgId)))
          return Response.json(
            { error: "Target user is not a member of this organization" },
            { status: 404 },
          );
        await removeUserFromOrganization(targetUserId, orgId);
        return Response.json({ success: true });
      }
      if (action === "leave") {
        await removeUserFromOrganization(userId, orgId);
        return Response.json({ success: true });
      }
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!(await isUserAdmin(userId, orgId)))
      return Response.json({ error: "Admin access required" }, { status: 403 });
    if (role !== "admin" && role !== "member")
      return Response.json({ error: "Invalid role" }, { status: 400 });
    if (!(await getUserOrganization(targetUserId, orgId)))
      return Response.json(
        { error: "Target user is not a member of this organization" },
        { status: 404 },
      );
    await updateUserRole(targetUserId, orgId, role);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function organizationMembers(
  request: Request,
  orgId: string,
): Promise<Response> {
  const { userId } = await auth(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if (!(await isUserAdmin(userId, orgId)))
      return Response.json({ error: "Admin access required" }, { status: 403 });
    const members = await getOrganizationMembers(orgId);
    const clerk = getClerkClient();
    if (!clerk)
      return Response.json({ error: "Internal server error" }, { status: 500 });
    const users = await clerk.users.getUserList({
      userId: members.map((member) => member.userId),
    });
    return Response.json(
      members.map((member) => {
        const user = users.data.find(
          (candidate) => candidate.id === member.userId,
        );
        return {
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
          email: getUserEmail(user),
          name: getUserDisplayName(user) || "Unknown User",
          imageUrl: getUserImageUrl(user),
        };
      }),
    );
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function organizationInvite(
  request: Request,
  orgId: string,
): Promise<Response> {
  const { userId } = await auth(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { email } = await request.json();
    if (!email || !email.trim())
      return Response.json({ error: "Email is required" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    if (!(await isUserAdmin(userId, orgId)))
      return Response.json({ error: "Admin access required" }, { status: 403 });
    const org = await getOrganizationById(orgId);
    if (!org)
      return Response.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    const clerk = getClerkClient();
    if (!clerk)
      return Response.json({ error: "Internal server error" }, { status: 500 });
    const inviter = await clerk.users.getUser(userId);
    const invitation = await createInvitation({
      email: email.trim(),
      orgId,
      inviterId: userId,
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendInvitationEmail({
      to: email.trim(),
      organizationName: org.name,
      inviterName: getUserDisplayName(inviter),
      inviteUrl: `${baseUrl}/invite/${invitation.id}`,
    });
    return Response.json({
      success: true,
      message: "Invitation sent successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      },
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function invitation(
  request: Request,
  invitationId: string,
): Promise<Response> {
  const { userId } = await auth(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const value = await getInvitation(invitationId);
    if (!value)
      return Response.json({ error: "Invitation not found" }, { status: 404 });
    if (value.status !== "pending")
      return Response.json(
        { error: "Invitation has already been used or expired" },
        { status: 400 },
      );
    if (new Date() > new Date(value.expiresAt)) {
      await expireInvitation(invitationId);
      return Response.json(
        { error: "Invitation has expired" },
        { status: 400 },
      );
    }
    const clerk = getClerkClient();
    if (!clerk)
      return Response.json({ error: "Internal server error" }, { status: 500 });
    const user = await clerk.users.getUser(userId);
    const email = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress;
    if (!email || email.toLowerCase() !== value.email.toLowerCase())
      return Response.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 },
      );
    await addUserToOrganization(userId, value.orgId, "member");
    await acceptInvitation(invitationId, userId);
    return Response.json({
      success: true,
      message: "Invitation accepted successfully",
      organizationId: value.orgId,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

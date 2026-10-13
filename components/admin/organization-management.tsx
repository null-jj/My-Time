import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createEffect, createMemo } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import {
  Users,
  Plus,
  Settings,
  UserMinus,
  Shield,
  UserCheck,
  Loader2,
  Mail,
  X,
} from "@/components/icons";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
type Member = {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "member";
  joinedAt: string;
};
export function OrganizationManagement() {
  const organizationContext = useOrganizationContext(),
    organization = () => organizationContext.currentOrganization;
  const membership = createMemo(() => organization());
  const [members, setMembers] = createSignal<Member[]>([]);
  const [mutating, setMutating] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [showCreateForm, setShowCreateForm] = createSignal(false);
  const [createForm, setCreateForm] = createSignal({
    name: "",
    description: "",
  });
  const [showInviteForm, setShowInviteForm] = createSignal(false);
  const [inviteEmail, setInviteEmail] = createSignal("");
  const [inviteLoading, setInviteLoading] = createSignal(false);
  const isAdmin = createMemo(() => membership()?.role === "admin");
  const orgId = createMemo(() => organization()?.id);
  createEffect(
    () => [isAdmin(), orgId()],
    () => {
      if (isAdmin() && orgId()) {
        fetchMembers();
      }
    },
  );
  const fetchMembers = async () => {
    if (!orgId()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organizations/${orgId()}/members`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
      }
      const membersData = await response.json();
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };
  const handleCreateOrganization = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!createForm().name.trim()) return;
    try {
      setLoading(true);
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "create",
          name: createForm().name,
          description: createForm().description,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create organization: ${response.status}`);
      }
      setCreateForm({ name: "", description: "" });
      setShowCreateForm(false);
      toast.success("Organization created successfully!", {
        description: `${createForm().name} has been created and you are now an admin.`,
      });
      // The useOrganization hook will automatically refresh
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create organization";
      setError(errorMessage);
      toast.error("Failed to create organization", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleRemoveMember = async (userId: string) => {
    if (!orgId() || !confirm("Are you sure you want to remove this member?"))
      return;
    setMutating(true);
    try {
      const response = await fetch(`/api/organizations/${orgId()}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "remove_member",
          targetUserId: userId,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to remove member: ${response.status}`);
      }
      await fetchMembers();
      toast.success("Member removed successfully!", {
        description: "The member has been removed from the organization.",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove member";
      setError(errorMessage);
      toast.error("Failed to remove member", {
        description: errorMessage,
      });
    } finally {
      setMutating(false);
    }
  };
  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "member",
  ) => {
    if (!orgId()) return;
    setMutating(true);
    try {
      const response = await fetch(`/api/organizations/${orgId()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          targetUserId: userId,
          role: newRole,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update role: ${response.status}`);
      }
      await fetchMembers();
      toast.success("Role updated successfully!", {
        description: `User role has been changed to ${newRole}.`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update role";
      setError(errorMessage);
      toast.error("Failed to update role", {
        description: errorMessage,
      });
    } finally {
      setMutating(false);
    }
  };
  const handleSendInvitation = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!orgId() || !inviteEmail().trim()) return;
    try {
      setInviteLoading(true);
      const response = await fetch(`/api/organizations/${orgId()}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: inviteEmail().trim(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Failed to send invitation: ${response.status}`,
        );
      }
      setInviteEmail("");
      setShowInviteForm(false);
      toast.success("Invitation sent successfully!", {
        description: `An invitation has been sent to ${inviteEmail().trim()}.`,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send invitation";
      setError(errorMessage);
      toast.error("Failed to send invitation", {
        description: errorMessage,
      });
    } finally {
      setInviteLoading(false);
    }
  };
  usePageLoading(() => loading() || inviteLoading() || mutating());
  const view = createMemo(() => {
    if (!organization()) {
      return (
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Settings class="h-5 w-5" />
              Organization Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-center py-8">
              <p class="text-gray-600 mb-4">
                You&apos;re not part of any organization yet.
              </p>
              <Button onClick={() => setShowCreateForm(true)} class="mb-4">
                <Plus class="h-4 w-4 mr-2" />
                Create Organization
              </Button>

              {showCreateForm() && (
                <form
                  onSubmit={handleCreateOrganization}
                  class="max-w-md mx-auto space-y-4"
                >
                  <Input
                    placeholder="Organization Name"
                    value={createForm().name}
                    onInput={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={createForm().description}
                    onInput={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                  <div class="flex gap-2">
                    <Button type="submit" disabled={loading()}>
                      {loading() ? (
                        <>
                          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Settings class="h-5 w-5" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div>
                <span class="font-medium">Name:</span> {organization()?.name}
              </div>
              {organization()?.description && (
                <div>
                  <span class="font-medium">Description:</span>{" "}
                  {organization()?.description}
                </div>
              )}
              <div>
                <span class="font-medium">Your Role:</span>{" "}
                <Badge
                  variant={
                    membership()?.role === "admin" ? "default" : "secondary"
                  }
                >
                  {membership()?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {isAdmin() && (
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Users class="h-5 w-5" />
                Members ({members().length})
              </CardTitle>
              <div class="flex justify-end">
                <Button
                  onClick={() => setShowInviteForm(true)}
                  size="sm"
                  class="flex items-center gap-2"
                >
                  <Mail class="h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error() && (
                <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error()}
                </div>
              )}

              {showInviteForm() && (
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-blue-900">Invite New Member</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowInviteForm(false);
                        setInviteEmail("");
                      }}
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                  <form onSubmit={handleSendInvitation} class="space-y-3">
                    <div>
                      <label
                        for="invite-email"
                        class="block text-sm font-medium text-blue-900 mb-1"
                      >
                        Email Address
                      </label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail()}
                        onInput={(e) => setInviteEmail(e.target.value)}
                        required
                        class="bg-white"
                      />
                    </div>
                    <div class="flex gap-2">
                      <Button
                        type="submit"
                        disabled={inviteLoading()}
                        size="sm"
                        class="flex items-center gap-2"
                      >
                        {inviteLoading() ? (
                          <>
                            <Loader2 class="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail class="h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowInviteForm(false);
                          setInviteEmail("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {loading() ? (
                <div class="space-y-4">
                  {[1, 2, 3].map(() => (
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div class="flex-1">
                        <Skeleton class="h-5 w-32 mb-1" />
                        <Skeleton class="h-4 w-48" />
                      </div>
                      <div class="flex items-center gap-3">
                        <Skeleton class="h-6 w-16" />
                        <Skeleton class="h-8 w-20" />
                        <Skeleton class="h-8 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="space-y-3">
                  {members().map((member) => (
                    <div class="flex items-center justify-between p-3 border rounded-lg">
                      <div class="flex-1">
                        <div class="font-medium">{member.name}</div>
                        <div class="text-sm text-gray-600">{member.email}</div>
                        <div class="text-xs text-gray-500">
                          Joined:{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Badge
                          variant={
                            member.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {member.role}
                        </Badge>
                        <div class="flex gap-1">
                          {member.role === "member" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateRole(member.userId, "admin")
                              }
                              title="Make Admin"
                            >
                              <Shield class="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateRole(member.userId, "member")
                              }
                              title="Remove Admin"
                            >
                              <UserCheck class="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(member.userId)}
                            class="text-red-600 hover:text-red-700"
                            title="Remove Member"
                          >
                            <UserMinus class="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {members().length === 0 && (
                    <div class="text-center py-4 text-gray-600">
                      No members found.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  });
  return <>{view()}</>;
}

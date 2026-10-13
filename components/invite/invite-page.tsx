import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createMemo } from "solid-js";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, Clock, Loader2 } from "@/components/icons";
import { toast } from "@/components/ui/sonner";
import type { Invitation } from "@/lib/invitations";
import type { Organization } from "@/lib/organizations";
type InvitePageProps = {
  invitation: Invitation;
  organization: Organization;
};
export function InvitePage(props: InvitePageProps) {
  const [loading, setLoading] = createSignal(false);
  const router = useRouter();
  const handleAcceptInvitation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invite/${props.invitation.id}`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept invitation");
      }
      toast.success("Invitation accepted successfully!", {
        description: `You are now a member of ${props.organization.name}.`,
      });
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to accept invitation";
      toast.error("Failed to accept invitation", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  const formatExpiryDate = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  usePageLoading(() => loading());
  const view = createMemo(() => {
    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card class="w-full max-w-md">
          <CardHeader class="text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Users class="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle class="text-2xl font-bold text-gray-900">
              You&apos;re Invited!
            </CardTitle>
            <p class="text-gray-600 mt-2">
              You&apos;ve been invited to join an organization on DTR
            </p>
          </CardHeader>

          <CardContent class="space-y-6">
            {/* Organization Details */}
            <div class="space-y-3">
              <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-900">
                  {props.organization.name}
                </h3>
                {props.organization.description && (
                  <p class="text-sm text-gray-600 mt-1">
                    {props.organization.description}
                  </p>
                )}
              </div>
            </div>

            {/* Invitation Details */}
            <div class="space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Invited to:</span>
                <Badge variant="secondary">{props.invitation.email}</Badge>
              </div>

              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Expires:</span>
                <div class="flex items-center gap-1">
                  <Clock class="h-4 w-4 text-gray-500" />
                  <span class="text-gray-900">
                    {formatExpiryDate(props.invitation.expiresAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div class="bg-blue-50 rounded-lg p-4">
              <h4 class="font-medium text-blue-900 mb-2">
                What you&apos;ll get:
              </h4>
              <ul class="space-y-1 text-sm text-blue-800">
                <li class="flex items-center gap-2">
                  <CheckCircle class="h-4 w-4" />
                  Time tracking and project management
                </li>
                <li class="flex items-center gap-2">
                  <CheckCircle class="h-4 w-4" />
                  Team collaboration tools
                </li>
                <li class="flex items-center gap-2">
                  <CheckCircle class="h-4 w-4" />
                  Real-time activity monitoring
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleAcceptInvitation}
              disabled={loading()}
              class="w-full"
              size="lg"
            >
              {loading() ? (
                <>
                  <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle class="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>

            <p class="text-xs text-gray-500 text-center">
              By accepting this invitation, you&apos;ll be added as a member of
              this organization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  });
  return <>{view()}</>;
}

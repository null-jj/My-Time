import { usePageLoading } from "@/lib/contexts/page-loading-context";
import { createSignal, createMemo } from "solid-js";
import { useUser } from "@/lib/auth-client";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, Plus } from "@/components/icons";
import { useRouter } from "@/lib/navigation";
import { getClientUserDisplayName } from "@/lib/user-utils";
export default function WelcomePage() {
  const auth = useUser(),
    user = () => auth.user;
  const organizationContext = useOrganizationContext(),
    createOrganization = () => organizationContext.createOrganization,
    loading = () => organizationContext.loading;
  const router = useRouter();
  const [createForm, setCreateForm] = createSignal({
    name: "",
    description: "",
  });
  const [isCreating, setIsCreating] = createSignal(false);
  const handleCreateOrganization = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!createForm().name.trim()) return;
    setIsCreating(true);
    try {
      await createOrganization()(createForm().name, createForm().description);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create organization:", error);
    } finally {
      setIsCreating(false);
    }
  };
  usePageLoading(() => loading() || isCreating());
  const view = createMemo(() => {
    if (loading()) {
      return (
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    return (
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div class="max-w-2xl mx-auto">
          <div class="text-center mb-8">
            <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 class="w-10 h-10 text-white" />
            </div>
            <h1 class="text-4xl font-bold text-gray-900 mb-4">
              Welcome to DTR System, {getClientUserDisplayName(user())}!
            </h1>
            <p class="text-xl text-gray-600 mb-8">
              Get started by creating or joining an organization to begin
              tracking time.
            </p>
          </div>

          <div class="grid md:grid-cols-2 gap-6 mb-8">
            <Card class="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
              <CardHeader class="text-center">
                <CardTitle class="flex items-center justify-center gap-2">
                  <Plus class="h-5 w-5" />
                  Create Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-gray-600 text-center mb-4">
                  Start fresh by creating a new organization for your team.
                </p>
                <form onSubmit={handleCreateOrganization} class="space-y-4">
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
                    rows={3}
                  />
                  <Button
                    type="submit"
                    class="w-full"
                    disabled={isCreating() || !createForm().name.trim()}
                  >
                    {isCreating() ? "Creating..." : "Create Organization"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card class="border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors">
              <CardHeader class="text-center">
                <CardTitle class="flex items-center justify-center gap-2">
                  <Users class="h-5 w-5" />
                  Join Organization
                </CardTitle>
              </CardHeader>
              <CardContent class="text-center">
                <p class="text-gray-600 mb-4">
                  Have an invitation? Contact your administrator to get access
                  to an existing organization.
                </p>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <p class="text-sm text-gray-500">
                    Your administrator will need to add you to their
                    organization using your email:
                    <br />
                    <span class="font-medium text-gray-700">
                      {user()?.primaryEmailAddress?.emailAddress}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div class="text-center">
            <p class="text-gray-500 text-sm">
              Need help? Contact your system administrator or check our
              documentation.
            </p>
          </div>
        </div>
      </div>
    );
  });
  return <>{view()}</>;
}

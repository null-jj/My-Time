import { createFileRoute } from "@tanstack/solid-router";
import { Show } from "solid-js";
import { InvitePage } from "@/components/invite/invite-page";
import { getInviteData } from "../server-data";
export const Route = createFileRoute("/invite/$invitationId")({
  loader: ({ params }) => getInviteData({ data: params.invitationId }),
  component: Page,
});
function Page() {
  const data = Route.useLoaderData();
  return (
    <Show
      when={data().invitation && data().organization}
      fallback={
        <main class="min-h-screen flex items-center justify-center p-6">
          <p role="alert">{data().error}</p>
        </main>
      }
    >
      <InvitePage
        invitation={data().invitation!}
        organization={data().organization!}
      />
    </Show>
  );
}

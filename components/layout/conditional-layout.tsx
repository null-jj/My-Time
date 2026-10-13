import { Show } from "solid-js";
import { useLocation, useRouterState } from "@tanstack/solid-router";
import type { JSX } from "@solidjs/web";
import { useAuth } from "@/lib/auth-client";
import { Sidebar } from "./sidebar";
import { LoadingRegion } from "@/components/ui/loading-region";
import { usePageLoadingState } from "@/lib/contexts/page-loading-context";
import { useOrganizationContext } from "@/lib/contexts/organization-context";
export function ConditionalLayout(props: { children: JSX.Element }) {
  const auth = useAuth();
  const location = useLocation();
  const pending = useRouterState({ select: (state) => state.isLoading });
  const loading = usePageLoadingState();
  const organization = useOrganizationContext();
  const content = (
    <LoadingRegion
      loading={
        pending() || loading() || organization.loading || organization.switching
      }
    >
      {props.children}
    </LoadingRegion>
  );
  const isAuthPage = () =>
    location().pathname.startsWith("/sign-in") ||
    location().pathname.startsWith("/sign-up");
  return (
    <Show when={!isAuthPage()} fallback={content}>
      <Show when={auth.signedIn} fallback={content}>
        <div class="min-h-screen bg-background">
          <Sidebar />
          <div class="lg:pl-64">
            <main class="px-4 py-6 sm:px-6 lg:px-8">{content}</main>
          </div>
        </div>
      </Show>
    </Show>
  );
}

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/solid-router";
import type { JSX } from "@solidjs/web";
import { ClerkProvider } from "@/lib/auth-client";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { OrganizationProvider } from "@/lib/contexts/organization-context";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { Toaster } from "@/components/ui/sonner";
import ProgressBar from "@/components/ui/progress-bar";
import styles from "../styles.css?url";
import { getLayoutData } from "../server-data";
import { PageLoadingProvider } from "@/lib/contexts/page-loading-context";
export const Route = createRootRoute({
  loader: () => getLayoutData(),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DTR System - Time Tracking Made Simple" },
      {
        name: "description",
        content: "Modern daily time record system for organizations",
      },
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: () => <Outlet />,
  notFoundComponent: () => (
    <main class="p-8 text-center">
      <h1>Page not found</h1>
      <a href="/dashboard">Return to dashboard</a>
    </main>
  ),
  shellComponent: RootDocument,
});
function RootDocument(props: { children: JSX.Element }) {
  const layout = Route.useLoaderData();
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script innerHTML="try{var t=localStorage.getItem('theme');if(t)document.documentElement.classList.add(t)}catch(e){}" />
      </head>
      <body class="antialiased">
        <ClerkProvider initialUserId={layout().userId}>
          <ThemeProvider>
            <OrganizationProvider initialData={layout()}>
              <ProgressBar />
              <PageLoadingProvider>
                <ConditionalLayout>{props.children}</ConditionalLayout>
              </PageLoadingProvider>
              <Toaster />
            </OrganizationProvider>
          </ThemeProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}

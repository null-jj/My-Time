import { createSignal, flush } from "solid-js";
import { render as renderSolid, type JSX } from "@solidjs/web";
import {
  PageLoadingProvider,
  usePageLoading,
  usePageLoadingState,
} from "../../lib/contexts/page-loading-context";
import { LoadingRegion } from "../../components/ui/loading-region";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { TimeChangeRequestForm } from "../../components/dtr/time-change-request-form";
import { RealtimeTimeClock } from "../../components/dashboard/realtime-time-clock";
import { RealtimeTodayEntries } from "../../components/dashboard/realtime-today-entries";
import { ClerkProvider, SignIn, useAuth } from "../../lib/auth-client";
import {
  OrganizationProvider,
  useOrganizationContext,
} from "../../lib/contexts/organization-context";
import type { TimeEntryWithDuration } from "../../lib/time-entries-types";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const settle = async () => {
  flush();
  await new Promise((resolve) => setTimeout(resolve, 0));
  flush();
};
function LayoutProbe() {
  const auth = useAuth();
  const organization = useOrganizationContext();
  return (
    <div>
      {auth.signedIn ? "Signed in" : "Signed out"}|
      {organization.currentOrganization?.name}
    </div>
  );
}
function render(factory: () => JSX.Element, element: HTMLElement) {
  return renderSolid(
    () => <PageLoadingProvider>{factory()}</PageLoadingProvider>,
    element,
  );
}
function LoadingTask(props: { loading: boolean }) {
  usePageLoading(() => props.loading);
  return null;
}
function PageControls(props: { onClick: () => void }) {
  const loading = usePageLoadingState();
  return (
    <LoadingRegion loading={loading()}>
      <Button onClick={props.onClick}>Page action</Button>
      <Input aria-label="Page input" />
    </LoadingRegion>
  );
}

export async function runUIFlow(root: HTMLElement) {
  const [firstPending, setFirstPending] = createSignal(true);
  const [secondPending, setSecondPending] = createSignal(true);
  const [showTask, setShowTask] = createSignal(true);
  let pageClicks = 0;
  let sidebarClicks = 0;
  const disposePending = render(
    () => (
      <>
        <LoadingTask loading={firstPending()} />
        {showTask() && <LoadingTask loading={secondPending()} />}
        <Button
          onClick={() => {
            sidebarClicks++;
          }}
        >
          Sidebar action
        </Button>
        <PageControls
          onClick={() => {
            pageClicks++;
          }}
        />
      </>
    ),
    root,
  );
  await settle();
  const pageAction = [...root.querySelectorAll("button")].find(
    (button) => button.textContent === "Page action",
  );
  const sidebarAction = [...root.querySelectorAll("button")].find(
    (button) => button.textContent === "Sidebar action",
  );
  check(pageAction && sidebarAction, "Page and sidebar controls must render");
  check(
    pageAction.matches(":disabled") &&
      root.querySelector("input")?.matches(":disabled"),
    "Loading must disable page buttons and fields",
  );
  pageAction.click();
  sidebarAction.click();
  check(
    pageClicks === 0 && sidebarClicks === 1,
    "Loading must block page actions while allowing sidebar actions",
  );
  setFirstPending(false);
  await settle();
  check(
    pageAction.matches(":disabled"),
    "Finishing one request must not unlock another pending request",
  );
  setShowTask(false);
  await settle();
  check(
    !pageAction.matches(":disabled"),
    "Disposing the remaining pending component must release its loading state",
  );
  pageAction.click();
  check(
    Number(pageClicks) === 1,
    "Page controls must work again after loading",
  );
  setShowTask(true);
  await settle();
  check(
    pageAction.matches(":disabled"),
    "A new pending request must lock page controls",
  );
  setSecondPending(false);
  await settle();
  check(
    !pageAction.matches(":disabled"),
    "Completing the remaining request must unlock page controls",
  );
  disposePending();
  root.replaceChildren();
  let subscriptions = 0;
  let unsubscriptions = 0;
  let mounts = 0;
  let unmounts = 0;
  Object.defineProperty(window, "Clerk", {
    configurable: true,
    value: {
      loaded: true,
      user: null,
      load: async () => {},
      addListener: () => {
        subscriptions++;
        return () => {
          unsubscriptions++;
        };
      },
      mountSignIn: () => {
        mounts++;
      },
      unmountSignIn: () => {
        unmounts++;
      },
    },
  });
  for (const path of [
    "ui@1/dist/ui.browser.js",
    "clerk-js@6/dist/clerk.browser.js",
  ]) {
    const script = document.createElement("script");
    script.src = `https://clerk.fixture.test/npm/@clerk/${path}`;
    script.dataset.loaded = "true";
    document.head.append(script);
  }
  const disposeAuth = render(
    () => (
      <ClerkProvider>
        <SignIn />
      </ClerkProvider>
    ),
    root,
  );
  await settle();
  await settle();
  check(
    subscriptions === 1 && mounts === 1,
    "Clerk must subscribe and mount its sign-in widget",
  );
  disposeAuth();
  await settle();
  root.replaceChildren();
  check(
    unsubscriptions === 1 && unmounts === 1,
    "Clerk disposal must remove its listener and widget",
  );
  let releaseLoad = () => {};
  const loaded = new Promise<void>((resolve) => {
    releaseLoad = resolve;
  });
  let notify = () => {};
  let fixtureUser: { id: string } | null = { id: "server-user" };
  const seededClerk = {
    loaded: true,
    get user() {
      return fixtureUser;
    },
    load: () => loaded,
    addListener: (listener: () => void) => {
      notify = listener;
      return () => {};
    },
  };
  Object.defineProperty(window, "Clerk", {
    configurable: true,
    value: seededClerk,
  });
  const fetchBeforeLayout = globalThis.fetch;
  let organizationFetches = 0;
  globalThis.fetch = async () => {
    organizationFetches++;
    return Response.json([]);
  };
  const disposeLayout = render(
    () => (
      <ClerkProvider initialUserId="server-user">
        <OrganizationProvider
          initialData={{
            userId: "server-user",
            orgId: "org-server",
            organizations: [
              {
                id: "org-server",
                name: "Server organization",
                description: null,
                role: "member",
                createdAt: "2026-10-14",
                updatedAt: "2026-10-14",
              },
            ],
          }}
        >
          <LayoutProbe />
        </OrganizationProvider>
      </ClerkProvider>
    ),
    root,
  );
  const layoutText = () => root.textContent;
  try {
    await settle();
    check(
      layoutText() === "Signed in|Server organization",
      "Server session and organization must be available before Clerk loads",
    );
    check(
      organizationFetches === 0,
      "Seeded layout must not fetch organizations while Clerk loads",
    );
    releaseLoad();
    await settle();
    await settle();
    check(
      layoutText() === "Signed in|Server organization" &&
        organizationFetches === 0,
      "Clerk readiness must preserve the initial layout without refetching memberships",
    );
    let resolveMemberships = (_response: Response) => {};
    const pendingMemberships = new Promise<Response>((resolve) => {
      resolveMemberships = resolve;
    });
    globalThis.fetch = () => pendingMemberships;
    fixtureUser = { id: "different-user" };
    notify();
    await settle();
    check(
      layoutText() === "Signed in|",
      "Changing users must clear the previous user's organization before fetching",
    );
    fixtureUser = null;
    notify();
    await settle();
    check(
      layoutText() === "Signed out|",
      "Sign-out must discard the session and organization",
    );
    const cookieBeforeResponse = document.cookie;
    resolveMemberships(
      Response.json([
        {
          id: "other-org",
          name: "Other organization",
          description: null,
          role: "member",
          createdAt: "2026-10-14",
          updatedAt: "2026-10-14",
        },
      ]),
    );
    await settle();
    await settle();
    check(
      layoutText() === "Signed out|",
      "A late membership response must not restore organizations after sign-out",
    );
    check(
      document.cookie === cookieBeforeResponse,
      "A late membership response must not write the selected organization cookie",
    );
  } finally {
    disposeLayout();
    root.replaceChildren();
    globalThis.fetch = fetchBeforeLayout;
  }
  const [value, setValue] = createSignal("Initial");
  const [disabled, setDisabled] = createSignal(false);
  let dispose = render(
    () => (
      <>
        <Input
          aria-label="Value"
          value={value()}
          onInput={(event) => setValue(event.currentTarget.value)}
        />
        <Button disabled={disabled()}>{disabled() ? "Saving" : "Save"}</Button>
      </>
    ),
    root,
  );
  await settle();
  const input = root.querySelector("input");
  const button = root.querySelector("button");
  check(input && button, "Input and Button must render");
  input.value = "Edited";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  check(value() === "Edited", "Input handler must update the signal");
  setValue("Reset");
  setDisabled(true);
  await settle();
  check(input.value === "Reset", "Input must reflect reactive value changes");
  check(
    button.disabled && button.textContent === "Saving",
    "Button disabled state and children must remain reactive",
  );
  dispose();
  root.replaceChildren();

  let selected = "";
  dispose = render(
    () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Members</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              selected = "member-a";
            }}
          >
            Member A
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              selected = "member-b";
            }}
          >
            Member B
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    root,
  );
  root.querySelector("button")?.click();
  await settle();
  const items = root.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
  check(items.length === 2, "Dropdown must open and render member choices");
  const menu = root.querySelector<HTMLElement>('[role="menu"]');
  const trigger = root.querySelector<HTMLElement>('[aria-haspopup="menu"]');
  check(menu && trigger, "Dropdown must provide a trigger and menu");
  Object.defineProperty(menu, "offsetHeight", {
    configurable: true,
    value: 266,
  });
  trigger.getBoundingClientRect = () =>
    new window.DOMRect(0, window.innerHeight - 40, 36, 36);
  window.dispatchEvent(new Event("resize"));
  await settle();
  check(
    menu.classList.contains("bottom-full"),
    "Dropdown at the bottom of the viewport must open above its trigger",
  );
  trigger.getBoundingClientRect = () => new window.DOMRect(0, 40, 36, 36);
  window.dispatchEvent(new Event("resize"));
  await settle();
  check(
    menu.classList.contains("top-full"),
    "Dropdown near the top must open below its trigger",
  );
  items[1].click();
  await settle();
  check(
    selected === "member-b",
    "Dropdown must invoke the member selection handler",
  );
  check(
    root.querySelector('[role="menu"]') === null,
    "Dropdown must close after selection",
  );
  root.querySelector("button")?.click();
  await settle();
  root
    .querySelector('[role="menuitem"]')
    ?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
  await settle();
  check(
    root.querySelector('[role="menu"]') === null,
    "Escape must close the dropdown",
  );
  dispose();
  root.replaceChildren();

  dispose = render(
    () => (
      <Tabs defaultValue="first">
        <TabsList>
          <TabsTrigger value="first">First</TabsTrigger>
          <TabsTrigger value="second">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="first">First panel</TabsContent>
        <TabsContent value="second">Second panel</TabsContent>
      </Tabs>
    ),
    root,
  );
  await settle();
  root.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
  await settle();
  check(
    root.querySelector('[role="tabpanel"]')?.textContent === "Second panel",
    "Tabs must render the selected panel",
  );
  check(
    root.querySelectorAll('[role="tab"]')[1].getAttribute("aria-selected") ===
      "true",
    "Tab selection must update ARIA state",
  );
  dispose();
  root.replaceChildren();

  const savedFetch = globalThis.fetch;
  let activeEntry: TimeEntryWithDuration | null = null;
  globalThis.fetch = async (_url, init) => {
    if (init?.method === "POST")
      activeEntry = {
        id: 1,
        userId: "user-a",
        orgId: "org-a",
        date: "2026-10-13",
        timeIn: new Date().toISOString(),
        timeOut: null,
        note: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };
    if (init?.method === "PATCH") activeEntry = null;
    return Response.json({
      activeEntry,
      todayEntries: activeEntry ? [activeEntry] : [],
      isClockedIn: activeEntry !== null,
    });
  };
  try {
    dispose = render(
      () => (
        <>
          <RealtimeTimeClock
            initialActiveEntry={null}
            initialTodayEntries={[]}
            initialIsClockedIn={false}
          />
          <RealtimeTodayEntries
            initialEntries={[]}
            initialActiveEntry={null}
            initialIsClockedIn={false}
          />
        </>
      ),
      root,
    );
    await settle();
    root.querySelector("button")?.click();
    await settle();
    check(
      root.textContent?.includes("Clocked In") &&
        !root.textContent?.includes("Not Clocked In"),
      "Clock-in must update the status badge",
    );
    root.querySelector("button")?.click();
    await settle();
    const note = root.querySelector("textarea");
    check(note, "Clock-out must request a note");
    note.value = "Completed work";
    note.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    root.querySelector("button")?.click();
    await settle();
    check(
      root.textContent?.includes("Not Clocked In"),
      "Clock-out must update the status badge",
    );
  } finally {
    globalThis.fetch = savedFetch;
    dispose();
    root.replaceChildren();
  }

  let submitted = 0;
  let body: Record<string, unknown> | undefined;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    body = JSON.parse(String(init?.body));
    await new Promise((resolve) => setTimeout(resolve, 5));
    return Response.json({ success: true });
  };
  try {
    dispose = render(
      () => (
        <TimeChangeRequestForm
          entry={{
            id: 1,
            userId: "user-a",
            orgId: "org-a",
            date: "2026-10-12",
            timeIn: "2026-10-12T08:00:00.000Z",
            timeOut: "2026-10-12T16:00:00.000Z",
            note: "Original",
            createdAt: "2026-10-12T08:00:00.000Z",
            updatedAt: "2026-10-12T16:00:00.000Z",
            isActive: false,
            duration: 480,
          }}
          onClose={() => {}}
          onSubmitted={() => {
            submitted++;
          }}
        />
      ),
      root,
    );
    await settle();
    const reason = root.querySelector("textarea");
    const note = root.querySelectorAll("input")[2];
    check(reason && note, "Adjustment form must render note and reason inputs");
    reason.value = "Correct note";
    reason.dispatchEvent(new Event("input", { bubbles: true }));
    note.value = "Updated note";
    note.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    const form = root.querySelector("form");
    check(form, "Adjustment form must exist");
    form.dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
    await settle();
    check(
      submitted === 1,
      "Adjustment submission must invoke its completion callback once",
    );
    check(
      body?.requestedNote === "Updated note" &&
        body.reason === "Correct note" &&
        body.timeEntryId === 1,
      "Adjustment API payload must contain the edited values",
    );
  } finally {
    globalThis.fetch = originalFetch;
    dispose();
    root.replaceChildren();
  }
  return "Verified reactive controls, dropdown actions, tabs, and adjustment submission.";
}

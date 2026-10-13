import {
  createContext,
  createEffect,
  createSignal,
  omit,
  Show,
  useContext,
} from "solid-js";
import type { JSX } from "@solidjs/web";
import type {
  Clerk,
  SignInProps,
  SignUpProps,
  UserButtonProps,
  UserResource,
} from "@clerk/types";
type AuthContextValue = {
  readonly loaded: boolean;
  readonly user: UserResource | null;
  readonly signedIn: boolean;
  readonly clerk: Clerk | null;
  readonly error: string | null;
  retry: () => void;
  signOut: () => Promise<void>;
};
type BrowserClerk = Clerk & {
  load: (options?: {
    ui?: {
      ClerkUI?: unknown;
    };
  }) => Promise<void>;
};
declare global {
  interface Window {
    Clerk?: BrowserClerk;
    __internal_ClerkUICtor?: unknown;
  }
}
const AuthContext = createContext<AuthContextValue>();
function clerkDomain(publishableKey: string) {
  const encodedDomain = publishableKey.split("_")[2];
  if (!encodedDomain)
    throw new Error("The Clerk publishable key is malformed.");
  return atob(encodedDomain).slice(0, -1);
}
function loadScript(src: string, attributes: Record<string, string> = {}) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true },
      );
      if (existing.dataset.loaded === "true") resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    Object.entries(attributes).forEach(([name, value]) =>
      script.setAttribute(name, value),
    );
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(
        new Error("Sign-in could not load. Check your connection and retry."),
      );
    };
    document.head.append(script);
  });
}
async function loadClerk(publishableKey: string): Promise<BrowserClerk> {
  const domain = clerkDomain(publishableKey);
  await loadScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
  await loadScript(
    `https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
    { "data-clerk-publishable-key": publishableKey },
  );
  const clerk = window.Clerk;
  if (!clerk) throw new Error("Clerk did not initialize.");
  await clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });
  return clerk;
}
export function ClerkProvider(props: {
  children: JSX.Element;
  initialUserId?: string | null;
}) {
  const [loaded, setLoaded] = createSignal(false);
  const [clerk, setClerk] = createSignal<Clerk | null>(null);
  const [user, setUser] = createSignal<UserResource | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [attempt, setAttempt] = createSignal(0);
  const sync = (instance: Clerk) => {
    setUser(instance.user ?? null);
    setLoaded(instance.loaded);
  };
  createEffect(attempt, () => {
    const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey)
      throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required.");
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    void loadClerk(publishableKey)
      .then((instance) => {
        if (disposed) return;
        setClerk(instance);
        sync(instance);
        unsubscribe = instance.addListener(() => sync(instance));
      })
      .catch((reason) => {
        setError(
          reason instanceof Error ? reason.message : "Clerk failed to load.",
        );
      });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  });
  const value: AuthContextValue = {
    get loaded() {
      return loaded();
    },
    get user() {
      return user();
    },
    get signedIn() {
      return user() !== null || (!loaded() && !!props.initialUserId);
    },
    get clerk() {
      return clerk();
    },
    get error() {
      return error();
    },
    retry: () => {
      setError(null);
      setAttempt((count) => count + 1);
    },
    signOut: async () => {
      await clerk()?.signOut();
    },
  };
  return (
    <AuthContext value={value}>
      <Show when={error()}>
        <div role="alert" class="m-4 rounded-md border border-destructive p-4">
          {error()}{" "}
          <button type="button" onClick={value.retry}>
            Retry sign-in
          </button>
        </div>
      </Show>
      {props.children}
    </AuthContext>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within a ClerkProvider.");
  return context;
}
export function useUser() {
  const auth = useAuth();
  return {
    get isLoaded() {
      return auth.loaded;
    },
    get user() {
      return auth.user;
    },
  };
}
type ClerkMountProps = {
  class?: string;
} & (
  | {
      kind: "sign-in";
      options: SignInProps;
    }
  | {
      kind: "sign-up";
      options: SignUpProps;
    }
  | {
      kind: "user-button";
      options: UserButtonProps;
    }
);
function ClerkMount(props: ClerkMountProps) {
  const auth = useAuth();
  let element: HTMLDivElement | undefined;
  createEffect(
    () => auth.clerk,
    (instance) => {
      const target = element;
      if (!instance || !target) return;
      switch (props.kind) {
        case "sign-in":
          instance.mountSignIn(target, props.options);
          return () => instance.unmountSignIn(target);
        case "sign-up":
          instance.mountSignUp(target, props.options);
          return () => instance.unmountSignUp(target);
        case "user-button":
          instance.mountUserButton(target, props.options);
          return () => instance.unmountUserButton(target);
      }
    },
  );
  return <div ref={element} class={props.class} />;
}
export function SignIn(
  props: SignInProps & {
    class?: string;
  },
) {
  const options = omit(props, "class");
  return <ClerkMount kind="sign-in" options={options} class={props.class} />;
}
export function SignUp(
  props: SignUpProps & {
    class?: string;
  },
) {
  const options = omit(props, "class");
  return <ClerkMount kind="sign-up" options={options} class={props.class} />;
}
export function UserButton(
  props: UserButtonProps & {
    class?: string;
  },
) {
  const options = omit(props, "class");
  return (
    <ClerkMount kind="user-button" options={options} class={props.class} />
  );
}

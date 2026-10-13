import {
  createContext,
  createEffect,
  createSignal,
  useContext,
  type Accessor,
} from "solid-js";
import type { JSX } from "@solidjs/web";

type PageLoadingContextValue = {
  loading: Accessor<boolean>;
  begin: () => () => void;
};
const PageLoadingContext = createContext<PageLoadingContextValue>();

export function PageLoadingProvider(props: { children: JSX.Element }) {
  const [active, setActive] = createSignal(new Set<symbol>());
  const value: PageLoadingContextValue = {
    loading: () => active().size > 0,
    begin: () => {
      const task = Symbol();
      setActive((current) => new Set([...current, task]));
      return () =>
        setActive((current) => {
          const next = new Set(current);
          next.delete(task);
          return next;
        });
    },
  };
  return (
    <PageLoadingContext value={value}>{props.children}</PageLoadingContext>
  );
}

export function usePageLoading(loading: Accessor<boolean>) {
  const context = useContext(PageLoadingContext);
  if (!context) throw new Error("usePageLoading requires PageLoadingProvider.");
  createEffect(loading, (isLoading) =>
    isLoading ? context.begin() : undefined,
  );
}

export function usePageLoadingState() {
  const context = useContext(PageLoadingContext);
  if (!context)
    throw new Error("usePageLoadingState requires PageLoadingProvider.");
  return context.loading;
}

import { createEffect, createSignal, Show } from "solid-js";
export default function ProgressBar() {
  const [loading, setLoading] = createSignal(false);
  createEffect(
    () => undefined,
    () => {
      const start = (event: MouseEvent) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          !(event.target instanceof Element)
        )
          return;
        const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
        if (
          !anchor ||
          anchor.target === "_blank" ||
          anchor.hasAttribute("download")
        )
          return;
        const target = new URL(anchor.href);
        if (
          target.origin === location.origin &&
          target.pathname !== location.pathname
        )
          setLoading(true);
      };
      const done = () => setLoading(false);
      document.addEventListener("click", start);
      window.addEventListener("pageshow", done);
      return () => {
        document.removeEventListener("click", start);
        window.removeEventListener("pageshow", done);
      };
    },
  );
  return (
    <Show when={loading()}>
      <div
        role="progressbar"
        aria-label="Loading page"
        class="fixed inset-x-0 top-0 z-[100] h-0.5 animate-pulse bg-primary"
      />
    </Show>
  );
}

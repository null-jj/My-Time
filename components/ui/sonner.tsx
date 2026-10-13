import { createSignal, For } from "solid-js";
import type { JSX } from "@solidjs/web";
type ToastKind = "success" | "error" | "info" | "loading";
type ToastOptions = {
  description?: string;
  duration?: number;
};
type ToastRecord = ToastOptions & {
  id: number;
  title: string;
  kind: ToastKind;
};
const [toasts, setToasts] = createSignal<ToastRecord[]>([]);
let nextId = 0;
function add(kind: ToastKind, title: string, options: ToastOptions = {}) {
  const id = ++nextId;
  setToasts((items) => [...items, { id, kind, title, ...options }]);
  if (kind !== "loading")
    window.setTimeout(() => dismiss(id), options.duration ?? 4000);
  return id;
}
function dismiss(id?: number) {
  setToasts((items) =>
    id === undefined ? [] : items.filter((item) => item.id !== id),
  );
}
export const toast = {
  success: (title: string, options?: ToastOptions) =>
    add("success", title, options),
  error: (title: string, options?: ToastOptions) =>
    add("error", title, options),
  info: (title: string, options?: ToastOptions) => add("info", title, options),
  loading: (title: string, options?: ToastOptions) =>
    add("loading", title, options),
  dismiss,
};
export function Toaster(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const { class: className, ...rest } = props;
  return (
    <div
      class={`toaster group fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 ${className ?? ""}`}
      {...rest}
    >
      <For each={toasts()}>
        {(item) => (
          <div
            role="status"
            class="group toast rounded-md border border-gray-200 bg-white p-4 text-gray-950 shadow-lg"
          >
            <div class="font-medium">{item.title}</div>
            {item.description && (
              <div class="mt-1 text-sm text-gray-500">{item.description}</div>
            )}
            <button
              type="button"
              class="sr-only"
              onClick={() => dismiss(item.id)}
            >
              Dismiss
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

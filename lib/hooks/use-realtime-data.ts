import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";
type RealtimeDataOptions = {
  interval?: number;
  enabled?: boolean | Accessor<boolean>;
  immediate?: boolean;
};
export function useRealtimeData<T>(
  fetchFn: () => Promise<T>,
  initialData: T,
  options: RealtimeDataOptions = {},
) {
  const [data, setData] = createSignal<T>(() => initialData);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const enabled = () =>
    typeof options.enabled === "function"
      ? options.enabled()
      : (options.enabled ?? true);
  let intervalId: ReturnType<typeof setInterval> | undefined;
  const refresh = async () => {
    if (!enabled()) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchFn();
      setData(() => next);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to fetch data",
      );
    } finally {
      setLoading(false);
    }
  };
  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };
  const startPolling = () => {
    stopPolling();
    if (enabled())
      intervalId = setInterval(() => void refresh(), options.interval ?? 30000);
  };
  createEffect(enabled, (isEnabled) => {
    stopPolling();
    if (!isEnabled) return;
    if (options.immediate) void refresh();
    startPolling();
  });
  onCleanup(stopPolling);
  return { data, loading, error, refresh, startPolling, stopPolling };
}

import type { JSX } from "@solidjs/web";
export function invokeHandler<T extends HTMLElement, E extends Event>(
  handler: JSX.EventHandlerUnion<T, E> | undefined,
  event: Parameters<JSX.EventHandler<T, E>>[0],
) {
  if (typeof handler === "function") handler(event);
  else if (handler) handler[0](handler[1], event);
}

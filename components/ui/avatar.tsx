import type { JSX } from "@solidjs/web";
import { cn } from "@/lib/utils";
export function Avatar(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const { class: className, ...rest } = props;
  return (
    <div
      data-slot="avatar"
      class={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...rest}
    />
  );
}
export function AvatarImage(props: JSX.ImgHTMLAttributes<HTMLImageElement>) {
  const { class: className, ...rest } = props;
  return (
    <img
      data-slot="avatar-image"
      class={cn("aspect-square size-full", className)}
      {...rest}
    />
  );
}
export function AvatarFallback(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const { class: className, ...rest } = props;
  return (
    <div
      data-slot="avatar-fallback"
      class={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...rest}
    />
  );
}

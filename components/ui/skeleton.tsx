import type { JSX } from "@solidjs/web";
import { cn } from "@/lib/utils";
export function Skeleton(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const { class: className, ...rest } = props;
  return (
    <div class={cn("animate-pulse rounded-md bg-muted", className)} {...rest} />
  );
}

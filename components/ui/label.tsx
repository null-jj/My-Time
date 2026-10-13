import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);
export function Label(props: JSX.LabelHTMLAttributes<HTMLLabelElement>) {
  const rest = omit(props, "class");
  return <label class={cn(labelVariants(), props.class)} {...rest} />;
}
export { labelVariants };

import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { cn } from "@/lib/utils";
type DivProps = JSX.HTMLAttributes<HTMLDivElement>;
function divWith(classNames: string) {
  return (props: DivProps) => (
    <div class={cn(classNames, props.class)} {...omit(props, "class")} />
  );
}
const Card = divWith("rounded-xl border bg-card text-card-foreground shadow");
const CardHeader = divWith("flex flex-col space-y-1.5 p-6");
const CardTitle = divWith("font-semibold leading-none tracking-tight");
const CardDescription = divWith("text-sm text-muted-foreground");
const CardContent = divWith("p-6 pt-0");
const CardFooter = divWith("flex items-center p-6 pt-0");
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};

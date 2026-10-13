import type { JSX } from "@solidjs/web";

export function LoadingRegion(props: {
  loading: boolean;
  children: JSX.Element;
}) {
  return (
    <div class="contents" aria-busy={props.loading ? "true" : "false"}>
      <fieldset class="contents" disabled={props.loading}>
        <div class="contents" inert={props.loading}>
          {props.children}
        </div>
      </fieldset>
    </div>
  );
}

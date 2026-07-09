import type { Component, JSX } from 'solid-js';

type ToolbarGroupProps = {
  title?: string;
  children: JSX.Element;
};

const ToolbarGroup: Component<ToolbarGroupProps> = (props) => (
  <div class="flex flex-col gap-1">
    {props.title ? (
      <span class="text-xs font-semibold uppercase text-[#6b7a8f]">{props.title}</span>
    ) : null}
    <div class="flex flex-wrap gap-2">{props.children}</div>
  </div>
);

export default ToolbarGroup;

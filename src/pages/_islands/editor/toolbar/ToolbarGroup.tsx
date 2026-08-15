import editorStyles from '@app/styles/editor.module.css';
import type { Component, JSX } from 'solid-js';

type ToolbarGroupProps = {
  title?: string;
  children: JSX.Element;
};

const ToolbarGroup: Component<ToolbarGroupProps> = (props) => (
  <div class={editorStyles.toolbarGroup}>
    {props.title ? (
      <span class={editorStyles.toolbarTitle}>{props.title}</span>
    ) : null}
    <div class={editorStyles.toolbarItems}>{props.children}</div>
  </div>
);

export default ToolbarGroup;

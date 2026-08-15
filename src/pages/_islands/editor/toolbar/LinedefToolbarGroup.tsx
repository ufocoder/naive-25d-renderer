import editorStyles from '@app/styles/editor.module.css';
import type { Component } from 'solid-js';

import ToolbarGroup from './ToolbarGroup';

type LinedefToolbarGroupProps = {
  isAddingLinedef: boolean;
  onAddToggle: () => void;
};

const LinedefToolbarGroup: Component<LinedefToolbarGroupProps> = (props) => (
  <ToolbarGroup>
    <button
      type="button"
      onClick={props.onAddToggle}
      aria-label={props.isAddingLinedef ? 'Отменить добавление linedef' : 'Добавить linedef'}
      title={props.isAddingLinedef ? 'Отменить добавление linedef' : 'Добавить linedef'}
      class={
        props.isAddingLinedef
          ? editorStyles.toolbarToggleButtonActive
          : editorStyles.toolbarToggleButton
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 18 18 6" />
        <circle cx="6" cy="18" r="2.5" fill="white" />
        <circle cx="18" cy="6" r="2.5" fill="white" />
      </svg>
    </button>
  </ToolbarGroup>
);

export default LinedefToolbarGroup;

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
        aria-hidden="true"
      >
        <path d="M6 18 18 6" />
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
      </svg>
    </button>
  </ToolbarGroup>
);

export default LinedefToolbarGroup;

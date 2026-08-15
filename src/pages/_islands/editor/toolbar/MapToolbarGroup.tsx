import editorStyles from '@app/styles/editor.module.css';
import type { Component } from 'solid-js';

import ToolbarGroup from './ToolbarGroup';

type MapToolbarGroupProps = {
  isNavigatingMap: boolean;
  onCenter: () => void;
  onNavigateToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const MapToolbarGroup: Component<MapToolbarGroupProps> = (props) => (
  <ToolbarGroup>
    <button
      type="button"
      onClick={props.onNavigateToggle}
      aria-label={props.isNavigatingMap ? 'Завершить перемещение карты' : 'Перемещать карту'}
      title={props.isNavigatingMap ? 'Завершить перемещение карты' : 'Перемещать карту'}
      class={
        props.isNavigatingMap
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
        <path d="M12 5v14" />
        <path d="M5 12h14" />
        <path d="m10 7 2-2 2 2" />
        <path d="m10 17 2 2 2-2" />
        <path d="m7 10-2 2 2 2" />
        <path d="m17 10 2 2-2 2" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    </button>
    <div class={editorStyles.toolbarSegmented}>
      <button
        type="button"
        onClick={props.onZoomIn}
        class={editorStyles.toolbarIconButton}
        aria-label="Увеличить масштаб"
      >
        +
      </button>
      <button
        type="button"
        onClick={props.onZoomOut}
        class={editorStyles.toolbarIconButton}
        aria-label="Уменьшить масштаб"
      >
        -
      </button>
      <button
        type="button"
        onClick={props.onCenter}
        class={editorStyles.toolbarButton}
      >
        Сбросить
      </button>
    </div>
  </ToolbarGroup>
);

export default MapToolbarGroup;

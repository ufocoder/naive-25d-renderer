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
          ? 'flex size-10 items-center justify-center rounded border border-[#8ea7d5] bg-[#eaf2ff] text-[#1f2a44] transition-colors hover:bg-[#dce9ff]'
          : 'flex size-10 items-center justify-center rounded border border-[#c3d0ea] bg-transparent text-[#1f2a44] transition-colors hover:bg-[#f4f8ff]'
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
    <div class="inline-flex overflow-hidden rounded border border-[#c3d0ea] bg-transparent">
      <button
        type="button"
        onClick={props.onZoomIn}
        class="size-9 border-r border-[#c3d0ea] bg-transparent text-lg font-semibold text-[#1f2a44] transition-colors hover:bg-[#f4f8ff]"
        aria-label="Увеличить масштаб"
      >
        +
      </button>
      <button
        type="button"
        onClick={props.onZoomOut}
        class="size-9 border-r border-[#c3d0ea] bg-transparent text-lg font-semibold text-[#1f2a44] transition-colors hover:bg-[#f4f8ff]"
        aria-label="Уменьшить масштаб"
      >
        -
      </button>
      <button
        type="button"
        onClick={props.onCenter}
        class="bg-transparent px-3 py-2 text-sm font-semibold text-[#1f2a44] transition-colors hover:bg-[#f4f8ff]"
      >
        Сбросить
      </button>
    </div>
  </ToolbarGroup>
);

export default MapToolbarGroup;

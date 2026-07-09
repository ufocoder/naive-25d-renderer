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
        <path d="M6 18 18 6" />
        <circle cx="6" cy="18" r="2.5" fill="white" />
        <circle cx="18" cy="6" r="2.5" fill="white" />
      </svg>
    </button>
  </ToolbarGroup>
);

export default LinedefToolbarGroup;

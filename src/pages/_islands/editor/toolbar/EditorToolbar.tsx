import type { Component } from 'solid-js';

import LinedefToolbarGroup from './LinedefToolbarGroup';
import MapToolbarGroup from './MapToolbarGroup';

type EditorToolbarProps = {
  isAddingLinedef: boolean;
  isNavigatingMap: boolean;
  onAddLinedefToggle: () => void;
  onCenterMap: () => void;
  onNavigateMapToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const EditorToolbar: Component<EditorToolbarProps> = (props) => (
  <div class="flex flex-wrap items-end gap-3">
    <LinedefToolbarGroup
      isAddingLinedef={props.isAddingLinedef}
      onAddToggle={props.onAddLinedefToggle}
    />
    <MapToolbarGroup
      isNavigatingMap={props.isNavigatingMap}
      onCenter={props.onCenterMap}
      onNavigateToggle={props.onNavigateMapToggle}
      onZoomIn={props.onZoomIn}
      onZoomOut={props.onZoomOut}
    />
  </div>
);

export default EditorToolbar;

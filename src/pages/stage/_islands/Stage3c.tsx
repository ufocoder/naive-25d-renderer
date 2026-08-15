import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import render2dStage0 from '@app/stages/Stage0b/render2d';

import settings5 from '@app/stages/Stage3b/settings/sectors.corridor';
import settings4 from '@app/stages/Stage3b/settings/sectors.pyramid';
import settings2 from '@app/stages/Stage3b/settings/single.sector.pyramid';
import settings6 from '@app/stages/Stage3b/settings/single.sector.stairs.a';
import settings7 from '@app/stages/Stage3b/settings/single.sector.stairs.b';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { useBspTree } from '@app/stages/Stage3b/hooks/useBspTree';
import createRender2d from '@app/stages/Stage3c/renderBSP';

const settingsSet = [
  settings2,
  settings4,
  settings5,
  settings6,
  settings7,
]

interface RowProps {
  settings: Settings,
  scale?: number;
}

const Row: Component<RowProps> = ({ settings: defaultSettings }) => {
  const [settings] = createSignal<Settings>(defaultSettings);
  const bspTree = useBspTree({ settings });

  return (
    <div class={stageStyles.wideResponsiveGrid}>
      <div class={stageStyles.demoItem}>
        <h2 class={stageStyles.hiddenMobileTitle}>2.5D Renderer</h2>
        <Canvas
          width={400}
          height={400}
          settings={settings}
          render={render2dStage0}
          className={stageStyles.previewImage}
        />
      </div>
      <div class={stageStyles.demoItem}>
        <h2 class={stageStyles.hiddenMobileTitle}>2D Renderer</h2>
        <Canvas
          width={400}
          height={400}
          settings={settings}
          render={createRender2d(bspTree())}
          className={stageStyles.previewImage}
        />
      </div>
    </div>
  );
};

const Stage: Component = () => {
  return (
    <div class={stageStyles.responsiveStack}>
      <div class={stageStyles.desktopOnlyGrid}>
        <h2 class={stageStyles.centeredTitle}>2.5D Renderer</h2>
        <h2 class={stageStyles.centeredTitle}>2D Renderer</h2>
      </div>
      {settingsSet.map((settings) => (
        <Row settings={settings} />
      ))}
    </div>
  );
};

export default Stage;

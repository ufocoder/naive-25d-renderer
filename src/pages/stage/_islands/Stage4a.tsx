import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from "@app/components/Map2d";
import { useBspTree } from "@app/stages/Stage3b/hooks/useBspTree";
import type { Component } from "solid-js";
import { createSignal } from "solid-js";
import render2d from "@app/stages/Stage0b/render2d";
import { useCameraControlsV2 } from "@app/stages/Stage4a/hooks/useCameraControls";
import { createRender25d } from "@app/stages/Stage4a/render25d";
import defaultSettings from "@app/stages/Stage4a/settings";

const Stage: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);
  const bspTree = useBspTree({ settings });

  useCameraControlsV2({ settings, setSettings, bspTree: bspTree() });

  return (
    <div class={content.contentSection}>
      <div class={stageStyles.demoGrid}>
        <div class={stageStyles.demoColumn}>
          <h2 class={stageStyles.demoTitle}>2.5D Renderer</h2>
          <div class={stageStyles.centered}>
            <Canvas
              settings={settings}
              width={settings().camera.screen.width}
              height={settings().camera.screen.height}
              render={createRender25d({ bspTree: bspTree() })}
            />
          </div>
        </div>
        <div class={stageStyles.demoColumn}>
          <h2 class={stageStyles.demoTitle}>2D Renderer</h2>
          <div class={stageStyles.centered}>
            <Map2d
              withZoom
              initialZoom={0.5}
              initialOffsetX={20}
              initialOffsetY={50}
              settings={settings}
              render={render2d}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stage;

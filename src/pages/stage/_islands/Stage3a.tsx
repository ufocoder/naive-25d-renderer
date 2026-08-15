import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import { useCameraControls } from "@app/hooks/useCameraControls";
import render2dStage0 from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import render2dStage2j from '@app/stages/Stage2j/render25d';

import Map2d from "@app/components/Map2d";
import defaultSettings1 from '@app/stages/Stage3a/settings';
import defaultSettings2 from '@app/stages/Stage3a/settings2';

interface StageProps {
  part?: number;
}

const Stage: Component<StageProps> = (props) => {
  const [settings1, setSettings1] = createSignal<Settings>(defaultSettings1);
  const [settings2, setSettings2] = createSignal<Settings>(defaultSettings2);

  useCameraControls<Settings>({ settings: settings1, setSettings: setSettings1 });
  useCameraControls<Settings>({ settings: settings2, setSettings: setSettings2 });

  const renderPart = (part: number) => {
    switch (part) {
      case 0:
        return (
          <>
            <div class={stageStyles.demoGridWithSpacing}>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2.5D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Canvas
                    settings={settings1}
                    width={settings1().camera.screen.width}
                    height={settings1().camera.screen.height}
                    render={render2dStage2j}
                  />
                </div>
              </div>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Map2d
                    initialZoom={0.6}
                    initialOffsetX={75}
                    initialOffsetY={50}
                    withControls
                    width={400}
                    height={320}
                    settings={settings1}
                    render={render2dStage0}
                  />
                </div>
              </div>
            </div>
          </>
        );
      case 1:
        return (
          <>
            <div class={stageStyles.demoGridWithSpacing}>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2.5D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Canvas
                    settings={settings2}
                    width={settings2().camera.screen.width}
                    height={settings2().camera.screen.height}
                    render={render2dStage2j}
                  />
                </div>
              </div>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Map2d
                    initialZoom={0.6}
                    initialOffsetX={75}
                    initialOffsetY={50}
                    withControls
                    width={400}
                    height={320}
                    settings={settings2}
                    render={render2dStage0}
                  />
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div class={content.contentSection}>
      {renderPart(props.part ?? 0)}
    </div>
  );
};

export default Stage;
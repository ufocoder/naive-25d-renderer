import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import { useCameraControls } from '@app/hooks/useCameraControls';
import render2d from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import render25dStage1d1 from '@app/stages/Stage1d1/render25d';
import render25dStage1d2 from '@app/stages/Stage1d2/render25d';
import defaultSettings from '@app/stages/Stage1d2/settings';

interface StageProps {
  part?: number;
}

const Stage: Component<StageProps> = (props) => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);

  useCameraControls<Settings>({ settings, setSettings });

  const renderPart = (part: number) => {
    switch (part) {
      case 0:
        return (
          <>
            <div class={stageStyles.threeColumnDemo}>
              <div>
                <h4 class={stageStyles.demoTitleSmall}>
                  2.5D Renderer (not fixed)
                </h4>
                <Canvas
                  className={stageStyles.fullWidth}
                  settings={settings}
                  width={settings().camera.screen.width}
                  height={settings().camera.screen.height}
                  render={render25dStage1d1}
                />
              </div>
              <div>
                <h4 class={stageStyles.demoTitleSmall}>
                  2D Renderer
                </h4>
                <Map2d
                  withControls
                  canvasClassName={stageStyles.fullWidth}
                  width={settings().camera.screen.width}
                  height={settings().camera.screen.height}
                  settings={settings}
                  render={render2d}
                />
              </div>
              <div>
                <h4 class={stageStyles.demoTitleSmall}>
                  2.5D Renderer (fixed)
                </h4>
                <Canvas
                  className={stageStyles.fullWidth}
                  settings={settings}
                  width={settings().camera.screen.width}
                  height={settings().camera.screen.height}
                  render={render25dStage1d2}
                />
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

import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import { useCameraControls } from '@app/hooks/useCameraControls';
import render2d from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { createRender25d } from '@app/stages/Stage1c/render25d';
import render25d from '@app/stages/Stage1d2/render25d';
import defaultSettings from '@app/stages/Stage1d3/settings';

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
                  Пропуск стен
                </h4>
                <Canvas
                  className={stageStyles.fullWidth}
                  settings={settings}
                  width={settings().camera.screen.width}
                  height={settings().camera.screen.height}
                  render={createRender25d({ withFix: true })}
                />
              </div>
              <div>
                <h4 class={stageStyles.demoTitleSmall}>
                  Вид сверху
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
                  Отсечение стен
                </h4>
                <Canvas
                  className={stageStyles.fullWidth}
                  settings={settings}
                  width={settings().camera.screen.width}
                  height={settings().camera.screen.height}
                  render={render25d}
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

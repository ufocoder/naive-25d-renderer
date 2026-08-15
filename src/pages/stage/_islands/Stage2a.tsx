import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import render2d from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import render25dLinedef from '@app/stages/Stage2a/render25dLinedef';
import render25dSector from '@app/stages/Stage2a/render25dSector';
import defaultSettings from '@app/stages/Stage2a/settings';

interface StageProps {
  part?: number;
}

const Stage: Component<StageProps> = (props) => {
  const [settings] = createSignal<Settings>(defaultSettings);

  const renderPart = (part: number) => {
    switch (part) {
      case 0:
        return (
          <>
            <div class={stageStyles.threeColumnDemo}>
              <div>
                <h4 class={stageStyles.demoTitleSmall}>
                  Уровень на основе линий
                </h4>
                <Canvas
                  className={stageStyles.fullWidth}
                  settings={settings}
                  width={settings().camera.screen.width}
                  height={settings().camera.screen.height}
                  render={render25dLinedef}
                />
              </div>
              <div>
                <h4 class={stageStyles.demoTitleSmall}>
                  Вид сверху
                </h4>
                <Map2d
                  canvasClassName={stageStyles.fullWidth}
                  width={settings().camera.screen.width}
                  height={settings().camera.screen.height}
                  settings={settings}
                  render={render2d}
                />
              </div>
              <div>
                <h4 class={stageStyles.demoTitleSmall}>
                  Уровень на основе секторов
                </h4>
                <Canvas
                  className={stageStyles.fullWidth}
                  settings={settings}
                  width={settings().camera.screen.width}
                  height={settings().camera.screen.height}
                  render={render25dSector}
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

import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import { useCameraControls } from '@app/hooks/useCameraControls';
import render2dStage0 from '@app/stages/Stage0b/render2d';
import render25d from '@app/stages/Stage3d/render25d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import defaultSettings from '@app/stages/Stage3g/settings';

interface StageProps {
  part?: number;
}

const Stage: Component<StageProps> = (props) => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);

  useCameraControls<Settings>({ settings, setSettings, withVertical: true });

  const renderPart = (part: number) => {
    switch (part) {
      case 0:
        return (
          <>
            <div class={stageStyles.demoGrid}>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2.5D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Canvas
                    settings={settings}
                    width={settings().camera.screen.width}
                    height={settings().camera.screen.height}
                    render={render25d}
                  />
                </div>
              </div>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Map2d
                    withControls
                    withVertical
                    width={400}
                    height={320}
                    settings={settings}
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
import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import { useCameraControls } from '@app/hooks/useCameraControls';
import render2d from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import render25d from '@app/stages/Stage2i/render25d';
import defaultSettings from '@app/stages/Stage2i/settings';

const Stage: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);

  useCameraControls<Settings>({ settings, setSettings });

  return (
          <div class={content.contentSection}>
            <div class={stageStyles.demoGridWithSpacing}>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>2.5D Renderer</h2>
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
                <h2 class={stageStyles.demoTitle}>2D Renderer</h2>
                <div class={stageStyles.centered}>
                  <Map2d
              initialZoom={0.8}
              initialOffsetX={0}
              initialOffsetY={80}
              withControls
              width={400}
              height={320}
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
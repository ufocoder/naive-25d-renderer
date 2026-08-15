import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import { useAnimationValue } from '@app/hooks/useAnimationValue';
import { useCameraControls } from '@app/hooks/useCameraControls';
import render2d from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createEffect, createSignal } from 'solid-js';
import render25d from '@app/stages/Stage2j/render25d';
import defaultSettings from '@app/stages/Stage2k/settings';

const Stage: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);

  useCameraControls<Settings>({ settings, setSettings });

  const { percent, startAnimation, stopAnimation } = useAnimationValue({ duration: 2_000, loop: true });

  createEffect(() => {
    const z = 10_000 * percent();
    setSettings(prevSettings => ({
      ...prevSettings,
      camera: {
        ...prevSettings.camera,
        z
      }
    }))
  })

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
        render={render25d}
      />
          </div>
          <div class={stageStyles.buttonRow}>
            <button
              type="button"
              class={stageStyles.primaryActionButton}
              onClick={() => startAnimation()}
            >
              play camera Z axis animation
            </button>
            <button
              type="button"
              class={stageStyles.primaryActionButton}
              onClick={() => stopAnimation()}
            >
              stop camera Z axis animation
            </button>
          </div>
        </div>
        <div class={stageStyles.demoColumn}>
          <h2 class={stageStyles.demoTitle}>2D Renderer</h2>
          <div class={stageStyles.centered}>
            <Map2d
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

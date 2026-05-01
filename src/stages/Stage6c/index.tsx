import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { useCameraControls } from '@app/hooks/useCameraControls';
import Canvas from "@app/components/Canvas";
import { create2dRender as create2dRenderStage1 } from '../Stage1a/render2d';
import { create2dRender as create2dRenderStage6 } from '../Stage6a/render2d';
import render25d from './render25d';
import defaultSettings from './settings';
import KeyboardControls from '@app/components/Controls';

const Stage5: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);

  useCameraControls<Settings>({ settings, setSettings });

  return (
    <section class="flex flex-col gap-4">

      <div class="grid grid-cols-2 gap-4">
        <div class="mt-4 flex flex-col">
          <h2 class="text-2xl">2.5D Renderer</h2>
        </div>
        <div class="mb-2 mt-4">
          <h2 class="text-2xl">2D Renderer</h2>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-4">
          <h4 class="text">BSP</h4>
            <Canvas
              settings={settings}
              width={settings().camera.screen.width}
              height={settings().camera.screen.height}
              render={render25d}
            />
        </div>
        <div>
          <Canvas
            width={400}
            height={320}
            settings={settings}
            render={create2dRenderStage1({ scale: 0.75 })} />
          <KeyboardControls />

          <Canvas
            width={400}
            height={320}
            settings={settings}
            render={create2dRenderStage6({ scale: 0.75 })} />
          <KeyboardControls />
        </div>
      </div>
    </section>
  );
};

export default Stage5;
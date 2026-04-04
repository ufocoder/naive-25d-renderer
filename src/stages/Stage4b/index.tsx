import { createEffect, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { useCameraControls } from '@app/hooks/useCameraControls';
import Canvas from "@app/components/Canvas";
import render2d from '@app/stages/Stage1a/render2d';
import render25d from '../Stage4a/render25d';
import defaultSettings from './settings';
import { processLevel } from './utils';

const Stage3: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);
  const [settings2, setSettings2] = createSignal<Settings>(processLevel(settings()));
  
  createEffect(() => {
    setSettings2(processLevel(settings()));
  });

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
          <h4 class="text">Painter algo</h4>
           <Canvas
            settings={settings}
            width={settings().camera.screen.width}
            height={settings().camera.screen.height}
            render={render25d}
          />
          <h4 class="text">Split linedef</h4>
           <Canvas
            settings={settings2}
            width={settings2().camera.screen.width}
            height={settings2().camera.screen.height}
            render={render25d}
          />
        </div>
        <Canvas
          width={400}
          height={320}
          settings={settings}
          render={render2d} />
      </div>
    </section>
  );
};

export default Stage3;

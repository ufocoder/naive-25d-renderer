import { createEffect, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { useCameraControls } from '@app/hooks/useCameraControls';
import Canvas from "@app/components/Canvas";
import { create2dRender } from '@app/stages/Stage1a/render2d';
import defaultSettings from './settings';
import render25d from './render25d';
import KeyboardControls from '@app/components/Controls';
import { useAnimationValue } from '@app/hooks/useAnimationValue';

const Stage5: Component = () => {
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
          <h4 class="text">Сектора с высотой пола и потолка</h4>
           <Canvas
            settings={settings}
            width={settings().camera.screen.width}
            height={settings().camera.screen.height}
            render={render25d}
          />

          <button class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 border border-blue-700" onClick={() => startAnimation()}>play camera Z axis animation</button>
          <button class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 border border-blue-700" onClick={() => stopAnimation()}>stop camera Z axis animation</button>
          
        </div>
        <div>
          <Canvas
            width={400}
            height={320}
            settings={settings}
            render={create2dRender({ scale: 0.5 })} />
          <KeyboardControls />
        </div>
      </div>
    </section>
  );
};

export default Stage5;
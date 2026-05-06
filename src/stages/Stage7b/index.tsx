import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { useCameraControlsV3 } from './hooks/useCameraControls';
import Canvas from "@app/components/Canvas";
import { createRender25d } from '../Stage7a/render25d';
import defaultSettings from './settings';
import KeyboardControls from '@app/components/Controls';
import { useBspTree } from '@app/hooks/useBspTree';
import { create2dRenderMap } from '../Stage7a/render2dmap';
import { create2dRenderBsp } from '../Stage7a/render2dbsp';


const Stage5: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);
  const bspTree = useBspTree({ settings });

  useCameraControlsV3({ settings, setSettings, bspTree: bspTree() });

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
              render={createRender25d({ bspTree: bspTree() })}
            />
        </div>
        <div>
          <Canvas
            width={400}
            height={320}
            settings={settings}
            render={create2dRenderMap({ scale: 0.5 })} />
          <KeyboardControls withVertical />
          <Canvas
            width={400}
            height={320}
            settings={settings}
            render={create2dRenderBsp({ bspTree: bspTree(), scale: 0.5 })} />
        </div>
      </div>
    </section>
  );
};

export default Stage5;
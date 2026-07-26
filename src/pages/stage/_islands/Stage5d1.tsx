import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from "@app/components/Map2d";
import { useBspTree } from '@app/stages/Stage3b/hooks/useBspTree';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import render2d from '@app/stages/Stage0b/render2d';
import { createRender25d } from '@app/stages/Stage5d1/render25d';
import defaultSettings from '@app/stages/Stage5d1/settings';
import { useCameraControlsV3 } from '@app/stages/Stage4b/hooks/useCameraControls';

const Stage: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);
  const bspTree = useBspTree({ settings });

  useCameraControlsV3({ settings, setSettings, bspTree: bspTree() });

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col justify-center gap-6 md:grid md:grid-cols-2 md:gap-4 md:items-start justify-items">
        <div class="flex flex-col gap-2">
          <h2 class="flex justify-center text-2xl">2.5D Renderer</h2>
          <div class="flex justify-center">
            <Canvas
              settings={settings}
              width={settings().camera.screen.width}
              height={settings().camera.screen.height}
              render={createRender25d({ bspTree: bspTree() })}
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h2 class="flex justify-center text-2xl">2D Renderer</h2>
          <div class="flex justify-center">
            <Map2d
              withControls
              withVertical
              initialZoom={50}
              initialOffsetX={50}
              initialOffsetY={50}
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

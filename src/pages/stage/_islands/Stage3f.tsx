import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import { useCameraControls } from '@app/hooks/useCameraControls';
import render2d from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import render25d from '@app/stages/Stage3f/render25d';
import defaultSettings from '@app/stages/Stage3f/settings';

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
            <div class="flex flex-col justify-center gap-6 md:grid md:grid-cols-2 md:gap-4 md:items-start justify-items">
              <div class="flex flex-col gap-2">
                <h2 class="flex justify-center text-2xl">
                  2.5D Renderer
                </h2>
                <div class="flex justify-center">
                  <Canvas
                    width={400}
                    height={320}
                    settings={settings}
                    render={render25d}
                  />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <h2 class="flex justify-center text-2xl">
                  2D Renderer
                </h2>
                <div class="flex justify-center">
                  <Map2d
                    withControls
                    initialZoom={0.8}
                    initialOffsetY={90}
                    width={400}
                    height={320}
                    settings={settings}
                    render={render2d}
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
    <div class="flex flex-col gap-4">
      {renderPart(props.part ?? 0)}
    </div>
  );
};

export default Stage;
import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { useCameraControls } from '@app/hooks/useCameraControls';
import Canvas from "@app/components/Canvas";
import render2d from '@app/stages/Stage1a/render2d';
import { createRender25d } from './render25d';
import defaultSettings from './settings';
import KeyboardControls from '@app/components/Controls';
import Content from '@app/components/Сontent';
import { PROJECT_REPO_URL } from '@app/config/repo';
import { Formula } from '@app/components/Formula';


const Stage: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);

  useCameraControls<Settings>({ settings, setSettings });

  return (
    <section class="flex flex-col gap-4">
      <div class="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-4 md:items-start">
        
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl">2.5D Renderer</h2>
          <p class="my-2">Вычисление высоты не зависит от угла относительно камеры</p>
          <div class="inline-block my-2">
            <Canvas
              settings={settings}
              width={settings().camera.screen.width}
              height={settings().camera.screen.height}
              render={createRender25d({ withFix: false })}
            />
          </div>
          <p class="my-2">Необходимо исправить вычисление высоты</p>
          <div class="inline-block my-2">
            <Canvas
              settings={settings}
              width={settings().camera.screen.width}
              height={settings().camera.screen.height}
              render={createRender25d({ withFix: true })}
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <h2 class="text-2xl">2D Renderer</h2>
          <KeyboardControls />
          <div class="inline-block">
            <Canvas
              width={400}
              height={320}
              settings={settings}
              render={render2d}
            />
          </div>
          
          <Content class="my-2">
            <p class="py-2">
              относительный угол между направлением камеры и направлением на вершину:
            </p>
            <Formula latex="\theta_{\text{rel}} = \theta_{\text{vertex}} - \theta_{\text{camera}}" />

            <p class="py-2">
              Проекционное расстояние (с учётом угла обзора):
            </p>
            <Formula latex="d_{\text{proj}} = d \cdot \cos(\theta_{\text{rel}})" />
          </Content>

          <p class="my-2">
            <a href={`${PROJECT_REPO_URL}/stages/Stage2/render25d.ts`} class="underline" target="_blank">Реализация шага на github</a>
          </p>
        </div>

      </div>
    </section>
  );
};

export default Stage;

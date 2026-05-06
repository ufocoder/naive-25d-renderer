import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { useCameraControls } from '@app/hooks/useCameraControls';
import Canvas from "@app/components/Canvas";
import render2d from './render2d';
import render25d from './render25d';
import defaultSettings from './settings';
import KeyboardControls from '@app/components/Controls';
import Content from '@app/components/Сontent';
import { Formula } from '@app/components/Formula';
import RepoLink from '@app/components/RepoLink';


const Stage: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);

  useCameraControls<Settings>({ settings, setSettings });

  return (
    <section class="flex flex-col gap-4">
      <div class="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-4 md:items-start">
        
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl">2.5D Renderer</h2>
          <p class="my-2">Проекция вершины на камеру в виде вертикальной линии</p>
          <div class="inline-block">
            <Canvas
              settings={settings}
              width={settings().camera.screen.width}
              height={settings().camera.screen.height}
              render={render25d}
            />
          </div>
          <Content class="my-2">
            Вычисляем угол между направлением камеры и вершиной на карте:

            <Formula latex="\theta_v = \operatorname{arctan2}(\Delta y, \Delta x) \cdot \frac{180}{\pi}" />

            Если угол входит в поле обзора камеры, мы линейно преобразуем его относительное положение внутри FOV в координату X на экране:

            <Formula latex="\theta_{\min} = \theta_{\text{cam}} - \frac{\theta_{\text{fov}}}{2}" />
            <Formula latex="\text{screenX} = \frac{\theta_v - \theta_{\text{min}}}{\theta_{\text{fov}}} \cdot W" /> 
          </Content>
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
            <Content class="my-2">
              Используемые обозначения:

              <Formula latex="\theta_{\text{fov}} \text{ — угол поля обзора камеры (FOV)}" />
              <Formula latex="\theta_v \text{ — угол между камерой и вершиной:}" />
              <Formula latex="\theta_{\min} \text{ — левая граница поля обзора}" />
              <Formula latex="W \text{ — ширина экрана в пикселях}" />

            </Content>
            <p class="my-2">
              <RepoLink filePath="stages/Stage1a/render25d.ts">Реализация шага на github</RepoLink>
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Stage;
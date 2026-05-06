import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import { useCameraControls } from '@app/hooks/useCameraControls';
import Canvas from "@app/components/Canvas";
import render2d from '@app/stages/Stage1a/render2d';
import render25d from './render25d';
import defaultSettings from './settings';
import KeyboardControls from '@app/components/Controls';
import { Formula } from '@app/components/Formula';
import Content from '@app/components/Сontent';
import { PROJECT_REPO_URL } from '@app/config/repo';


const Stage: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(defaultSettings);

  useCameraControls<Settings>({ settings, setSettings });

  return (
    <section class="flex flex-col gap-4">
      <div class="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-4 md:items-start">
        
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl">2.5D Renderer</h2>
          <p class="my-2">Преобразование спроецированных точек в координаты многоугольника</p>
          <div class="inline-block">
            <Canvas
              settings={settings}
              width={settings().camera.screen.width}
              height={settings().camera.screen.height}
              render={render25d}
            />
          </div>
          <Content class="my-2">
            <p class="py-2">
              Угол между двумя точками:
            </p>
            <Formula latex="\theta = \text{atan2}(\Delta y, \Delta x)" />

            <p class="py-2">
              Расстояние между двумя точками:
            </p>
            <Formula latex="d = \sqrt{\Delta x^2 + \Delta y^2}" />

            <p class="py-2">
              Проекционное расстояние (с учётом угла обзора):
            </p>
            <Formula latex="d_{\text{proj}} = d \cdot \cos(\theta_{\text{rel}})" />

            <p class="py-2">
              Высота стены на экране
            </p>
            <Formula latex="h = \frac{H_{\text{wall}}}{d_{\text{proj}}}" />
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
          </div>
          <p>
            Алгоритм работы:
          </p>
          <p>
            1 Для каждого отрезка стены (linedef) вычисляется угол и расстояние от камеры до его концов.
          </p>
          <p>
            2. Проекция на экран учитывает только горизонтальную плоскость — высота стены обратно пропорциональна расстоянию.
          </p>
          <p>
            3. Стены, выходящие за пределы поля зрения (FOV), отбрасываются.
          </p>
          <p>
            4. Для видимых стен строится четырёхугольник (трапеция) и заливается цветом.
          </p>
          <p class="my-2">
            <a href={`${PROJECT_REPO_URL}/stages/Stage1b/render25d.ts`} class="underline" target="_blank">Реализация шага на github</a>
          </p>
        </div>

      </div>
    </section>
  );
};

export default Stage;

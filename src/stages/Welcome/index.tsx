import type { Component } from 'solid-js';
import Code from '@app/components/Code';

const codeLinedefs = `
  interface Vertex {
    x: number;
    y: number;
  }

  interface Linedef {
    start: Vertex;
    end: Vertex;
  }

  interface Angle {
    degrees: number;
  }

  interface Camera {
    x: number;
    y: number;
    fov: Angle;
    screen: {
      width: number;
    }
  }

`;

const Stage: Component = () => {
  return (
    <section class="flex flex-col gap-4">
      <div class="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-4 md:items-start">
        
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl">2.5D Renderer</h2>
          <p class="my-2">
            Это моя попытка с нуля воссоздать рендер как из <a class="link underline" href="https://en.wikipedia.org/wiki/Doom_(1993_video_game)" target="_blank">DOOM 1993</a>
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <h2 class="text-2xl">Базовые типы</h2>

          <Code code={codeLinedefs} class="my-2" lang='ts' />
          
        </div>

      </div>
    </section>
  );
};

export default Stage;
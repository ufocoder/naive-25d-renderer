import {
  type Component,
  type Accessor,
  onMount,
  createEffect,
} from "solid-js";


interface RendererProps {
  render: (ctx: CanvasRenderingContext2D, settings: Settings) => void;
  settings: Accessor<Settings>;
  width?: number;
  height?: number;
  class?: string;
}

const Renderer: Component<RendererProps> = ({ width, height, render, settings }) => {
  let refContainer: HTMLCanvasElement | undefined;

  const tick = () => {
    const el = refContainer;
    if (!el) {
      return;
    }

    const ctx = el.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, el.width, el.height);

    render(ctx, settings());
  };

  onMount(() => {
    tick();
  });

  createEffect(() => {
    tick();
  });

  return (
    <canvas
      ref={(canvas) => {
        refContainer = canvas;
      }}
      width={width}
      height={height}
      class="border border-gray-300"
    />
  );
};

export default Renderer;

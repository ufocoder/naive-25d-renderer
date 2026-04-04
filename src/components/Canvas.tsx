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
  let refContainer: HTMLCanvasElement;

  const tick = () => {
    if (!refContainer!) {
      return;
    }

    const ctx = refContainer.getContext('2d')!

    ctx.clearRect(0, 0, refContainer.width, refContainer.height);

    render(ctx, settings())
  };

  onMount(() => {
    tick();
  });

  createEffect(() => {
    tick();
  });

  return (
    <canvas ref={refContainer!} width={width} height={height} class="border border-gray-300" />
  );
};

export default Renderer;

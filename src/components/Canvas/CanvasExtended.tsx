import canvasStyles from '@app/styles/canvas.module.css';
import { type Accessor, type Component, createEffect } from "solid-js";

export interface RendererProps {
  render: (ctx: CanvasRenderingContext2D, settings: Settings, scale: number, offsetX: number, offsetY: number) => void | Promise<void>;
  settings: Accessor<Settings>;
  scale: Accessor<number>;
  offsetX: Accessor<number>;
  offsetY: Accessor<number>;
  width?: number;
  height?: number;
  className?: string;
  translateToCenter?: boolean;
}

const Renderer: Component<RendererProps> = ({ 
  className = '',
  width = 400, 
  height = 320, 
  render, 
  settings,
  scale,
  offsetX,
  offsetY,
}) => {
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

    ctx.save();
    ctx.clearRect(0, 0, el.width, el.height);

    render(ctx, settings(), scale(), offsetX(), offsetY());
  };

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
      class={`${canvasStyles.canvasSurface} ${className}`}
    />
  );
};

export default Renderer;

import canvasStyles from '@app/styles/canvas.module.css';
import { type Accessor, type Component, createEffect } from "solid-js";

export interface RendererProps {
  render: (buffer: ImageData, settings: Settings, ...rest: any) => void | Promise<void>;
  settings: Accessor<Settings>;
  width?: number;
  height?: number;
  className?: string;
}

const Renderer: Component<RendererProps> = ({
  className = '',
  width = 400,
  height = 320,
  render,
  settings,
}) => {
  let refContainer: HTMLCanvasElement | undefined;
  let imageData: ImageData | undefined;

  const updateCanvas = () => {
    const el = refContainer;
    if (!el || !imageData) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    ctx.putImageData(imageData, 0, 0);
  };

  const tick = () => {
    const el = refContainer;
    if (!el) return;

    const ctx = el.getContext("2d");
    if (!ctx) return;

    if (!imageData) {
      imageData = ctx.createImageData(width, height);
    } else if (imageData.width !== width || imageData.height !== height) {
      imageData = ctx.createImageData(width, height);
    }

    render(imageData, settings());

    updateCanvas();
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

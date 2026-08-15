import mapStyles from '@app/styles/map.module.css';
import Canvas, { type RendererProps } from "@app/components/Canvas/CanvasExtended";
import { createSignal, onCleanup } from "solid-js";
import KeyboardControls, { type KeyboardControlsProps } from "./Controls";

type Map2dProps = KeyboardControlsProps & Pick<RendererProps, 'render' | 'settings' | 'width' | 'height'> & {
  withControls?: boolean;
  withDebug?: boolean;
  withZoom?: boolean;
  withGrid?: boolean;
  initialZoom?: number;
  initialOffsetX?: number;
  initialOffsetY?: number;
  canvasClassName?: string;
};

const MIN_SCALE = 0.125;
const MAX_SCALE = 16;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 320;

export default function Map2d({
  withVertical,
  withControls,
  withZoom,
  withDebug,
  canvasClassName,
  settings,
  render,
  initialZoom = 1,
  initialOffsetX = 0,
  initialOffsetY = 0,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
}: Map2dProps) {
  const [scale, setScale] = createSignal(initialZoom);
  const [offsetX, setOffsetX] = createSignal(initialOffsetX);
  const [offsetY, setOffsetY] = createSignal(initialOffsetY);

  let containerRef: HTMLDivElement | null = null;
  const [isPanning, setIsPanning] = createSignal(false);
  const [lastPointerX, setLastPointerX] = createSignal(0);
  const [lastPointerY, setLastPointerY] = createSignal(0);
  const [lastOffsetX, setLastOffsetX] = createSignal(0);
  const [lastOffsetY, setLastOffsetY] = createSignal(0);

  const handleZoomIn = () => {
    const newScale = Math.min(scale() * 2, MAX_SCALE);
    const scaleFactor = newScale / scale();

    // Центрируем зум относительно центра canvas
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setOffsetX(prev => centerX - (centerX - prev) * scaleFactor);
      setOffsetY(prev => centerY - (centerY - prev) * scaleFactor);
    }

    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale() / 2, MIN_SCALE);
    const scaleFactor = newScale / scale();

    // Центрируем зум относительно центра canvas
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setOffsetX(prev => centerX - (centerX - prev) * scaleFactor);
      setOffsetY(prev => centerY - (centerY - prev) * scaleFactor);
    }

    setScale(newScale);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button === 0 || e.pointerType === 'touch') {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setIsPanning(true);
      setLastPointerX(e.clientX);
      setLastPointerY(e.clientY);
      setLastOffsetX(offsetX());
      setLastOffsetY(offsetY());
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isPanning()) {
      e.preventDefault();

      const deltaX = e.clientX - lastPointerX();
      const deltaY = e.clientY - lastPointerY();

      setOffsetX(lastOffsetX() + deltaX);
      setOffsetY(lastOffsetY() + deltaY);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (isPanning()) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setIsPanning(false);
    }
  };

  const handlePointerCancel = (_: PointerEvent) => {
    setIsPanning(false);
  };

  const handleWheel = (e: WheelEvent) => {
    if (withZoom && containerRef) {
      e.preventDefault();

      const rect = containerRef.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale() * delta, MIN_SCALE), MAX_SCALE);
      const scaleFactor = newScale / scale();

      setOffsetX(prev => mouseX - (mouseX - prev) * scaleFactor);
      setOffsetY(prev => mouseY - (mouseY - prev) * scaleFactor);
      setScale(newScale);
    }
  };

  onCleanup(() => {
    if (containerRef) {
      containerRef.style.touchAction = '';
      containerRef.removeEventListener('wheel', handleWheel);
    }
  });

  return (
    <div class={mapStyles.mapShell}>
      <div class={mapStyles.mapCanvasWrap}>
        <div
          ref={(ref) => {
            containerRef = ref;
            if (ref) {
              ref.addEventListener('wheel', handleWheel, { passive: false });
            }
          }}
          class={mapStyles.mapCanvasFrame}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{
            width: `${width || settings().camera.screen.width}px`,
            cursor: isPanning() ? 'grabbing' : 'grab',
            'user-select': 'none',
            'touch-action': 'none'
          }}
        >
          <Canvas
            className={`${mapStyles.mapCanvasImage} ${canvasClassName ?? ''}`}
            width={width || settings().camera.screen.width}
            height={height || settings().camera.screen.height}
            scale={scale}
            offsetX={offsetX}
            offsetY={offsetY}
            settings={settings}
            render={render}
            translateToCenter
          />
          {withZoom && (
            <div
              class={mapStyles.mapOverlayActions}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerMove={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              style={{ cursor: 'default' }}
            >
              <button
                type="button"
                onClick={handleZoomIn}
                class={mapStyles.mapIconButton}
              >
                +
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                class={mapStyles.mapIconButton}
              >
                -
              </button>
            </div>
          )}
        </div>
      </div>
      {withControls &&(
        <div class={mapStyles.mapStatus}>
          <KeyboardControls withVertical={withVertical} />
        </div>
      )}
      {withDebug && (
        <div class={mapStyles.mapStatusText}>
          Координаты {settings().camera.x.toFixed(2)} x {settings().camera.y.toFixed(2)}, угол {settings().camera.angle.degrees} <br />
        </div>
      )}
    </div>
  );
}

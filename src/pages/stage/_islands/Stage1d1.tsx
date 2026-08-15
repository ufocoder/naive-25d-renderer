import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import { useCameraControls } from '@app/hooks/useCameraControls';
import render2d from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import render25d from '@app/stages/Stage1d1/render25d';
import defaultSettings from '@app/stages/Stage1d1/settings';

type AngleRangeCase = {
  title: string;
  linedefFrom: number;
  linedefTo: number;
};

const angleRangeCases: AngleRangeCase[] = [
  {
    title: 'Отрезок полностью в FOV',
    linedefFrom: -22,
    linedefTo: 20,
  },
  {
    title: 'Отрезок вне FOV',
    linedefFrom: 52,
    linedefTo: 92,
  },
  {
    title: 'Отрезок пересекает один край FOV',
    linedefFrom: -52,
    linedefTo: 12,
  },
  {
    title: 'Отрезок пересекает оба края FOV',
    linedefFrom: -62,
    linedefTo: 62,
  },
];

const cameraRange = {
  from: -34,
  to: 34,
};

const ANGLE_ROTATION = -90;

function toRadians(degrees: number) {
  return degrees * Math.PI / 180;
}

function toCanvasRadians(degrees: number) {
  return toRadians(degrees + ANGLE_ROTATION);
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  from: number,
  to: number,
  color: string,
  lineWidth = 7,
) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.arc(x, y, radius, toCanvasRadians(from), toCanvasRadians(to));
  ctx.stroke();
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const gridSize = 40;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAngleLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  angle: number,
  color: string,
  dashed = false,
) {
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [5, 5] : []);
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + Math.cos(toCanvasRadians(angle)) * radius,
    y + Math.sin(toCanvasRadians(angle)) * radius,
  );
  ctx.stroke();
  ctx.restore();
}

function drawAngleRangeLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  from: number,
  to: number,
) {
  ctx.save();
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(
    x + Math.cos(toCanvasRadians(from)) * radius,
    y + Math.sin(toCanvasRadians(from)) * radius,
  );
  ctx.lineTo(
    x + Math.cos(toCanvasRadians(to)) * radius,
    y + Math.sin(toCanvasRadians(to)) * radius,
  );
  ctx.stroke();
  ctx.restore();
}

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAngleRangeCase(item: AngleRangeCase) {
  return (ctx: CanvasRenderingContext2D) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = 220;
    const radius = 104;

    drawGrid(ctx);

    ctx.save();
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, ctx.canvas.height);
    ctx.stroke();
    ctx.restore();

    drawAngleLine(ctx, centerX, centerY, radius + 58, cameraRange.from, 'red', true);
    drawAngleLine(ctx, centerX, centerY, radius + 58, cameraRange.to, 'red', true);

    drawAngleLine(ctx, centerX, centerY, radius + 36, item.linedefFrom, '#f97316');
    drawAngleLine(ctx, centerX, centerY, radius + 36, item.linedefTo, '#f97316');

    drawAngleRangeLine(ctx, centerX, centerY, radius + 24, item.linedefFrom, item.linedefTo);
    drawArc(ctx, centerX, centerY, radius, -85, 85, '#e5e7eb', 2);
    drawArc(ctx, centerX, centerY, radius, cameraRange.from, cameraRange.to, 'rgba(255, 0, 0, 0.45)', 2);
    drawArc(ctx, centerX, centerY, radius + 24, item.linedefFrom, item.linedefTo, '#f97316', 2);

    const intersectionFrom = Math.max(cameraRange.from, item.linedefFrom);
    const intersectionTo = Math.min(cameraRange.to, item.linedefTo);

    if (intersectionFrom < intersectionTo) {
      drawArc(ctx, centerX, centerY, radius - 22, intersectionFrom, intersectionTo, '#16a34a', 2);
    }

    drawCamera(ctx, centerX, centerY);
  };
}

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
            <div class={stageStyles.simpleResponsiveGrid}>
              {angleRangeCases.map((item) => (
                <div class={stageStyles.demoItem}>
                  <p class={stageStyles.demoCaption}>
                    {item.title}
                  </p>
                  <Canvas
                    className={stageStyles.fluidImage}
                    settings={settings}
                    width={400}
                    height={320}
                    render={drawAngleRangeCase(item)}
                  />
                </div>
              ))}
            </div>
          </>
        );
      case 1:
        return (
          <>
            <div class={stageStyles.demoGridWithCenteredItems}>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2.5D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Canvas
                    settings={settings}
                    width={settings().camera.screen.width}
                    height={settings().camera.screen.height}
                    render={render25d}
                  />
                </div>
              </div>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Map2d
                    withControls
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
    <div class={stageStyles.demoStackLarge}>
      {renderPart(props.part ?? 0)}
    </div>
  );
};

export default Stage;

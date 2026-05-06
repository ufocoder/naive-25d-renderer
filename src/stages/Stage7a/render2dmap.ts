import { Angle } from "@app/lib/Angle";
import { drawAngleLine, drawLinedef } from "@app/lib/canvas";

const RAY_LENGTH = 300;
const SCALE_DEFAULT = 1;

function scaleLinedef(linedef: Linedef, scale: number) {
  return {
    start: {
      x: linedef.start.x * scale,
      y: linedef.start.y * scale
    },
    end: {
      x: linedef.end.x * scale,
      y: linedef.end.y * scale
    },
  }
}

export function create2dRenderMap(options: { scale?: number }) {
  const { scale = SCALE_DEFAULT } = options;

  return function render2d(ctx: CanvasRenderingContext2D, settings: Settings) {
    const camera = settings.camera;

    const cameraDrawSize = 5;

    for (const linedef of settings.level.linedefs) {
      drawLinedef(ctx, scaleLinedef(linedef, scale));
    }

    const halfFov = camera.fov.degrees / 2;
    const angle = camera.angle.degrees;
    
    drawAngleLine(ctx, camera.x * scale, camera.y * scale, new Angle(angle - halfFov), RAY_LENGTH);
    drawAngleLine(ctx, camera.x * scale, camera.y * scale, new Angle(angle), RAY_LENGTH);
    drawAngleLine(ctx, camera.x * scale, camera.y * scale, new Angle(angle + halfFov), RAY_LENGTH);

    ctx.fillStyle = "green";
    ctx.fillRect(
      camera.x * scale  - cameraDrawSize / 2 * scale, 
      camera.y * scale  - cameraDrawSize / 2 * scale, 
      cameraDrawSize * scale,
      cameraDrawSize * scale
    );
  }
}

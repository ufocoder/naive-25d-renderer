import { Angle } from "@app/lib/Angle";
import { drawAngleLine, drawLinedef } from "@app/lib/canvas";

const RAY_LENGTH = 300;

export default function render2d(ctx: CanvasRenderingContext2D, settings: Settings) {
  const camera = settings.camera;

  const cameraDrawSize = 5;

  for (const linedef of settings.level) {
    drawLinedef(ctx, linedef);
  }

  const halfFov = camera.fov.degrees / 2;
  const angle = camera.angle.degrees;
  
  drawAngleLine(ctx, camera.x, camera.y, new Angle(angle - halfFov), RAY_LENGTH);
  drawAngleLine(ctx, camera.x, camera.y, new Angle(angle), RAY_LENGTH);
  drawAngleLine(ctx, camera.x, camera.y, new Angle(angle + halfFov), RAY_LENGTH);

  ctx.fillStyle = "green";
  ctx.fillRect(
    camera.x - cameraDrawSize / 2, 
    camera.y - cameraDrawSize / 2, 
    cameraDrawSize,
    cameraDrawSize
  );
}
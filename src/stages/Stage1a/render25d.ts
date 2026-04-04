import { Angle } from "@app/lib/Angle";

function toAngle(a: Vertex, b: Vertex): Angle {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return new Angle((Math.atan2(dy, dx) * 180) / Math.PI);
}

function projectVertexToScreen(vertex: Vertex, camera: Camera) {
  const vertexAngle = toAngle(vertex, camera).degrees;
  const cameraAngleFrom = camera.angle.degrees - camera.fov.degrees / 2;
  const cameraAngleTo = camera.angle.degrees + camera.fov.degrees / 2;

  if (cameraAngleTo < vertexAngle || vertexAngle < cameraAngleFrom) {
    return null;
  }

  return (
    ((vertexAngle - cameraAngleFrom) / camera.fov.degrees) * camera.screen.width
  );
}

export default function render25d(ctx: CanvasRenderingContext2D, settings: Settings) {
  const camera = settings.camera;
  for (const linedef of settings.level) {
    for (const vertex of [linedef.start, linedef.end]) {
      const screenX = projectVertexToScreen(vertex, camera);
      if (screenX == null) {
        continue;
      }
      ctx.fillStyle = "black";
      ctx.fillRect(screenX, 0, 1, screen.height);
    }
  }
}

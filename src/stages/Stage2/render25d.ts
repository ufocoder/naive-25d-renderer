import { Angle, normalizeAngle } from "@app/lib/Angle";
import { drawPolygon } from "@app/lib/canvas";

const WALL_HEIGHT = 40_000;

function toAngle(a: Vertex, b: Vertex): Angle {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return new Angle((Math.atan2(dy, dx) * 180) / Math.PI);
}

function toDistance(a: Vertex, b: Vertex): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function projectVertexToScreen(camera: Camera, vertex: Vertex, withFishEyeFix = false) {
  const angle = toAngle(vertex, camera);
  const relativeAngle = new Angle(angle.degrees - camera.angle.degrees);
  const distance = withFishEyeFix
    ? toDistance(vertex, camera) * relativeAngle.cos
    : toDistance(vertex, camera);

  const height = WALL_HEIGHT / distance;

  const vertexAngle = angle.degrees;

  const cameraAngleFrom = camera.angle.degrees - camera.fov.degrees / 2;
  const cameraAngleTo = camera.angle.degrees + camera.fov.degrees / 2;

  if (cameraAngleTo < vertexAngle || vertexAngle < cameraAngleFrom) {
    return null;
  }

  const screenX =
    (normalizeAngle(vertexAngle - cameraAngleFrom) / camera.fov.degrees) *
    camera.screen.width;

  return {
    height,
    screenX,
  };
}

interface VertexProjection {
  height: number;
  screenX: number;
}

function projectionToPoints(
  camera: Camera,
  vertexProjectionStart: VertexProjection,
  vertexProjectionEnd: VertexProjection,
): Vertex[] {
  const wallStartHeight = vertexProjectionStart.height;
  const wallEndHeight = vertexProjectionEnd.height;
  const horizontalHeight = camera.screen.height / 2;

  return [
    {
      x: vertexProjectionStart.screenX,
      y: horizontalHeight - wallStartHeight / 2,
    },
    {
      x: vertexProjectionStart.screenX,
      y: horizontalHeight + wallStartHeight / 2,
    },
    { x: vertexProjectionEnd.screenX, y: horizontalHeight + wallEndHeight / 2 },
    { x: vertexProjectionEnd.screenX, y: horizontalHeight - wallEndHeight / 2 },
  ];
}

export function createRender25d({ withFix }: { withFix: boolean }) {
  return function render25d(
    ctx: CanvasRenderingContext2D,
    settings: Settings,
  ) {
    const camera = settings.camera;
    for (const linedef of settings.level.linedefs) {
      const vertexProjectionStart = projectVertexToScreen(camera, linedef.start, withFix);
      const vertexProjectionEnd = projectVertexToScreen(camera, linedef.end, withFix);

      if (!vertexProjectionStart || !vertexProjectionEnd) {
        continue;
      }

      drawPolygon(
        ctx,
        projectionToPoints(camera, vertexProjectionStart, vertexProjectionEnd),
      );
    }
  }
}

import { Angle, normalizeAngle } from "@app/lib/Angle";
import { drawPolygon } from "@app/lib/canvas";

const WALL_HEIGHT = 40_000;

function toAngle(a: Vertex, b: Vertex): Angle {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return new Angle((Math.atan2(dy, dx) * 180) / Math.PI);
}

export function toDistance(a: Vertex, b: Vertex): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function toScreenX(angleName: 'linedefFrom' | 'linedefTo', angles: IntersectionAngles, camera: Camera): number {
  const angle = angles[angleName];
  const fov = camera.fov.degrees

  return ((angle - angles.cameraFrom) / fov) * camera.screen.width;
}

interface IntersectionAngles {
  linedefFrom: number;
  linedefTo: number;
  cameraFrom: number;
  cameraTo: number;
}

function intersects(aFrom: number, aTo: number, bFrom: number, bTo: number) {
  return (aFrom <= bFrom && bFrom <= aTo) || (aFrom <= bTo && bTo <= aTo);
}

function includes(aFrom: number, aTo: number, bFrom: number, bTo: number) {
  return (aFrom <= bFrom && bFrom <= aTo) && (aFrom <= bTo && bTo <= aTo);
}

function calculateIntersectionAngles(linedef: Linedef, camera: Camera): null | IntersectionAngles {
  let linedefFrom = toAngle(linedef.start, camera).degrees;
  let linedefTo = toAngle(linedef.end, camera).degrees;
  let cameraFrom = normalizeAngle(camera.angle.degrees - camera.fov.degrees / 2);
  let cameraTo = normalizeAngle(camera.angle.degrees + camera.fov.degrees / 2);

  const clockwiseDiff = normalizeAngle(linedefTo - linedefFrom);

  if (clockwiseDiff > 180) {
    let tmpDegrees = linedef.start;
    linedef.start = linedef.end;
    linedef.end = tmpDegrees;

    let tmpVertex = linedefTo;
    linedefTo = linedefFrom;
    linedefFrom = tmpVertex;
  }

  if (cameraTo < cameraFrom) {
    cameraTo += 360;
  }

  if (linedefFrom > linedefTo) {
    linedefTo += 360;
  }

  if (!includes(cameraFrom, cameraTo, linedefFrom, linedefTo)) {
    if (!intersects(linedefFrom, linedefTo, cameraFrom, cameraTo)) {
      if (cameraTo < 360 && linedefTo > 360) {
        cameraTo += 360;
        cameraFrom += 360;
      }
      if (linedefTo < 360 && cameraTo > 360) {
        linedefTo += 360;
        linedefFrom += 360;
      }
      if (
        !includes(cameraFrom, cameraTo, linedefFrom, linedefTo) && 
        !intersects(linedefFrom, linedefTo, cameraFrom, cameraTo)
      ) {
        return null; 
      }
    }
  }

  return {
    linedefFrom,
    linedefTo,
    cameraFrom,
    cameraTo
  };
}

interface VertexProjection {
    screenX: number;
    height: number;
}

interface LinedefProjection {
  start: VertexProjection;
  end: VertexProjection;
}

export function projectLinedef(camera: Camera, linedef: Linedef) : LinedefProjection | null {
  const angles = calculateIntersectionAngles(linedef, camera);

  if (angles === null) {
    return null;
  }

  const relativeAngleStart = new Angle(angles.linedefFrom - camera.angle.degrees);
  const relativeAngleEnd = new Angle(angles.linedefTo - camera.angle.degrees);

  const distanceStart =  toDistance(linedef.start, camera) * Math.abs(relativeAngleStart.cos);
  const distanceEnd =  toDistance(linedef.end, camera) * Math.abs(relativeAngleEnd.cos);

  const heightStart =  WALL_HEIGHT / distanceStart;
  const heightEnd =  WALL_HEIGHT / distanceEnd;

  const isLinedefStartHeigher = heightStart > heightEnd;
  const linedefMinHeight = Math.min(heightStart, heightEnd);
  const linedefDiffHeight = Math.abs(heightStart - heightEnd);
  const linedefAngleRange = angles.linedefTo - angles.linedefFrom;

  let start;
  let end;

  if (angles.linedefFrom < angles.cameraFrom) {
    const percent = (angles.cameraFrom - angles.linedefFrom) / linedefAngleRange;
    const k = isLinedefStartHeigher ? (1 - percent) : percent;

    start = {
      screenX: 0,
      height: linedefMinHeight + linedefDiffHeight * k
    }
  } else {
    start = {
      screenX: toScreenX('linedefFrom', angles, camera),
      height: heightStart
    }
  }
  
  if (angles.linedefTo > angles.cameraTo) {
    const percent = (angles.cameraTo - angles.linedefFrom) / linedefAngleRange;
    const k = isLinedefStartHeigher ? (1 - percent) : percent;

    end = {
      screenX: camera.screen.width,
      height: linedefMinHeight + linedefDiffHeight * k
    }
  } else {
    end = {
      screenX: toScreenX('linedefTo', angles, camera),
      height: heightEnd
    };
  }

  return {
    start,
    end,
  };
}

export function projectionToPoints(camera:Camera, projection: LinedefProjection): Vertex[] {
  const wallStartHeight = projection.start.height;
  const wallEndHeight = projection.end.height;
  const horizontalHeight = camera.screen.height / 2;
  
  return [
    { x: projection.start.screenX, y: horizontalHeight - wallStartHeight / 2 },
    { x: projection.start.screenX, y: horizontalHeight + wallStartHeight / 2 },
    { x: projection.end.screenX, y: horizontalHeight + wallEndHeight / 2 },
    { x: projection.end.screenX, y: horizontalHeight - wallEndHeight / 2 },
  ]
}

export default function render25d(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
) {
  const camera = settings.camera;

  for (const linedef of settings.level) {
    const projection = projectLinedef(camera, linedef);

    if (!projection) {
      continue;
    }
    
    drawPolygon(ctx, projectionToPoints(camera, projection));
  }
}
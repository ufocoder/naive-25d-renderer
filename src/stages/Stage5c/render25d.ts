import { Angle, normalizeAngle } from "@app/lib/Angle";
import { drawPolygon } from "@app/lib/canvas";

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

function distanceToLinedef(linedef: Linedef, camera: Camera): number {
  const len = toDistance(linedef.start, linedef.end);
  const dx = linedef.end.x - linedef.start.x;
  const dy = linedef.end.y - linedef.start.y;

  return Math.abs(
    dy * camera.x - dx * camera.y
    + linedef.end.x * linedef.start.y - linedef.end.y * linedef.start.x
  ) / len;
}

function angleFromScreenX(screenX: number, camera: Camera): Angle {
  const fov = camera.fov.degrees;
  const centerX = camera.screen.width / 2;
  const angleOffset = ((screenX - centerX) / camera.screen.width) * fov;

  return new Angle(angleOffset);
}

function caclulateScaleFactor(
  screenX: number,
  linedef: Linedef,
  camera: Camera
): number {
  const distance = distanceToLinedef(linedef, camera);
  const screenXAngle = angleFromScreenX(screenX, camera);

  const wallDir = toAngle(linedef.end, linedef.start);
  const wallNormal = new Angle(wallDir.degrees + 90);
  
  
  const viewAngle = camera.angle.degrees + screenXAngle.degrees;
  const skewAngle = new Angle(viewAngle - wallNormal.degrees);
  const skewAngleCos = Math.abs(skewAngle.cos);
  
  
  const screenXAngleCos = Math.abs(screenXAngle.cos);
  
  return (distance * skewAngleCos) / (distance * screenXAngleCos);
}

function toScreenX(angle: number, angles: IntersectionAngles, camera: Camera): number {
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
    topY: number;
    bottomY: number;
}

interface LinedefProjection {
  start: VertexProjection;
  end: VertexProjection;
}

export function projectLinedef(camera: Camera, sector: Sector, linedef: Linedef): LinedefProjection | null {
  const angles = calculateIntersectionAngles(linedef, camera);

  if (angles === null) {
    return null;
  }

  const distanceToCamera = distanceToLinedef(linedef, camera)

  const startScreenX = angles.linedefFrom < angles.cameraFrom 
    ? 0 
    : toScreenX(angles.linedefFrom, angles, camera);
    
  const endScreenX = angles.linedefTo > angles.cameraTo
    ? camera.screen.width 
    : toScreenX(angles.linedefTo, angles, camera);

  const startScale = caclulateScaleFactor(startScreenX, linedef, camera);
  const endScale = caclulateScaleFactor(endScreenX, linedef, camera);

  const horizontalCenter = camera.screen.height / 2;

  return {
    start: {
      screenX: startScreenX,
      topY: horizontalCenter - (sector.ceilHeight! * startScale / distanceToCamera),
      bottomY: horizontalCenter + (sector.floorHeight! * startScale / distanceToCamera)
    },
    end: {
      screenX: endScreenX,
      topY: horizontalCenter - (sector.ceilHeight! * endScale / distanceToCamera),
      bottomY: horizontalCenter + (sector.floorHeight! * endScale / distanceToCamera)
    }
  };
}

export function projectionToPoints(projection: LinedefProjection): Vertex[] {
  return [
    { x: projection.start.screenX, y: projection.start.bottomY },
    { x: projection.start.screenX, y: projection.start.topY },
    { x: projection.end.screenX, y: projection.end.topY },
    { x: projection.end.screenX, y: projection.end.bottomY },
  ]
}

interface Wall {
  projection: LinedefProjection;
  distance: number;
  color: string;
}

const colors: string[] = [
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#00C7BE',
  '#5AC8FA',
  '#FF3B30',
  '#007AFF',
  '#AF52DE',
  '#FF2D55',
  '#A2845E',
];

function gerenateColor(index: number) {
  return colors[index % colors.length];
}

function toMiddleVertex(a: Vertex, b: Vertex): Vertex {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

export default function render25d(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
) {
  const camera = settings.camera;
  const walls: Wall[] = [];
  settings.level.sectors!.forEach(function(sector) {
    sector.segs.forEach(function(seg, index) {
      const projection = projectLinedef(camera, sector, seg);

      if (!projection) {
        return;
      }

      const linedefMiddle = toMiddleVertex(
        seg.start,
        seg.end,
      );

      const distance = toDistance(camera, linedefMiddle);

      walls.push({
        distance, 
        projection,
        color: gerenateColor(index)
      });
    })
  });

  walls.sort((a, b) => b.distance - a.distance);
  ctx.fillStyle = 'black'
  ctx.fillRect(0, camera.screen.height / 2, camera.screen.width, 1)

  for (const wall of walls) {
    drawPolygon(ctx, projectionToPoints(wall.projection!), wall.color);
  }
}

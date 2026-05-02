import { Angle, normalizeAngle } from "@app/lib/Angle";

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

function distanceToSeg(linedef: Seg, camera: Camera): number {
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
  linedef: Seg,
  camera: Camera
): number {
  const screenXAngle = angleFromScreenX(screenX, camera);

  const wallDir = toAngle(linedef.end, linedef.start);
  const wallNormal = new Angle(wallDir.degrees + 90);
  
  const viewAngle = camera.angle.degrees + screenXAngle.degrees;
  const skewAngle = new Angle(viewAngle - wallNormal.degrees);
  const skewAngleCos = Math.abs(skewAngle.cos);
  
  const screenXAngleCos = Math.abs(screenXAngle.cos);
  
  return skewAngleCos / screenXAngleCos;
}

function toScreenX(angle: number, angles: IntersectionAngles, camera: Camera): number {
  const fov = camera.fov.degrees

  return ((angle - angles.cameraFrom) / fov) * camera.screen.width;
}

function intersects(aFrom: number, aTo: number, bFrom: number, bTo: number) {
  return (aFrom <= bFrom && bFrom <= aTo) || (aFrom <= bTo && bTo <= aTo);
}

function includes(aFrom: number, aTo: number, bFrom: number, bTo: number) {
  return (aFrom <= bFrom && bFrom <= aTo) && (aFrom <= bTo && bTo <= aTo);
}

export function projectionToPoints(projection: SegProjection): Vertex[] {
  return [
    { x: projection.start.screenX, y: projection.start.bottomY },
    { x: projection.start.screenX, y: projection.start.topY },
    { x: projection.end.screenX, y: projection.end.topY },
    { x: projection.end.screenX, y: projection.end.bottomY },
  ]
}

interface IntersectionAngles {
  linedefFrom: number;
  linedefTo: number;
  cameraFrom: number;
  cameraTo: number;
}

function calculateIntersectionAngles(linedef: Seg, camera: Camera): null | IntersectionAngles {
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

export interface SegProjection {
  start: VertexProjection;
  end: VertexProjection;
  sector: Sector;
  distance: number;
}

export function projectSeg(camera: Camera, sector: Sector, linedef: Seg): SegProjection | null {
  const angles = calculateIntersectionAngles(linedef, camera);

  if (angles === null) {
    return null;
  }

  const distance = distanceToSeg(linedef, camera);

  const ceilRelativeHeight = (sector.ceilHeight ?? 0) - camera.z!;
  const floorRelativeHeight = camera.z! - (sector.floorHeight ?? 0);

  const startScreenX = angles.linedefFrom < angles.cameraFrom 
    ? 0 
    : toScreenX(angles.linedefFrom, angles, camera);
    
  const endScreenX = angles.linedefTo > angles.cameraTo
    ? camera.screen.width 
    : toScreenX(angles.linedefTo, angles, camera);

  const startScale = caclulateScaleFactor(startScreenX, linedef, camera);
  const endScale = caclulateScaleFactor(endScreenX, linedef, camera);

  const horizontalCenter = camera.screen.height / 2;

  const startTopY = horizontalCenter - (ceilRelativeHeight * startScale / distance);
  const startBottomY = horizontalCenter + (floorRelativeHeight * startScale / distance);
  const endTopY = horizontalCenter - (ceilRelativeHeight * endScale / distance);
  const endBottomY = horizontalCenter + (floorRelativeHeight * endScale / distance);

  return {
    start: {
      screenX: startScreenX,
      topY: startTopY,
      bottomY: startBottomY
    },
    end: {
      screenX: endScreenX,
      topY: endTopY,
      bottomY: endBottomY
    },
    sector: sector,
    distance: distance
  };
}

export interface ProjectionScreenX {
  start: number;
  end: number;
}

export function projectSegX(camera: Camera, linedef: Seg): ProjectionScreenX | null {
  const angles = calculateIntersectionAngles(linedef, camera);

  if (angles === null) {
    return null;
  }

  const startScreenX = angles.linedefFrom < angles.cameraFrom 
    ? 0 
    : toScreenX(angles.linedefFrom, angles, camera);
    
  const endScreenX = angles.linedefTo > angles.cameraTo
    ? camera.screen.width 
    : toScreenX(angles.linedefTo, angles, camera);

  return {
    start: startScreenX,
    end: endScreenX
  };
}

interface ProjectionScreenY {
  start: {
    top: number;
    bottom: number;
  }
  end: {
    top: number;
    bottom: number;
  }
}

export function projectSegY(camera: Camera, projectionX: ProjectionScreenX, sector: Sector, linedef: Seg): ProjectionScreenY {
  const ceilRelativeHeight = (sector.ceilHeight ?? 0) - camera.z!;
  const floorRelativeHeight = camera.z! - (sector.floorHeight ?? 0);

  const horizontalCenter = camera.screen.height / 2;

  const startScale = caclulateScaleFactor(projectionX.start, linedef, camera);
  const endScale = caclulateScaleFactor(projectionX.end, linedef, camera);
  const distance = distanceToSeg(linedef, camera);

  const startTopY = horizontalCenter - (ceilRelativeHeight * startScale / distance);
  const startBottomY = horizontalCenter + (floorRelativeHeight * startScale / distance);
  const endTopY = horizontalCenter - (ceilRelativeHeight * endScale / distance);
  const endBottomY = horizontalCenter + (floorRelativeHeight * endScale / distance);

  return {
    start: {
      top: startTopY,
      bottom: startBottomY
    },
    end: {
      top: endTopY,
      bottom: endBottomY
    }
  };
}

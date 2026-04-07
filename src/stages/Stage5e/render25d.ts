import { drawPolygon } from "@app/lib/canvas";
import { projectSeg, toDistance, projectionToPoints } from "../Stage5d/projection";
import type { SegProjection } from "../Stage5d/projection";

interface Wall {
  projection: SegProjection
  distance: number;
  color: string;
}

interface PolygonProjection {
  points: Vertex[];
  color: string;
  distance: number;
}

interface PortalClip {
  leftX: number;
  rightX: number;
}

function isPortal(seg: Seg): boolean {
  return Boolean(seg.isTwoSide && seg.backSector && seg.backSector !== seg.frontSector);
}

function toMiddleVertex(a: Vertex, b: Vertex): Vertex {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function createFloorPolygon(
  projection: SegProjection,
  screenHeight: number
): PolygonProjection | null {
  const startX = projection.start.screenX;
  const endX = projection.end.screenX;
  const bottomStartY = projection.start.bottomY;
  const bottomEndY = projection.end.bottomY;
  
  if (bottomStartY >= screenHeight && bottomEndY >= screenHeight) {
    return null;
  }
  
  const points: Vertex[] = [
    { x: startX, y: Math.max(0, Math.min(screenHeight, bottomStartY)) },
    { x: endX, y: Math.max(0, Math.min(screenHeight, bottomEndY)) },
    { x: endX, y: screenHeight },
    { x: startX, y: screenHeight },
  ];
  
  return {
    points,
    color: projection.sector.floorColor!,
    distance: projection.distance
  };
}

function isPointInSector(point: Vertex, sector: Sector): boolean {
  const { x, y } = point;
  let inside = false;
  
  for (const seg of sector.segs) {
    const x1 = seg.start.x;
    const y1 = seg.start.y;
    const x2 = seg.end.x;
    const y2 = seg.end.y;
    
    const intersects = ((y1 > y) !== (y2 > y)) &&
      (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1);
    
    if (intersects) {
      inside = !inside;
    }
  }
  
  return inside;
}

function createCeilPolygon(
  projection: SegProjection,
  screenHeight: number
): PolygonProjection | null {
  const startX = projection.start.screenX;
  const endX = projection.end.screenX;
  const topStartY = projection.start.topY;
  const topEndY = projection.end.topY;
  
  if (topStartY <= 0 && topEndY <= 0) {
    return null;
  }
  
  const points: Vertex[] = [
    { x: startX, y: 0 },
    { x: endX, y: 0 },
    { x: endX, y: Math.max(0, Math.min(screenHeight, topEndY)) },
    { x: startX, y: Math.max(0, Math.min(screenHeight, topStartY)) },
  ];
  
  return {
    points,
    color: projection.sector.ceilColor!,
    distance: projection.distance
  };
}

function renderSectorWithPortal(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  sector: Sector,
  visitedSectors: Set<number> = new Set(),
  clip: PortalClip | null = null
) {
  if (visitedSectors.has(sector.id!)) {
    return;
  }
  visitedSectors.add(sector.id!);

  const walls: Wall[] = [];
  const floorPolygons: PolygonProjection[] = [];
  const ceilPolygons: PolygonProjection[] = [];
  const portals: { projection: SegProjection; backSector: Sector; clipLeft: number; clipRight: number }[] = [];

  const screenHeight = camera.screen.height;

  sector.segs.forEach(function(seg) {
    const projection = projectSeg(camera, sector, seg);

    if (!projection) {
      return;
    }

    let startX = projection.start.screenX;
    let endX = projection.end.screenX;
    
    if (clip !== null) {
      if (endX <= clip.leftX || startX >= clip.rightX) {
        return;
      }
      if (startX < clip.leftX) startX = clip.leftX;
      if (endX > clip.rightX) endX = clip.rightX;
    }

    const linedefMiddle = toMiddleVertex(seg.start, seg.end);
    const distance = toDistance(camera, linedefMiddle);

    const clippedProjection: SegProjection = {
      ...projection,
      start: { ...projection.start, screenX: startX },
      end: { ...projection.end, screenX: endX }
    };

    if (isPortal(seg)) {
      portals.push({
        projection: clippedProjection,
        backSector: seg.backSector!,
        clipLeft: startX,
        clipRight: endX
      });
    } else {
      walls.push({
        distance, 
        projection: clippedProjection,
        color: seg.color!
      });
    }

    const floorPoly = createFloorPolygon(clippedProjection, screenHeight);
    const ceilPoly = createCeilPolygon(clippedProjection, screenHeight);
    
    if (floorPoly) {
      floorPolygons.push(floorPoly);
    }
    if (ceilPoly) {
      ceilPolygons.push(ceilPoly);
    }
  });

  walls.sort((a, b) => b.distance - a.distance);
  floorPolygons.sort((a, b) => b.distance - a.distance);
  ceilPolygons.sort((a, b) => b.distance - a.distance);
  
  for (const poly of ceilPolygons) {
    drawPolygon(ctx, poly.points, poly.color);
  }
  
  for (const poly of floorPolygons) {
    drawPolygon(ctx, poly.points, poly.color);
  }
  
  for (const wall of walls) {
    const points = projectionToPoints(wall.projection);
    drawPolygon(ctx, points, wall.color);
  }

  portals.sort((a, b) => b.projection.distance - a.projection.distance);
  
  for (const portal of portals) {
    const newClip: PortalClip = {
      leftX: Math.max(clip?.leftX ?? -Infinity, portal.clipLeft),
      rightX: Math.min(clip?.rightX ?? Infinity, portal.clipRight)
    };
    
    renderSectorWithPortal(
      ctx, 
      camera, 
      portal.backSector, 
      new Set(visitedSectors),
      newClip
    );
  }
}

function findCameraSector(settings: Settings): Sector {
  const cameraPoint = { x: settings.camera.x, y: settings.camera.y };
  
  for (const sector of settings.level.sectors!) {
    if (isPointInSector(cameraPoint, sector)) {
      return sector;
    }
  }
  
  console.warn("Camera not found in any sector, using first sector");
  return settings.level.sectors![0];
}

export default function render25d(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
) {
  const camera = settings.camera;

  const currentSector = findCameraSector(settings);

  renderSectorWithPortal(ctx, camera, currentSector, new Set(), null);
}
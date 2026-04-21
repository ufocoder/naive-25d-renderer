import { drawPolygon } from "@app/lib/canvas";
import { projectSeg, toDistance, projectionToPoints } from "./projection";
import type { SegProjection } from "./projection";

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
  topY: number;
  bottomY: number;
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

function createFloorPolygon(
  projection: SegProjection,
  screenHeight: number,
  clip?: PortalClip | null
): PolygonProjection | null {
  const startX = projection.start.screenX;
  const endX = projection.end.screenX;
  let bottomStartY = projection.start.bottomY;
  let bottomEndY = projection.end.bottomY;
  
  let floorTopY = 0;
  let floorBottomY = screenHeight;
  
  if (clip) {
    bottomStartY = Math.max(bottomStartY, clip.topY);
    bottomEndY = Math.max(bottomEndY, clip.topY);
    floorBottomY = clip.bottomY;
  }
  
  if (bottomStartY >= floorBottomY && bottomEndY >= floorBottomY) {
    return null;
  }
  
  const points: Vertex[] = [
    { x: startX, y: Math.max(floorTopY, Math.min(floorBottomY, bottomStartY)) },
    { x: endX, y: Math.max(floorTopY, Math.min(floorBottomY, bottomEndY)) },
    { x: endX, y: floorBottomY },
    { x: startX, y: floorBottomY },
  ];
  
  return {
    points,
    color: projection.sector.floorColor!,
    distance: projection.distance
  };
}

function createCeilPolygon(
  projection: SegProjection,
  screenHeight: number,
  clip?: PortalClip | null
): PolygonProjection | null {
  const startX = projection.start.screenX;
  const endX = projection.end.screenX;
  let topStartY = projection.start.topY;
  let topEndY = projection.end.topY;
  
  let ceilTopY = 0;
  let ceilBottomY = screenHeight;
  
  if (clip) {
    topStartY = Math.min(topStartY, clip.bottomY);
    topEndY = Math.min(topEndY, clip.bottomY);
    ceilTopY = clip.topY;
  }
  
  if (topStartY <= ceilTopY && topEndY <= ceilTopY) {
    return null;
  }
  
  const points: Vertex[] = [
    { x: startX, y: ceilTopY },
    { x: endX, y: ceilTopY },
    { x: endX, y: Math.max(ceilTopY, Math.min(ceilBottomY, topEndY)) },
    { x: startX, y: Math.max(ceilTopY, Math.min(ceilBottomY, topStartY)) },
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
  const portals: { projection: SegProjection; backSector: Sector; clipLeft: number; clipRight: number; clipTop: number; clipBottom: number }[] = [];

  const screenHeight = camera.screen.height;

  sector.segs.forEach(function(seg) {
    const projection = projectSeg(camera, sector, seg);

    if (!projection) {
      return;
    }

    let startX = projection.start.screenX;
    let endX = projection.end.screenX;
    let startTopY = projection.start.topY;
    let startBottomY = projection.start.bottomY;
    let endTopY = projection.end.topY;
    let endBottomY = projection.end.bottomY;
    
    // Горизонтальный клиппинг
    if (clip !== null) {
      if (endX <= clip.leftX || startX >= clip.rightX) {
        return;
      }
      
      if (startX < clip.leftX) {
        const t = (clip.leftX - startX) / (endX - startX);
        startTopY = startTopY + t * (endTopY - startTopY);
        startBottomY = startBottomY + t * (endBottomY - startBottomY);
        startX = clip.leftX;
      }
      
      if (endX > clip.rightX) {
        const t = (clip.rightX - startX) / (endX - startX);
        endTopY = startTopY + t * (endTopY - startTopY);
        endBottomY = startBottomY + t * (endBottomY - startBottomY);
        endX = clip.rightX;
      }
    }

    const linedefMiddle = toMiddleVertex(seg.start, seg.end);
    const distance = toDistance(camera, linedefMiddle);

    const clippedProjection: SegProjection = {
      ...projection,
      start: { 
        ...projection.start, 
        screenX: startX,
        topY: startTopY,
        bottomY: startBottomY
      },
      end: { 
        ...projection.end, 
        screenX: endX,
        topY: endTopY,
        bottomY: endBottomY
      }
    };

    if (isPortal(seg)) {
      const clipTop = Math.min(startTopY, endTopY);
      const clipBottom = Math.max(startBottomY, endBottomY);
      
      portals.push({
        projection: clippedProjection,
        backSector: seg.backSector!,
        clipLeft: startX,
        clipRight: endX,
        clipTop: clipTop,
        clipBottom: clipBottom
      });
    } else {
      walls.push({
        distance, 
        projection: clippedProjection,
        color: seg.color!
      });
    }

    const floorPoly = createFloorPolygon(clippedProjection, screenHeight, clip);
    const ceilPoly = createCeilPolygon(clippedProjection, screenHeight, clip);
    
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
  
  for (const wall of walls) {
    const points = projectionToPoints(wall.projection);
    drawPolygon(ctx, points, wall.color);
  }
  
  for (const poly of floorPolygons) {
    drawPolygon(ctx, poly.points, poly.color);
  }

  portals.sort((a, b) => b.projection.distance - a.projection.distance);
  
  for (const portal of portals) {
    const newClip: PortalClip = {
      leftX: Math.max(clip?.leftX ?? -Infinity, portal.clipLeft),
      rightX: Math.min(clip?.rightX ?? Infinity, portal.clipRight),
      topY: Math.max(clip?.topY ?? -Infinity, portal.clipTop),
      bottomY: Math.min(clip?.bottomY ?? Infinity, portal.clipBottom)
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
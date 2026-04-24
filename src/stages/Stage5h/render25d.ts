import { drawPolygon, drawPolygonDebug } from "@app/lib/canvas";
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

interface TrapezoidClip {
  leftX: number;
  rightX: number;
  // Для левого края
  leftTopY: number;
  leftBottomY: number;
  // Для правого края
  rightTopY: number;
  rightBottomY: number;
}

function debugPortals(
  ctx: CanvasRenderingContext2D,
  portals: { projection: SegProjection; backSector: Sector; clip: TrapezoidClip }[],
  color: string = '#FF00FF'
) {
  for (const portal of portals) {
    // Преобразуем clip портала в точки (трапеция)
    const points: Vertex[] = [
      { x: portal.clip.leftX, y: portal.clip.leftTopY },
      { x: portal.clip.rightX, y: portal.clip.rightTopY },
      { x: portal.clip.rightX, y: portal.clip.rightBottomY },
      { x: portal.clip.leftX, y: portal.clip.leftBottomY },
    ];
    
    drawPolygonDebug(ctx, points, color);
  }
}

// Функция для получения topY в любой точке X
function getTopYAtX(clip: TrapezoidClip, x: number): number {
  if (x <= clip.leftX) return clip.leftTopY;
  if (x >= clip.rightX) return clip.rightTopY;
  const t = (x - clip.leftX) / (clip.rightX - clip.leftX);
  return clip.leftTopY + t * (clip.rightTopY - clip.leftTopY);
}

// Функция для получения bottomY в любой точке X
function getBottomYAtX(clip: TrapezoidClip, x: number): number {
  if (x <= clip.leftX) return clip.leftBottomY;
  if (x >= clip.rightX) return clip.rightBottomY;
  const t = (x - clip.leftX) / (clip.rightX - clip.leftX);
  return clip.leftBottomY + t * (clip.rightBottomY - clip.leftBottomY);
}

// Создание клипа из проекции стены
function createTrapezoidClip(projection: SegProjection): TrapezoidClip {
  return {
    leftX: projection.start.screenX,
    rightX: projection.end.screenX,
    leftTopY: projection.start.topY,
    leftBottomY: projection.start.bottomY,
    rightTopY: projection.end.topY,
    rightBottomY: projection.end.bottomY
  };
}

// Обновленная функция для пола с трапециевидным клиппингом
function createFloorPolygonWithClip(
  projection: SegProjection,
  screenHeight: number,
  clip: TrapezoidClip | null = null
): PolygonProjection | null {
  const { start, end } = projection;
  
  if (!clip) {
    return {
      points: [
        { x: start.screenX, y: start.bottomY },
        { x: end.screenX, y: end.bottomY },
        { x: end.screenX, y: screenHeight },
        { x: start.screenX, y: screenHeight },
      ],
      color: projection.sector.floorColor!,
      distance: projection.distance
    };
  }
  
  // Пол виден только если стена выше портала
  if (start.bottomY >= clip.leftBottomY && end.bottomY >= clip.rightBottomY) {
    return null;
  }
  return {
    points: [
      { x: start.screenX, y: Math.max(start.bottomY, getBottomYAtX(clip, start.screenX))  },
      { x: end.screenX, y: Math.max(end.bottomY, getBottomYAtX(clip, end.screenX)) },
      { x: end.screenX, y: end.bottomY },
      { x: start.screenX, y: start.bottomY },
    ],
    color: projection.sector.floorColor!,
    distance: projection.distance
  };
}

function createCeilPolygonWithClip(
  projection: SegProjection,
  clip: TrapezoidClip | null = null
): PolygonProjection | null {
  const { start, end } = projection;
  
  if (!clip) {
    return {
      points: [
        { x: start.screenX, y: 0 },
        { x: end.screenX, y: 0 },
        { x: end.screenX, y: end.topY },
        { x: start.screenX, y: start.topY },
      ],
      color: projection.sector.ceilColor!,
      distance: projection.distance
    };
  }
  
  // Потолок виден только если стена ниже портала
  if (start.topY <= clip.leftTopY && end.topY <= clip.rightTopY) {
    return null;
  }

  return {
    points: [
      { x: start.screenX, y: Math.min(start.topY, getTopYAtX(clip, start.screenX)) },
      { x: end.screenX, y:  Math.min(end.topY, getTopYAtX(clip, end.screenX)) },
      { x: end.screenX, y: end.topY },
      { x: start.screenX, y: start.topY },
    ],
    color: projection.sector.ceilColor!,
    distance: projection.distance
  };
}

function renderSectorWithPortal(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  sector: Sector,
  visitedSectors: Set<number> = new Set(),
  clip: TrapezoidClip | null = null
) {
  if (visitedSectors.has(sector.id!)) {
    return;
  }
  visitedSectors.add(sector.id!);

  const walls: Wall[] = [];
  const floorPolygons: PolygonProjection[] = [];
  const ceilPolygons: PolygonProjection[] = [];
  const portals: { projection: SegProjection; backSector: Sector; clip: TrapezoidClip }[] = [];

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
        screenX: startX,
        topY: startTopY,
        bottomY: startBottomY
      },
      end: {
        screenX: endX,
        topY: endTopY,
        bottomY: endBottomY
      }
    };

    if (isPortal(seg)) {
      portals.push({
        projection: clippedProjection,
        backSector: seg.backSector!,
        clip: createTrapezoidClip(clippedProjection)
      });
    } else {
      walls.push({
        distance, 
        projection: clippedProjection,
        color: seg.color!
      });
    }

    const floorPoly = createFloorPolygonWithClip(clippedProjection, screenHeight, clip);
    const ceilPoly = createCeilPolygonWithClip(clippedProjection, clip);
    
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
  debugPortals(ctx, portals);
  
  
  for (const portal of portals) {
    renderSectorWithPortal(
      ctx, 
      camera, 
      portal.backSector, 
      new Set(visitedSectors),
      portal.clip
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
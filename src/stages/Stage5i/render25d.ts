import { drawPolygon, drawPolygonDebug } from "@app/lib/canvas";
import { projectSeg, toDistance } from "./projection";
import { createWallPolygon, createCeilPolygon, createFloorPolygon, intersectPolygons } from "./clipping";

interface Wall {
  points: Vertex[]
  distance: number;
  color: string;
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

function renderSectorWithPortal(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  sector: Sector,
  visitedSectors: Set<number> = new Set(),
  clip: Vertex[]
) {
  if (visitedSectors.has(sector.id!)) {
    return;
  }
  visitedSectors.add(sector.id!);

  const walls: Wall[] = [];
  const floorPolygons: { points: Vertex[]; distance: number; color: string; }[] = [];
  const ceilPolygons: { points: Vertex[]; distance: number; color: string; }[] = [];
  const portals: { points: Vertex[]; distance: number; backSector: Sector; }[] = [];

  const screenHeight = camera.screen.height;

  sector.segs.forEach(function(seg) {
    const projection = projectSeg(camera, sector, seg);

    if (!projection) {
      return;
    }

    const clippedProjection = clip 
      ? intersectPolygons(createWallPolygon(projection), clip)
      : createWallPolygon(projection);

    if (!clippedProjection.length) {
      return;
    }

    const linedefMiddle = toMiddleVertex(seg.start, seg.end);
    const distance = toDistance(camera, linedefMiddle);

    if (isPortal(seg)) {
      portals.push({
        distance,
        points: clippedProjection,
        backSector: seg.backSector!
      });
    } else {
      walls.push({
        distance,
        points: clippedProjection,
        color: seg.color!
      });
    }

    const floorPoly = clip 
      ? intersectPolygons(createFloorPolygon(projection, screenHeight), clip)
      : createFloorPolygon(projection, screenHeight);

    const ceilPoly = clip 
      ? intersectPolygons(createCeilPolygon(projection), clip)
      : createCeilPolygon(projection);
    
    if (floorPoly.length) {
      floorPolygons.push({
        distance,
        color: sector.floorColor!,
        points: floorPoly,
     });
    }
    if (ceilPoly.length) {
      ceilPolygons.push({
        distance,
        color: sector.ceilColor!,
        points: ceilPoly
      });
    }
  });

  walls.sort((a, b) => b.distance - a.distance);
  floorPolygons.sort((a, b) => b.distance - a.distance);
  ceilPolygons.sort((a, b) => b.distance - a.distance);
  
  for (const wall of walls) {
    drawPolygon(ctx, wall.points, wall.color);
  }

  for (const poly of ceilPolygons) {
    drawPolygon(ctx, poly.points, poly.color);
  }

  for (const poly of floorPolygons) {
    drawPolygon(ctx, poly.points, poly.color);
  }

  portals.sort((a, b) => b.distance - a.distance);

  for (const portal of portals) {
    drawPolygonDebug(ctx, portal.points, '#FF00FF');
  }
  
  for (const portal of portals) {
    renderSectorWithPortal(
      ctx, 
      camera, 
      portal.backSector, 
      new Set(visitedSectors),
      portal.points
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
  
  return settings.level.sectors![0];
}

export default function render25d(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
) {
  const camera = settings.camera;
  const currentSector = findCameraSector(settings);
  const screenPortal = [
    { x: 0, y: 0 },
    { x: camera.screen.width, y: 0 },
    { x: camera.screen.width, y: camera.screen.height },
    { x: 0, y: camera.screen.height },
  ];

  renderSectorWithPortal(ctx, camera, currentSector, new Set(), screenPortal);
}
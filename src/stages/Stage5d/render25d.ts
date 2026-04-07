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

const wallColors: string[] = [
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

function generateWallColor(index: number) {
  return wallColors[index % wallColors.length];
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

export default function render25d(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
) {
  const camera = settings.camera;
  const walls: Wall[] = [];
  const floorPolygons: PolygonProjection[] = [];
  const ceilPolygons: PolygonProjection[] = [];

  const screenHeight = camera.screen.height;
  
  settings.level.sectors!.forEach(function(sector, sectorIdx) {
    sector.segs.forEach(function(seg, segIdx) {
      const projection = projectSeg(camera, sector, seg);

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
        color: generateWallColor(sectorIdx * 10 + segIdx)
      });

      const floorPoly = createFloorPolygon(projection, screenHeight);
      const ceilPoly = createCeilPolygon(projection, screenHeight);
      
      if (floorPoly) {
        floorPolygons.push(floorPoly);
      }
      if (ceilPoly) {
        ceilPolygons.push(ceilPoly);
      }
    });
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
}
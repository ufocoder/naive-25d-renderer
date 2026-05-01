import { traverseBSPTree } from "../Stage6a/bsp/traverse";
import type { BSPLeaf } from "../Stage6a/bsp/typings";
import { buildBSPTree } from "../Stage6a/bsp/build";
import { projectSeg, type SegProjection } from "../Stage5i/projection";

interface SolidSegmentRange {
  xStart: number;
  xEnd: number;
}

function isPortal(seg: Seg): boolean {
  return Boolean(seg.isTwoSide && seg.backSector && seg.backSector !== seg.frontSector);
}

function isWallVisible(x: number, ranges: SolidSegmentRange[]): boolean {
  for (const range of ranges) {
    if (x >= range.xStart && x <= range.xEnd) {
      return false;
    }
  }
  return true;
}

function addSolidRange(
  camera: Camera,
  xStart: number,
  xEnd: number,
  ranges: SolidSegmentRange[]
): SolidSegmentRange[] {
  xStart = Math.max(0, Math.floor(xStart));
  xEnd = Math.min(camera.screen.width, Math.ceil(xEnd));
  
  if (xStart >= xEnd) return [];
  
  const result: SolidSegmentRange[] = [];
  const sortedRanges = [...ranges].sort((a, b) => a.xStart - b.xStart);
  
  let currentX = xStart;
  
  for (const range of sortedRanges) {
    if (range.xEnd <= currentX) continue;
    
    if (currentX < range.xStart) {
      result.push({
        xStart: currentX,
        xEnd: Math.min(range.xStart, xEnd)
      });
    }
    
    currentX = Math.max(currentX, range.xEnd);
    if (currentX >= xEnd) break;
  }
  
  if (currentX < xEnd) {
    result.push({
      xStart: currentX,
      xEnd: xEnd
    });
  }
  
  for (const segment of result) {
    ranges.push(segment);
  }
  
  ranges.sort((a, b) => a.xStart - b.xStart);
  
  return result;
}

function drawVerticalLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  bottomY: number,
  color: string
): void {
  if (topY >= bottomY) return;
  
  ctx.fillStyle = color;
  ctx.fillRect(x, topY, 1, bottomY - topY);
}

function createSolidWallRanges(camera: Camera) {
  const ranges: SolidSegmentRange[] = [];

  ranges.push({ xStart: Number.MIN_SAFE_INTEGER, xEnd: -1 });
  ranges.push({ xStart: camera.screen.width, xEnd: Number.MAX_SAFE_INTEGER });

  return ranges;
}

function drawSolidWall(
  ctx: CanvasRenderingContext2D,
  camera:Camera, 
  seg: Seg,
  projection: SegProjection, 
  solidWallRanges: SolidSegmentRange[]
) {
  const sector = seg.frontSector!;
  const wallColor = sector.wallColor!;
  const floorColor = sector.floorColor!;
  const ceilColor = sector.ceilColor!;

  const xStart = projection.start.screenX;
  const xEnd = projection.end.screenX;
  const startTop = projection.start.topY;
  const startBottom = projection.start.bottomY;
  const endTop = projection.end.topY;
  const endBottom = projection.end.bottomY;

  const xFrom = Math.max(0, Math.floor(Math.min(xStart, xEnd)));
  const xTo = Math.min(camera.screen.width - 1, Math.ceil(Math.max(xStart, xEnd)));

  for (let x = xFrom; x <= xTo; x++) {
    if (!isWallVisible(x, solidWallRanges)) {
      continue;
    }

    const t = (x - xStart) / (xEnd - xStart);
    const top = startTop + (endTop - startTop) * t;
    const bottom = startBottom + (endBottom - startBottom) * t;
    
    const drawTop = Math.max(0, top);
    const drawBottom = Math.min(camera.screen.height, bottom);
    
    if (drawTop >= drawBottom) {
      continue;
    }
    
    if (drawTop > 0) {
      drawVerticalLine(ctx, x, 0, drawTop, ceilColor);
    }

    drawVerticalLine(ctx, x, drawTop, drawBottom, wallColor);
    
    if (drawBottom < camera.screen.height) {
      drawVerticalLine(ctx, x, drawBottom, camera.screen.height, floorColor);
    }
  }

  addSolidRange(camera, xStart, xEnd, solidWallRanges);
}

export default function render25d(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
) {
  const camera = settings.camera;
  const allSegments = settings.level.linedefs;
  const bspTree = buildBSPTree(allSegments);

  const solidWallRanges = createSolidWallRanges(camera);

  traverseBSPTree(bspTree, camera, (bspNode: BSPLeaf) => {
    for (const seg of bspNode.segs) {
      const sector = seg.frontSector!;

      const projection = projectSeg(camera, sector, seg);

      if (!projection) {
        continue;
      }

      if (!isPortal(seg)) {
        drawSolidWall(ctx, camera, seg, projection, solidWallRanges);
      }
    }
  });
}
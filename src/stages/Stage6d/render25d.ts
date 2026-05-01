import { traverseBSPTree } from "../Stage6a/bsp/traverse";
import type { BSPLeaf } from "../Stage6a/bsp/typings";
import { buildBSPTree } from "../Stage6a/bsp/build";
import { projectSeg, type SegProjection } from "../Stage5i/projection";
import { getPointSide } from "../Stage6a/bsp/geometry";
import { removeDuplicateSegments } from "../Stage6a/utils";


function isPortal(seg: Seg): boolean {
  return Boolean(seg.isTwoSide && seg.backSector && seg.backSector !== seg.frontSector);
}

interface SolidSegmentRange {
  xStart: number;
  xEnd: number;
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

interface ColumnClip {
  top: number;
  bottom: number;
}

function drawSolidSegment(
  ctx: CanvasRenderingContext2D,
  camera: Camera, 
  seg: Seg,
  projection: SegProjection, 
  solidWallRanges: SolidSegmentRange[],
  upperClip: ColumnClip[],
  lowerClip: ColumnClip[],
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
    
    const drawTop = Math.max(upperClip[x].top, top);
    const drawBottom = Math.min(lowerClip[x].bottom, bottom);
    
    if (drawTop >= drawBottom) {
      continue;
    }

    if (drawTop > upperClip[x].top) {
      drawVerticalLine(ctx, x, Math.floor(upperClip[x].top), drawTop, ceilColor);
    }

    drawVerticalLine(ctx, x, drawTop, drawBottom, wallColor);

    if (drawBottom < lowerClip[x].bottom) {
      drawVerticalLine(ctx, x, drawBottom, Math.ceil(lowerClip[x].bottom), floorColor);
    }

    upperClip[x].top = drawTop;
    lowerClip[x].bottom = drawBottom;
  }

  addSolidRange(camera, xStart, xEnd, solidWallRanges);
}

function drawPortalSegment(
  ctx: CanvasRenderingContext2D,
  camera: Camera, 
  seg: Seg,
  projection: SegProjection, 
  solidWallRanges: SolidSegmentRange[],
  upperClip: ColumnClip[],
  lowerClip: ColumnClip[],
) {
  const frontSector = seg.frontSector!;
  const backSector = seg.backSector!;

  const xStart = projection.start.screenX;
  const xEnd = projection.end.screenX;
  const startTop = projection.start.topY;
  const startBottom = projection.start.bottomY;
  const endTop = projection.end.topY;
  const endBottom = projection.end.bottomY;

  const xFrom = Math.max(0, Math.floor(Math.min(xStart, xEnd)));
  const xTo = Math.min(camera.screen.width - 1, Math.ceil(Math.max(xStart, xEnd)));

  const cameraSide = getPointSide(seg, { x: camera.x, y: camera.y });
  const isFront = cameraSide >= 0;
  const currentSector = isFront ? frontSector : backSector;

  for (let x = xFrom; x <= xTo; x++) {
    if (!isWallVisible(x, solidWallRanges)) {
      continue;
    }

    const t = (x - xStart) / (xEnd - xStart);
    const top = startTop + (endTop - startTop) * t;
    const bottom = startBottom + (endBottom - startBottom) * t;

    const drawTop = Math.max(upperClip[x].top, top);
    const drawBottom = Math.min(lowerClip[x].bottom, bottom);

    if (top >= bottom) {
      continue;
    }

    if (drawTop > upperClip[x].top) {
      drawVerticalLine(ctx, x, Math.floor(upperClip[x].top), drawTop, currentSector.ceilColor!);
      upperClip[x].top = drawTop;
    }
    
    if (drawBottom < lowerClip[x].bottom) {
      drawVerticalLine(ctx, x, drawBottom, Math.ceil(lowerClip[x].bottom), currentSector.floorColor!);
      lowerClip[x].bottom = drawBottom;
    }
  }
}

function createColumnClip(camera: Camera): ColumnClip[] {
  const clips = new Array(camera.screen.width);

  for (let x = 0; x < camera.screen.width; x++) {
    clips[x] = {
      top: -1,
      bottom: camera.screen.height,
    };
  }

  return clips;
}

export default function render25d(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
) {
  const camera = settings.camera;
  const allSegments = removeDuplicateSegments(settings.level.linedefs);
  const bspTree = buildBSPTree(allSegments);

  const wallRanges = createSolidWallRanges(camera);
  const upperClip = createColumnClip(camera);
  const lowerClip = createColumnClip(camera);

  traverseBSPTree(bspTree, camera, (bspNode: BSPLeaf) => {
    for (const seg of bspNode.segs) {
      const sector = seg.frontSector!;

      const projection = projectSeg(camera, sector, seg);

      if (!projection) {
        continue;
      }

      if (isPortal(seg)) {
        drawPortalSegment(ctx, camera, seg, projection, wallRanges, upperClip, lowerClip);
      } else {
        drawSolidSegment(ctx, camera, seg, projection, wallRanges, upperClip, lowerClip);
      }
    }
  });
}
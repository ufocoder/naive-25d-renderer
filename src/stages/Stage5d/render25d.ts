
import { getPointSide } from "@app/stages/Stage3b/bsp/geometry";
import { traverseBSPTree } from "@app/stages/Stage3b/bsp/traverse";
import type { BSPLeaf, BSPNode } from "@app/stages/Stage3b/bsp/typings";
import { calculateIntersectionAngles, projectSegX, projectSegY, type IntersectionAngles } from "./projection";
import { getTextureColor, textures, type Color } from "../Stage5b/textures";

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
  buffer: ImageData,
  x: number,
  topY: number,
  bottomY: number,
  color: Color
): void {
  if (topY >= bottomY) return;
  for (let y = topY; y < bottomY; y++) {
    drawPixel(buffer, x, y, color);
  }
}

function drawPixel(
  buffer: ImageData,
  x: number,
  y: number,
  color: Color
): void {
  const index = (y * buffer.width + x) * 4;

  buffer.data[index] = color.r;
  buffer.data[index + 1] = color.g;
  buffer.data[index + 2] = color.b;
  buffer.data[index + 3] = 255;
}

function createSolidWallRanges(camera: Camera) {
  const ranges: SolidSegmentRange[] = [];

  ranges.push({ xStart: Number.MIN_SAFE_INTEGER, xEnd: -1 });
  ranges.push({ xStart: camera.screen.width, xEnd: Number.MAX_SAFE_INTEGER });

  return ranges;
}

function getInterpolationFactor(
  camera: Camera,
  angles: IntersectionAngles,
  screenX: number,
): number {
  const fov = camera.fov.degrees;
  const screenWidth = camera.screen.width;
  const angle = angles.cameraFrom + (screenX / screenWidth) * fov;
  const t = (angle - angles.linedefFrom) / (angles.linedefTo - angles.linedefFrom);
  
  return Math.max(0, Math.min(1, t));
}

function drawTexturedFloorCeil(
  imageData: ImageData,
  camera: Camera,
  sector: Sector,
  x: number,
  yStart: number,
  yEnd: number,
  isFloor: boolean
): void {
  const textureName = isFloor ? sector.floorTexture : sector.ceilTexture;
  if (!textureName) return;
  
  const texture = textures[textureName];
  if (!texture) return;

  const cameraZ = camera.z ?? 0;
  const floorHeight = sector.floorHeight ?? 0;
  const ceilHeight = sector.ceilHeight ?? 0;

  // Расстояние от камеры до плоскости (всегда положительное для корректных лучей)
  let distToPlane: number;
  let isLookingUp: boolean; // true для потолка (луч идёт вверх), false для пола (луч идёт вниз)
  
  if (isFloor) {
    // Пол: камера выше пола
    distToPlane = cameraZ - floorHeight;
    isLookingUp = false;
  } else {
    // Потолок: камера ниже потолка
    distToPlane = ceilHeight - cameraZ;
    isLookingUp = true;
  }
  
  if (distToPlane <= 0.001) return;

  const screenHeight = camera.screen.height;
  const screenWidth = camera.screen.width;
  const halfHeight = screenHeight / 2;
  
  // Направление взгляда
  const dirX = camera.angle.cos;
  const dirY = camera.angle.sin;
  
  // Векторы для плоскости проекции
  const planeLength = Math.tan(camera.fov.radians / 2);
  const planeX = -dirY * planeLength;
  const planeY = dirX * planeLength;
  
  for (let y = yStart; y < yEnd && y < screenHeight; y++) {
    // p - расстояние от центра экрана в пикселях
    // Y идёт СВЕРХУ ВНИЗ: выше центра → p < 0, ниже центра → p > 0
    const p = y - halfHeight;
    if (Math.abs(p) < 0.001) continue;
    
    // Определяем, смотрим ли мы в нужную сторону
    // Для потолка (isLookingUp = true) нужно p < 0 (выше центра)
    // Для пола (isLookingUp = false) нужно p > 0 (ниже центра)
    if (isLookingUp && p > 0) continue;
    if (!isLookingUp && p < 0) continue;
    
    // rowDistance всегда положительное, используем abs(p)
    const rowDistance = distToPlane / Math.abs(p);
    
    // Рассчитываем направление луча для текущего x
    const t = x / screenWidth;
    
    const rayDirX = dirX + planeX * (2 * t - 1);
    const rayDirY = dirY + planeY * (2 * t - 1);
    
    const worldX = camera.x + rayDirX * rowDistance;
    const worldY = camera.y + rayDirY * rowDistance;
    
    let texX = (worldX / texture.scale) % 1;
    let texY = (worldY / texture.scale) % 1;
    
    if (texX < 0) texX += 1;
    if (texY < 0) texY += 1;

    let tx = Math.floor(texX * texture.width);
    let ty = Math.floor(texY * texture.height);
    
    tx = Math.min(tx, texture.width - 1);
    ty = Math.min(ty, texture.height - 1);
    
    const color = getTextureColor(texture, tx, ty);
    
    drawPixel(imageData, x, y, color);
  }
}

function drawSolidSegment(
  buffer: ImageData,
  camera: Camera, 
  seg: Seg,
  angles: IntersectionAngles, 
  solidWallRanges: SolidSegmentRange[],
  upperClip: number[],
  lowerClip: number[],
) {
  const sector = seg.frontSector!;
  const wallColor = sector.wallColor!;
  const wallTexture = sector.wallTexture;
  const floorColor = sector.floorColor!;
  const ceilColor = sector.ceilColor!;

  const projectionX = projectSegX(camera, angles);
  const projectionY = projectSegY(camera, projectionX, sector, seg);

  const xStart = projectionX.start;
  const xEnd = projectionX.end;
  
  if (Math.abs(xEnd - xStart) < 0.001) return;

  const startTop = projectionY.start.top;
  const startBottom = projectionY.start.bottom;
  const endTop = projectionY.end.top;
  const endBottom = projectionY.end.bottom;

  const xFrom = Math.max(0, Math.floor(Math.min(xStart, xEnd)));
  const xTo = Math.min(camera.screen.width - 1, Math.ceil(Math.max(xStart, xEnd)));
  
  for (let x = xFrom; x <= xTo; x++) {
    if (!isWallVisible(x, solidWallRanges)) continue;
    
    const tx = getInterpolationFactor(camera, angles, x);
    const ty = (x - xStart) / (xEnd - xStart);
    const top = startTop + (endTop - startTop) * ty;
    const bottom = startBottom + (endBottom - startBottom) * ty;
    
    let drawTop = Math.max(upperClip[x], Math.ceil(top));
    let drawBottom = Math.min(lowerClip[x], Math.floor(bottom));
    
    if (drawTop >= drawBottom) continue;

    if (drawTop > upperClip[x]) {
      if (sector.ceilTexture) {
        drawTexturedFloorCeil(buffer, camera, sector, x, upperClip[x], drawTop, false);
      } else {
        drawVerticalLine(buffer, x, upperClip[x], drawTop, ceilColor);
      }
    }

    if (wallTexture) {
      const texture = textures[wallTexture];
      const texX = Math.floor(tx * texture.width);
      
      for (let y = drawTop; y < drawBottom; y++) {
        const v = (y - top) / (bottom - top);
        const texY = Math.floor(v * texture.height) % texture.height;        
        const color = getTextureColor(texture, texX, texY);
        
        drawPixel(buffer, x, y, color);
      }
    } else {
      drawVerticalLine(buffer, x, drawTop, drawBottom, wallColor);
    }

    if (drawBottom < lowerClip[x]) {
      if (sector.floorTexture) {
        drawTexturedFloorCeil(buffer, camera, sector, x, drawBottom, lowerClip[x], true);
      } else {
        drawVerticalLine(buffer, x, drawBottom, lowerClip[x], floorColor);
      }
    }

    upperClip[x] = drawTop;
    lowerClip[x] = drawBottom;
  }

  addSolidRange(camera, xStart, xEnd, solidWallRanges);
}

type PortalWallType = 'none' | 'upper' | 'lower' | 'both';

function getPortalWallType(currentSector: Sector, otherSector: Sector): PortalWallType {
  const ceilDiff = currentSector.ceilHeight! - otherSector.ceilHeight!;
  const floorDiff = currentSector.floorHeight! - otherSector.floorHeight!;
  
  const hasUpper = Math.abs(ceilDiff) > 0.01;
  const hasLower = Math.abs(floorDiff) > 0.01;
  
  if (hasUpper && hasLower) return 'both';
  if (hasUpper) return 'upper';
  if (hasLower) return 'lower';

  return 'none';
}

function drawPortalSegment(
  buffer: ImageData,
  camera: Camera, 
  seg: Seg,
  angles: IntersectionAngles, 
  solidWallRanges: SolidSegmentRange[],
  upperClip: number[],
  lowerClip: number[],
) {
  const frontSector = seg.frontSector!;
  const backSector = seg.backSector!;
  
  const projectionX = projectSegX(camera, angles);
  const xStart = projectionX.start;
  const xEnd = projectionX.end;
  const xFrom = Math.max(0, Math.floor(Math.min(xStart, xEnd)));
  const xTo = Math.min(camera.screen.width - 1, Math.ceil(Math.max(xStart, xEnd)));

  const cameraSide = getPointSide(seg, { x: camera.x, y: camera.y });
  const isFront = cameraSide >= 0;
  const currentSector = isFront ? frontSector : backSector;
  const otherSector = isFront ? backSector : frontSector;

  const frontProjectionY = projectSegY(camera, projectionX, frontSector, seg);
  const backProjectionY = projectSegY(camera, projectionX, backSector, seg);
  const portalWallType = getPortalWallType(currentSector, otherSector);

  for (let x = xFrom; x <= xTo; x++) {
    if (!isWallVisible(x, solidWallRanges)) {
      continue;
    }

    const ty = (x - xStart) / (xEnd - xStart);
    const tx = getInterpolationFactor(camera, angles, x);

    let frontTop, frontBottom, backTop, backBottom;

    if (Math.abs(xEnd - xStart) < 0.001) {
      frontTop = frontProjectionY.start.top;
      frontBottom = frontProjectionY.start.bottom;
      backTop = backProjectionY.start.top;
      backBottom = backProjectionY.start.bottom;
    } else {
      frontTop = frontProjectionY.start.top + (frontProjectionY.end.top - frontProjectionY.start.top) * ty;
      frontBottom = frontProjectionY.start.bottom + (frontProjectionY.end.bottom - frontProjectionY.start.bottom) * ty;
      backTop = backProjectionY.start.top + (backProjectionY.end.top - backProjectionY.start.top) * ty;
      backBottom = backProjectionY.start.bottom + (backProjectionY.end.bottom - backProjectionY.start.bottom) * ty;
    }

    const portalTop = Math.ceil(isFront ? frontTop : backTop);
    const portalBottom = Math.floor(isFront ? frontBottom : backBottom);
    const otherTop = Math.ceil(isFront ? backTop : frontTop);
    const otherBottom = Math.floor(isFront ? backBottom : frontBottom);

    const oldTop = upperClip[x];
    const oldBottom = lowerClip[x];

    const drawTop = Math.max(oldTop, portalTop);
    const drawBottom = Math.min(oldBottom, portalBottom);

    if (drawTop >= drawBottom) {
      continue;
    }

    if (drawTop > oldTop) {
      if (currentSector.ceilTexture) {
        drawTexturedFloorCeil(buffer, camera, currentSector, x, oldTop, drawTop, false);
      } else {
        drawVerticalLine(buffer, x, Math.floor(oldTop), drawTop, currentSector.ceilColor!);
      }
      upperClip[x] = drawTop;
    }

    if (portalWallType === 'upper' || portalWallType === 'both') {
      const wallTop = drawTop;
      const wallBottom = Math.min(drawBottom, Math.max(drawTop, otherTop));
      const wallTexture = otherSector.wallTexture;
      if (wallTop < wallBottom) {
        if (wallTexture) {
          const texture = textures[wallTexture];
          const texX = Math.floor(tx * texture.width);
          const yFrom = Math.max(drawTop, 0);
          const yTo = Math.min(drawBottom, camera.screen.height);
          
          for (let y = yFrom; y < yTo; y++) {
            const v = (y - portalTop) / (portalBottom - portalTop);
            const texY = Math.floor(v * texture.height) % texture.height;
            const color = getTextureColor(texture, texX, texY);
            drawPixel(buffer, x, y, color);
          }
        } else {
          drawVerticalLine(buffer, x, Math.floor(wallTop), Math.ceil(wallBottom), otherSector.wallColor!);
        }
        upperClip[x] = wallBottom;
      }
    }

    if (portalWallType === 'lower' || portalWallType === 'both') {
      const wallTop = Math.max(drawTop, Math.min(drawBottom, otherBottom));
      const wallBottom = drawBottom;
      const wallTexture = otherSector.wallTexture;

      if (wallTop < wallBottom) {
        if (wallTexture) {
          const texture = textures[wallTexture];
          const texX = Math.floor(tx * texture.width);
          const yFrom = Math.max(drawTop, 0);
          const yTo = Math.min(drawBottom, camera.screen.height);
          
          for (let y = yFrom; y < yTo; y++) {
            const v = (y - portalTop) / (portalBottom - portalTop);
            const texY = Math.floor(v * texture.height) % texture.height;
            const color = getTextureColor(texture, texX, texY);
            drawPixel(buffer, x, y, color);
          }
        } else {
          drawVerticalLine(buffer, x, Math.floor(wallTop), Math.ceil(wallBottom), otherSector.wallColor!);
        }
        lowerClip[x] = wallTop;
      }
    }

    if (drawBottom < oldBottom) {
      if (currentSector.floorTexture) {
        drawTexturedFloorCeil(buffer, camera, currentSector, x, drawBottom, oldBottom, true);
      } else {
        drawVerticalLine(buffer, x, drawBottom, Math.ceil(oldBottom), currentSector.floorColor!);
      }
      lowerClip[x] = drawBottom;
    }

    upperClip[x] = Math.max(upperClip[x], Math.max(drawTop, otherTop));
    lowerClip[x] = Math.min(lowerClip[x], Math.min(drawBottom, otherBottom));
  }
}

export function createRender25d({ bspTree }: { bspTree: BSPNode }) {
  return function render25d(
    ctx: CanvasRenderingContext2D,
    settings: Settings,
  ) {
    const camera = settings.camera;
    const buffer = ctx.createImageData(camera.screen.width, camera.screen.height);

    for (let i = 0; i < buffer.data.length; i += 4) {
      buffer.data[i] = 0;
      buffer.data[i + 1] = 0;
      buffer.data[i + 2] = 0;
      buffer.data[i + 3] = 255;
    }

    const wallRanges = createSolidWallRanges(camera);
    const upperClip = new Array(camera.screen.width).fill(-1);
    const lowerClip = new Array(camera.screen.width).fill(camera.screen.height);

    traverseBSPTree(bspTree, camera, (bspNode: BSPLeaf) => {
      for (const seg of bspNode.segs) {
        const angles = calculateIntersectionAngles(seg, camera);

        if (!angles) {
          continue;
        }

        if (isPortal(seg)) {
          drawPortalSegment(buffer, camera, seg, angles, wallRanges, upperClip, lowerClip);
        } else {
          drawSolidSegment(buffer, camera, seg, angles, wallRanges, upperClip, lowerClip);
        }
      }
    });

    ctx.putImageData(buffer, 0, 0);
  };
}
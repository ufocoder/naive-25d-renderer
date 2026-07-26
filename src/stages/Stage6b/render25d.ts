
import { getPointSide } from "@app/stages/Stage3b/bsp/geometry";
import { traverseBSPTree } from "@app/stages/Stage3b/bsp/traverse";
import type { BSPLeaf, BSPNode } from "@app/stages/Stage3b/bsp/typings";
import { calculateIntersectionAngles, projectSegX, projectSegY, type IntersectionAngles } from "./projection";
import { getTextureColor, textures, type Color, type Texture } from "./textures";

function isPortal(seg: Seg): boolean {
  return Boolean(seg.isTwoSide && seg.backSector && seg.backSector !== seg.frontSector);
}

interface SolidSegmentRange {
  xStart: number;
  xEnd: number;
}

interface ScreenRect {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
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

function scaleTextureToWidth(
  texture: { width: number; height: number },
  xCenter: number,
  yBottom: number,
  width: number,
): ScreenRect {
  const textureWidth = Math.max(1, Math.round(width));
  const textureHeight = Math.max(1, Math.round(textureWidth * (texture.height / texture.width)));
  const x1 = Math.floor(xCenter - textureWidth / 2);
  const y2 = Math.ceil(yBottom);

  return {
    x1,
    x2: x1 + textureWidth,
    y1: y2 - textureHeight,
    y2,
  };
}

function fitTextureIntoBounds(textureRect: ScreenRect, bounds: ScreenRect): ScreenRect | null {
  const rect = {
    x1: Math.max(textureRect.x1, bounds.x1),
    x2: Math.min(textureRect.x2, bounds.x2),
    y1: Math.max(textureRect.y1, bounds.y1),
    y2: Math.min(textureRect.y2, bounds.y2),
  };

  if (rect.x1 >= rect.x2 || rect.y1 >= rect.y2) {
    return null;
  }

  return rect;
}

function drawRectOutline(
  buffer: ImageData,
  x1: number,
  x2: number,
  y1: number,
  y2: number,
  color: Color,
): void {
  const left = Math.max(0, x1);
  const right = Math.min(buffer.width - 1, x2 - 1);
  const top = Math.max(0, y1);
  const bottom = Math.min(buffer.height - 1, y2 - 1);

  if (left > right || top > bottom) return;

  for (let x = left; x <= right; x++) {
    drawPixel(buffer, x, top, color);
    drawPixel(buffer, x, bottom, color);
  }

  for (let y = top; y <= bottom; y++) {
    drawPixel(buffer, left, y, color);
    drawPixel(buffer, right, y, color);
  }
}

function drawProjectedItem(
    buffer: ImageData,
    projected: ProjectedItem
): void {
    const { x1, x2, y1, y2, textureX1, textureX2, textureY1, textureY2, drawX1, drawX2, drawY1, drawY2, distance } = projected;
    
    if (distance < 0.1 || x1 >= x2 || y1 >= y2) return;

    const texture = textures.health_sprite;
    const textureWidth = textureX2 - textureX1;
    const textureHeight = textureY2 - textureY1;

    if (textureWidth > 0 && textureHeight > 0) {
      for (let x = drawX1; x < drawX2; x++) {
        for (let y = drawY1; y < drawY2; y++) {
            const tx = Math.floor(((x - textureX1) / textureWidth) * texture.width);
            const ty = Math.floor(((y - textureY1) / textureHeight) * texture.height);
            const color = getTextureColor(texture, tx, ty);

            if (color.a === 0) {
              continue;
            }

            drawPixel(buffer, x, y, applyBrightness(color, projected.sector.brightness));
        }
      }
    }

    drawRectOutline(buffer, x1, x2, y1, y2, { r: 80, g: 220, b: 255 });
}

function cross(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

function getWallTextureX(camera: Camera, seg: Seg, screenX: number, texture: Texture): number {
  const dirX = camera.angle.cos;
  const dirY = camera.angle.sin;
  const planeLength = Math.tan(camera.fov.radians / 2);
  const planeX = -dirY * planeLength;
  const planeY = dirX * planeLength;
  const t = screenX / camera.screen.width;
  const rayDirX = dirX + planeX * (2 * t - 1);
  const rayDirY = dirY + planeY * (2 * t - 1);

  const segX = seg.end.x - seg.start.x;
  const segY = seg.end.y - seg.start.y;
  const denominator = cross(rayDirX, rayDirY, segX, segY);

  if (Math.abs(denominator) < 0.001) {
    return 0;
  }

  const toSegX = seg.start.x - camera.x;
  const toSegY = seg.start.y - camera.y;
  const segFactor = cross(toSegX, toSegY, rayDirX, rayDirY) / denominator;
  const segLength = Math.hypot(segX, segY);
  const worldDistanceOnWall = segFactor * segLength;

  return Math.floor((worldDistanceOnWall / texture.scale) * texture.width);
}

function applyBrightness(color: Color, brightness: number = 1): Color {
  if (brightness >= 1.0) {
    return color;
  }

  return {
    r: Math.min(255, Math.floor(color.r * brightness)),
    g: Math.min(255, Math.floor(color.g * brightness)),
    b: Math.min(255, Math.floor(color.b * brightness))
  };
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
    
    // Луч от левого края (t=0) до правого (t=1)
    const rayDirX = dirX + planeX * (2 * t - 1);
    const rayDirY = dirY + planeY * (2 * t - 1);
    
    // Мировые координаты точки на плоскости
    const worldX = camera.x + rayDirX * rowDistance;
    const worldY = camera.y + rayDirY * rowDistance;
    
    // Координаты текстуры с учётом масштаба
    let texX = (worldX / texture.scale) % 1;
    let texY = (worldY / texture.scale) % 1;
    
    // Корректировка для отрицательных значений
    if (texX < 0) texX += 1;
    if (texY < 0) texY += 1;
    
    // Преобразуем в пиксельные координаты текстуры
    let tx = Math.floor(texX * texture.width);
    let ty = Math.floor(texY * texture.height);
    
    tx = Math.min(tx, texture.width - 1);
    ty = Math.min(ty, texture.height - 1);
    
    const color = getTextureColor(texture, tx, ty);

    drawPixel(imageData, x, y, applyBrightness(color, sector.brightness));
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
      const texX = getWallTextureX(camera, seg, x, texture);
      
      for (let y = drawTop; y < drawBottom; y++) {
        const v = (y - top) / (bottom - top);
        const texY = Math.floor(v * texture.height) % texture.height;        
        const color = getTextureColor(texture, texX, texY);
        
        drawPixel(buffer, x, y, applyBrightness(color, sector.brightness));
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
      const wallTop = portalTop;
      const wallBottom = otherTop;
      const visibleTop = Math.max(drawTop, wallTop);
      const visibleBottom = Math.min(drawBottom, wallBottom);
      const wallTexture = otherSector.wallTexture;
      if (visibleTop < visibleBottom) {
        if (wallTexture) {
          const texture = textures[wallTexture];
          const texX = getWallTextureX(camera, seg, x, texture);
          const yFrom = Math.max(Math.ceil(visibleTop), 0);
          const yTo = Math.min(Math.floor(visibleBottom), camera.screen.height);
          
          for (let y = yFrom; y < yTo; y++) {
            const v = (y - wallTop) / (wallBottom - wallTop);
            const texY = Math.floor(v * texture.height) % texture.height;
            const color = getTextureColor(texture, texX, texY);
            drawPixel(buffer, x, y, applyBrightness(color, otherSector.brightness));
          }
        } else {
          drawVerticalLine(buffer, x, Math.floor(visibleTop), Math.ceil(visibleBottom), otherSector.wallColor!);
        }
        upperClip[x] = visibleBottom;
      }
    }

    if (portalWallType === 'lower' || portalWallType === 'both') {
      const wallTop = otherBottom;
      const wallBottom = portalBottom;
      const visibleTop = Math.max(drawTop, wallTop);
      const visibleBottom = Math.min(drawBottom, wallBottom);
      const wallTexture = otherSector.wallTexture;

      if (visibleTop < visibleBottom) {
        if (wallTexture) {
          const texture = textures[wallTexture];
          const texX = getWallTextureX(camera, seg, x, texture);
          const yFrom = Math.max(Math.ceil(visibleTop), 0);
          const yTo = Math.min(Math.floor(visibleBottom), camera.screen.height);
          
          for (let y = yFrom; y < yTo; y++) {
            const v = (y - wallTop) / (wallBottom - wallTop);
            const texY = Math.floor(v * texture.height) % texture.height;
            const color = getTextureColor(texture, texX, texY);
            drawPixel(buffer, x, y, applyBrightness(color, otherSector.brightness));
          }
        } else {
          drawVerticalLine(buffer, x, Math.floor(visibleTop), Math.ceil(visibleBottom), otherSector.wallColor!);
        }
        lowerClip[x] = visibleTop;
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

interface ProjectedItem {
    item: Item;
    sector: Sector;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    textureX1: number;
    textureX2: number;
    textureY1: number;
    textureY2: number;
    drawX1: number;
    drawX2: number;
    drawY1: number;
    drawY2: number;
    distance: number;
    floorHeight: number;
    screenX: number;
}

function calculateItemScreenX(camera: Camera, item: Item): { screenX: number; distance: number; screenHalfWidth: number } | null {
    const dx = item.x - camera.x;
    const dy = item.y - camera.y;
    const forwardDistance = dx * camera.angle.cos + dy * camera.angle.sin;
    const distanceToCenter = Math.hypot(dx, dy);
    const safeDistanceToCenter = Math.max(distanceToCenter, 1);
    const radius = item.radius ?? 10;
    const isInsideRadius = distanceToCenter <= radius;

    if (!isInsideRadius && forwardDistance < 0.1) return null;
    
    const angleToItem = distanceToCenter < 0.001
      ? camera.angle.degrees
      : Math.atan2(dy, dx) * 180 / Math.PI;
    let relativeAngle = angleToItem - camera.angle.degrees;
    
    while (relativeAngle > 180) relativeAngle -= 360;
    while (relativeAngle < -180) relativeAngle += 360;
    
    const halfFov = camera.fov.degrees / 2;
    const itemAngularRadius = Math.atan2(radius, safeDistanceToCenter) * 180 / Math.PI;
    if (!isInsideRadius && Math.abs(relativeAngle) > halfFov + itemAngularRadius) return null;
    
    const screenX = (relativeAngle / camera.fov.degrees) * camera.screen.width + camera.screen.width / 2;
    const screenHalfWidth = (itemAngularRadius / camera.fov.degrees) * camera.screen.width;
    
    return { screenX, distance: safeDistanceToCenter, screenHalfWidth };
}

function calculateItemBounds(camera: Camera, item: Item, sector: Sector): ProjectedItem | null {
    const result = calculateItemScreenX(camera, item);

    if (!result) {
      return null;
    }
    
    const { screenX, distance, screenHalfWidth } = result;
    
    const projectionScale = 1 / Math.max(distance, 1);
    const screenCenterY = camera.screen.height / 2;
    const cameraZ = camera.z ?? 0;
    const floorZ = (sector.floorHeight ?? 0) + (item.z ?? 0);
    const ceilZ = sector.ceilHeight ?? floorZ;
    const screenBottomY = screenCenterY - (floorZ - cameraZ) * projectionScale;
    const screenCeilY = screenCenterY - (ceilZ - cameraZ) * projectionScale;
    const texture = textures.health_sprite;
    const textureRect = scaleTextureToWidth(texture, screenX, screenBottomY, screenHalfWidth * 2);
    const itemBounds = {
      x1: textureRect.x1,
      x2: textureRect.x2,
      y1: textureRect.y1,
      y2: textureRect.y2,
    };
    const sectorBounds = {
      x1: itemBounds.x1,
      x2: itemBounds.x2,
      y1: Math.ceil(screenCeilY),
      y2: itemBounds.y2,
    };
    const screenBounds = {
      x1: 0,
      x2: camera.screen.width,
      y1: 0,
      y2: camera.screen.height,
    };
    const visibleBounds = fitTextureIntoBounds(itemBounds, screenBounds);
    const sectorVisibleBounds = fitTextureIntoBounds(sectorBounds, screenBounds);

    if (!visibleBounds || !sectorVisibleBounds) {
      return null;
    }

    const textureInnerRect = {
      x1: textureRect.x1 + 1,
      x2: textureRect.x2 - 1,
      y1: textureRect.y1 + 1,
      y2: textureRect.y2 - 1,
    };
    const itemInnerBounds = {
      x1: sectorBounds.x1 + 1,
      x2: sectorBounds.x2 - 1,
      y1: sectorBounds.y1 + 1,
      y2: sectorBounds.y2 - 1,
    };
    const drawBounds = fitTextureIntoBounds(textureInnerRect, itemInnerBounds);
    const visibleDrawBounds = drawBounds ? fitTextureIntoBounds(drawBounds, screenBounds) : null;

    if (!visibleDrawBounds) {
      return null;
    }

    return {
        item,
        sector,
        x1: itemBounds.x1,
        x2: itemBounds.x2,
        y1: itemBounds.y1,
        y2: itemBounds.y2,
        textureX1: textureInnerRect.x1,
        textureX2: textureInnerRect.x2,
        textureY1: textureInnerRect.y1,
        textureY2: textureInnerRect.y2,
        drawX1: visibleDrawBounds.x1,
        drawX2: visibleDrawBounds.x2,
        drawY1: visibleDrawBounds.y1,
        drawY2: visibleDrawBounds.y2,
        distance,
        floorHeight: sector.floorHeight ?? 0,
        screenX
    };
}

function getSectorKey(sector: Sector) {
  return sector.id ?? sector;
}

function collectSectorItems(
  projectedItems: ProjectedItem[],
  camera: Camera,
  sector: Sector | undefined,
  collectedSectors: Set<number | Sector>,
) {
  if (!sector?.items?.length) {
    return;
  }

  const key = getSectorKey(sector);

  if (collectedSectors.has(key)) {
    return;
  }

  collectedSectors.add(key);

  for (const item of sector.items) {
    const projected = calculateItemBounds(camera, item, sector);
    if (projected) {
      projectedItems.push(projected);
    }
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
    const projectedItems: ProjectedItem[] = [];
    const collectedItemSectors = new Set<number | Sector>();

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

        collectSectorItems(projectedItems, camera, seg.frontSector, collectedItemSectors);
      }
    });

    projectedItems
      .sort((a, b) => b.distance - a.distance)
      .forEach((projected) => drawProjectedItem(buffer, projected));

    ctx.putImageData(buffer, 0, 0);
  };
}

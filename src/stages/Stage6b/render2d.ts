import { Angle } from "@app/lib/Angle";
import { drawCircle, drawLinedef } from "@app/lib/canvas";

const VERTEX_DOT_SIZE = 2;
const CAMERA_DOT_SIZE = 5;

function worldToScreen(
  worldX: number,
  worldY: number,
  scale: number,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  return {
    x: worldX * scale + offsetX,
    y: worldY * scale + offsetY
  };
}

function getIntersectionWithCanvasEdges(
  fromX: number,
  fromY: number,
  angle: Angle,
  canvasWidth: number,
  canvasHeight: number
): { x: number, y: number } {
  const dirX = angle.cos;
  const dirY = angle.sin;
  
  const intersections: { x: number, y: number, t: number }[] = [];
  
  if (dirX > 0) {
    const t = (canvasWidth - fromX) / dirX;
    if (t > 0) {
      const y = fromY + t * dirY;
      if (y >= 0 && y <= canvasHeight) {
        intersections.push({ x: canvasWidth, y, t });
      }
    }
  } else if (dirX < 0) {
    const t = (0 - fromX) / dirX;
    if (t > 0) {
      const y = fromY + t * dirY;
      if (y >= 0 && y <= canvasHeight) {
        intersections.push({ x: 0, y, t });
      }
    }
  }
  
  if (dirY > 0) {
    const t = (canvasHeight - fromY) / dirY;
    if (t > 0) {
      const x = fromX + t * dirX;
      if (x >= 0 && x <= canvasWidth) {
        intersections.push({ x, y: canvasHeight, t });
      }
    }
  } else if (dirY < 0) {
    const t = (0 - fromY) / dirY;
    if (t > 0) {
      const x = fromX + t * dirX;
      if (x >= 0 && x <= canvasWidth) {
        intersections.push({ x, y: 0, t });
      }
    }
  }
  
  if (intersections.length === 0) {
    const maxDim = Math.max(canvasWidth, canvasHeight) * 2;
    return {
      x: fromX + dirX * maxDim,
      y: fromY + dirY * maxDim
    };
  }
  
  const closest = intersections.reduce((min, curr) => curr.t < min.t ? curr : min);
  
  return {
    x: closest.x,
    y: closest.y
  };
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.save();
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  const worldLeft = (-offsetX) / scale;
  const worldTop = (-offsetY) / scale;
  const worldRight = (canvasWidth - offsetX) / scale;
  const worldBottom = (canvasHeight - offsetY) / scale;
  
  // Динамический шаг сетки
  const minScreenSpacing = 30; // минимальное расстояние между линиями в пикселях
  let gridSize = Math.max(0.1, minScreenSpacing / scale);
  
  // Округление до 1, 2, 5, 10, 20, 50...
  const exponent = Math.pow(10, Math.floor(Math.log10(gridSize)));
  const fraction = gridSize / exponent;
  if (fraction < 2) gridSize = 1 * exponent;
  else if (fraction < 5) gridSize = 2 * exponent;
  else gridSize = 5 * exponent;
  
  const startX = Math.floor(worldLeft / gridSize) * gridSize;
  const startY = Math.floor(worldTop / gridSize) * gridSize;
  const endX = Math.ceil(worldRight / gridSize) * gridSize;
  const endY = Math.ceil(worldBottom / gridSize) * gridSize;
  
  for (let x = startX; x <= endX; x += gridSize) {
    const screenX = x * scale + offsetX;
    if (screenX >= 0 && screenX <= canvasWidth) {
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, canvasHeight);
      ctx.stroke();
    }
  }
  
  for (let y = startY; y <= endY; y += gridSize) {
    const screenY = y * scale + offsetY;
    if (screenY >= 0 && screenY <= canvasHeight) {
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(canvasWidth, screenY);
      ctx.stroke();
    }
  }
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#c0c0c0";
  
  const originYScreen = 0 * scale + offsetY;
  if (originYScreen >= 0 && originYScreen <= canvasHeight) {
    ctx.beginPath();
    ctx.moveTo(0, originYScreen);
    ctx.lineTo(canvasWidth, originYScreen);
    ctx.stroke();
  }
  
  const originXScreen = 0 * scale + offsetX;
  if (originXScreen >= 0 && originXScreen <= canvasWidth) {
    ctx.beginPath();
    ctx.moveTo(originXScreen, 0);
    ctx.lineTo(originXScreen, canvasHeight);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawLine(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

export default function render2d(
  ctx: CanvasRenderingContext2D, 
  settings: Settings,
  scale: number = 1,
  offsetX: number = 0,
  offsetY: number = 0
) {
  const camera = settings.camera;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  drawGrid(ctx, offsetX, offsetY, scale, canvasWidth, canvasHeight);

  for (const linedef of settings.level.linedefs) {
    const startPosition = worldToScreen(
      linedef.start.x,
      linedef.start.y,
      scale,
      offsetX,
      offsetY
    );
    
    const endPosition = worldToScreen(
      linedef.end.x,
      linedef.end.y,
      scale,
      offsetX,
      offsetY
    );
    
    drawLinedef(ctx, { start: startPosition, end: endPosition });

    drawCircle(ctx, startPosition.x, startPosition.y, VERTEX_DOT_SIZE);
    drawCircle(ctx, endPosition.x, endPosition.y, VERTEX_DOT_SIZE);
  }

  const items = settings.level.sectors?.map(s => s.items || []).flat() || [];

  for (const item of items) {
    const itemPosition = worldToScreen(
      item.x,
      item.y,
      scale,
      offsetX,
      offsetY
    );

    drawCircle(ctx, itemPosition.x, itemPosition.y, item.radius, 'green');
  }

  const cameraPosition = worldToScreen(
    camera.x,
    camera.y,
    scale,
    offsetX,
    offsetY,
  );

  const leftAngle = new Angle(camera.angle.degrees - camera.fov.degrees / 2);
  const centerAngle = camera.angle;
  const rightAngle = new Angle(camera.angle.degrees + camera.fov.degrees / 2);
  
  const leftRayEnd = getIntersectionWithCanvasEdges(
    cameraPosition.x,
    cameraPosition.y,
    leftAngle,
    canvasWidth,
    canvasHeight
  );
  
  const centerRayEnd = getIntersectionWithCanvasEdges(
    cameraPosition.x,
    cameraPosition.y,
    centerAngle,
    canvasWidth,
    canvasHeight
  );
  
  const rightRayEnd = getIntersectionWithCanvasEdges(
    cameraPosition.x,
    cameraPosition.y,
    rightAngle,
    canvasWidth,
    canvasHeight
  );
  
  ctx.save();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  drawLine(ctx, cameraPosition.x, cameraPosition.y, leftRayEnd.x, leftRayEnd.y);
  drawLine(ctx, cameraPosition.x, cameraPosition.y, centerRayEnd.x, centerRayEnd.y);
  drawLine(ctx, cameraPosition.x, cameraPosition.y, rightRayEnd.x, rightRayEnd.y);
  
  ctx.restore();

  drawCircle(ctx, cameraPosition.x, cameraPosition.y, CAMERA_DOT_SIZE, 'red');
}

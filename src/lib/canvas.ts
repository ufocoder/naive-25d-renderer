import type { Angle } from "./Angle";

export function drawPolygon(ctx: CanvasRenderingContext2D, points: Vertex[], fillColor = '#3498db', strokeColor = '#2980b9') {
    ctx.beginPath();
    
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';

    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    
    ctx.fill();
    ctx.stroke();
}

export function drawLinedef(ctx: CanvasRenderingContext2D, linedef: Linedef, color = 'black', lineSize = 1) {
  ctx.beginPath(); 
  ctx.moveTo(linedef.start.x, linedef.start.y);
  ctx.lineTo(linedef.end.x, linedef.end.y);
  ctx.closePath();
  ctx.lineWidth = lineSize;
  ctx.strokeStyle = color;
  ctx.stroke();
}

export function drawAngleLine(ctx: CanvasRenderingContext2D, x: number, y: number, angle: Angle, len: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x + len * angle.cos,
    y + len * angle.sin,
  );
  ctx.strokeStyle = "blue";
  ctx.stroke();
}


export function drawPolygonDebug(
  ctx: CanvasRenderingContext2D, 
  points: Vertex[], 
  color: string = '#FF0000',
  lineWidth: number = 2,
  markerSize: number = 4
) {
  if (points.length < 3) return;
  
  ctx.save();
  
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.setLineDash([]);
  
  for (const point of points) {
    ctx.fillRect(
      point.x - markerSize / 2, 
      point.y - markerSize / 2, 
      markerSize, 
      markerSize
    );
  }
  
  ctx.restore();
}
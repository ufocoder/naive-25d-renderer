import type { Angle } from "./Angle";

export function drawPolygon(ctx: CanvasRenderingContext2D, points: Vertex[], fillColor = '#3498db', strokeColor = '#2980b9') {
    ctx.beginPath();
    
    // Move to first point
    ctx.moveTo(points[0].x, points[0].y);
    
    // Draw lines to remaining points
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

export function drawLinedef(ctx: CanvasRenderingContext2D, linedef: Linedef) {
  ctx.beginPath(); 
  ctx.moveTo(linedef.start.x, linedef.start.y);
  ctx.lineTo(linedef.end.x, linedef.end.y);
  ctx.closePath();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'black';
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

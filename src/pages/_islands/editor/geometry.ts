import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

type Viewport = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export function toScreen(point: Vertex, viewport: Viewport): Vertex {
  return {
    x: point.x * viewport.scale + viewport.offsetX,
    y: point.y * viewport.scale + viewport.offsetY,
  };
}

export function toWorld(point: Vertex, viewport: Viewport): Vertex {
  return {
    x: (point.x - viewport.offsetX) / viewport.scale,
    y: (point.y - viewport.offsetY) / viewport.scale,
  };
}

export function eventToCanvasPoint(event: MouseEvent, canvas: HTMLCanvasElement): Vertex {
  const rect = canvas.getBoundingClientRect();
  const contentWidth = canvas.clientWidth || rect.width;
  const contentHeight = canvas.clientHeight || rect.height;

  return {
    x: ((event.clientX - rect.left - canvas.clientLeft) / contentWidth) * CANVAS_WIDTH,
    y: ((event.clientY - rect.top - canvas.clientTop) / contentHeight) * CANVAS_HEIGHT,
  };
}

export function distanceToSegment(point: Vertex, linedef: Linedef): number {
  const ax = linedef.end.x - linedef.start.x;
  const ay = linedef.end.y - linedef.start.y;
  const len2 = ax * ax + ay * ay;

  if (len2 === 0) {
    return Math.hypot(point.x - linedef.start.x, point.y - linedef.start.y);
  }

  const rawT =
    ((point.x - linedef.start.x) * ax + (point.y - linedef.start.y) * ay) / len2;
  const t = Math.max(0, Math.min(1, rawT));
  const x = linedef.start.x + ax * t;
  const y = linedef.start.y + ay * t;

  return Math.hypot(point.x - x, point.y - y);
}

export function sameVertex(a: Vertex, b: Vertex): boolean {
  return a.x === b.x && a.y === b.y;
}

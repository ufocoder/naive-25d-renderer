export function createLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Linedef {
  return { start: { x: x1, y: y1 }, end: { x: x2, y: y2 } };
}

export function createLineX(x: number, y: number, size: number): Linedef {
  return { start: { x, y }, end: { x, y: y + size } };
}

export function createLineY(x: number, y: number, size: number): Linedef {
  return { start: { x, y }, end: { x: x + size, y } };
}

export function createColumn(x: number, y: number, size: number): Seg[] {
  const v1 = { x, y };
  const v2 = { x: x + size, y };
  const v3 = { x, y: y + size };
  const v4 = { x: x + size, y: y + size };

  return [
    { start: v1, end: v2 },
    { start: v2, end: v4 },
    { start: v4, end: v3 },
    { start: v3, end: v1 },
  ];
}

export function createCircleVertexes(
  centerX: number,
  centerY: number,
  radius: number,
  segments: number = 36,
): Vertex[] {
  const points: Vertex[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y });
  }

  return points;
}

export function createCircleLines(
  centerX: number,
  centerY: number,
  radius: number,
  segments: number = 36,
): Seg[] {
  const lines: Seg[] = [];
  const points: Vertex[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push({ x, y });
  }

  for (let i = 0; i < points.length; i++) {
    const start = points[i];
    const end = points[(i + 1) % points.length];
    lines.push({ start, end });
  }

  return lines;
}

export function createRectangleLines(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  color?: string,
): Seg[] {
  const halfW = width / 2;
  const halfH = height / 2;
  
  return [
    { 
      start: { x: centerX - halfW, y: centerY - halfH }, 
      end: { x: centerX + halfW, y: centerY - halfH },
      color
    }, // top
    { 
      start: { x: centerX + halfW, y: centerY - halfH }, 
      end: { x: centerX + halfW, y: centerY + halfH },
      color
    }, // right
    { 
      start: { x: centerX + halfW, y: centerY + halfH }, 
      end: { x: centerX - halfW, y: centerY + halfH },
      color
    }, // bottom
    { 
      start: { x: centerX - halfW, y: centerY + halfH }, 
      end: { x: centerX - halfW, y: centerY - halfH },
      color
    }, // left
  ];
}
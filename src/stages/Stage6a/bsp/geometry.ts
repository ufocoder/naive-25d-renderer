let nextSegId = 0;

export function generateSegId(): number {
  return nextSegId++;
}

export function resetSegIdCounter(): void {
  nextSegId = 0;
}

export function getPointSide(line: Seg, point: { x: number; y: number }): number {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  const px = point.x - line.start.x;
  const py = point.y - line.start.y;

  const cross = dx * py - dy * px;
  

  if (Math.abs(cross) < 0.0001) return 0;

  return cross > 0 ? 1 : -1;
}

export function computeBounds(segs: Seg[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (segs.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const seg of segs) {
    minX = Math.min(minX, seg.start.x, seg.end.x);
    minY = Math.min(minY, seg.start.y, seg.end.y);
    maxX = Math.max(maxX, seg.start.x, seg.end.x);
    maxY = Math.max(maxY, seg.start.y, seg.end.y);
  }
  
  return { minX, minY, maxX, maxY };
}

export function segmentIntersection(a: Seg, b: Seg): { x: number; y: number } | null {
  const x1 = a.start.x, y1 = a.start.y;
  const x2 = a.end.x, y2 = a.end.y;
  const x3 = b.start.x, y3 = b.start.y;
  const x4 = b.end.x, y4 = b.end.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  return null;
}

export function splitSegment(seg: Seg, point: { x: number; y: number }): [Seg, Seg] {
  const front: Seg = {
    id: generateSegId(),
    start: seg.start,
    end: point,
    frontSector: seg.frontSector,
    backSector: seg.backSector,
    isTwoSide: seg.isTwoSide
  };
  
  const back: Seg = {
    id: generateSegId(),
    start: point,
    end: seg.end,
    frontSector: seg.frontSector,
    backSector: seg.backSector,
    isTwoSide: seg.isTwoSide
  };
  
  return [front, back];
}

export function uniquePoints(points: Vertex[]): Vertex[] {
  const unique: { x: number; y: number }[] = [];
  for (const p of points) {
    if (!unique.some(u => Math.abs(u.x - p.x) < 0.1 && Math.abs(u.y - p.y) < 0.1)) {
      unique.push(p);
    }
  }
  return unique;
}

export function sortVerticesForConvexPolygon(segs: Seg[]): { x: number; y: number }[] {
  if (segs.length === 0) return [];
  
  const points: { x: number; y: number }[] = [];
  for (const seg of segs) {
    points.push({ x: seg.start.x, y: seg.start.y });
    points.push({ x: seg.end.x, y: seg.end.y });
  }
  
  const unique = uniquePoints(points);
  
  if (unique.length < 3) return unique;
  
  const center = {
    x: unique.reduce((sum, p) => sum + p.x, 0) / unique.length,
    y: unique.reduce((sum, p) => sum + p.y, 0) / unique.length
  };
  
  return unique.sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
}

export function isConvexPolygon(segs: Seg[]): boolean {
  if (segs.length < 3) return true;
  
  const vertices = sortVerticesForConvexPolygon(segs);

  if (vertices.length < 3) return true;
  
  let lastSign = 0;
  
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const c = vertices[(i + 2) % vertices.length];
    
    const dx1 = b.x - a.x;
    const dy1 = b.y - a.y;
    const dx2 = c.x - b.x;
    const dy2 = c.y - b.y;
    
    const cross = dx1 * dy2 - dy1 * dx2;
    const sign = cross > 0 ? 1 : (cross < 0 ? -1 : 0);
    
    if (i === 0) {
      lastSign = sign;
    } else if (sign !== 0 && lastSign !== 0 && sign !== lastSign) {
      return false;
    }
  }
  
  return true;
}

export function extendToInfiniteLine(seg: Seg): { start: { x: number; y: number }; end: { x: number; y: number } } {
  const dx = seg.end.x - seg.start.x;
  const dy = seg.end.y - seg.start.y;

  const len = Math.hypot(dx, dy);
  if (len < 0.0001) return { start: seg.start, end: seg.end };
  
  const dirX = dx / len;
  const dirY = dy / len;
  
  const extendedLen = 100000;
  
  return {
    start: {
      x: seg.start.x - dirX * extendedLen,
      y: seg.start.y - dirY * extendedLen
    },
    end: {
      x: seg.start.x + dirX * extendedLen,
      y: seg.start.y + dirY * extendedLen
    }
  };
}

export function lineIntersectionWithRay(
  line: Seg,
  segment: Seg,
  extendLine: boolean = true
): { x: number; y: number; t: number } | null {
  const x1 = line.start.x, y1 = line.start.y;
  const x2 = line.end.x, y2 = line.end.y;
  const x3 = segment.start.x, y3 = segment.start.y;
  const x4 = segment.end.x, y4 = segment.end.y;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null;
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  if (extendLine) {
    if (u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
        t: t
      };
    }
  } else {
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
        t: t
      };
    }
  }
  
  return null;
}

export function findAllIntersections(
  line: Seg,
  segs: Seg[],
  isInfinite: boolean = true
): Array<{ seg: Seg; point: { x: number; y: number }; t: number }> {
  const intersections: Array<{ seg: Seg; point: { x: number; y: number }; t: number }> = [];
  
  for (const seg of segs) {
    if (seg.id === line.id) continue;
    
    const intersection = lineIntersectionWithRay(line, seg, isInfinite);
    if (intersection) {
      intersections.push({
        seg: seg,
        point: { x: intersection.x, y: intersection.y },
        t: intersection.t
      });
    }
  }

  intersections.sort((a, b) => a.t - b.t);
  
  return intersections;
}

export function calculatePolygonCenter(points: Vertex[]): Vertex {
  let centerX = 0;
  let centerY = 0;
  let count = 0;

  for (const point of points) {
    centerX += point.x;
    centerY += point.y;
    count++;
  }

  centerX = (centerX / count)
  centerY = (centerY / count)

  return {
    x: centerX,
    y: centerY,
  }
}

export function sortPointsClockwise(points: Vertex[]): Vertex[] {
  if (points.length < 3) {
    return points;
  }

  const center = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );

  center.x /= points.length;
  center.y /= points.length;

  return points.sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
}
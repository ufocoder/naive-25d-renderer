function doLinesIntersect(line1: Linedef, line2: Linedef): boolean {
  const p1 = line1.start;
  const p2 = line1.end;
  const p3 = line2.start;
  const p4 = line2.end;
  
  const orient = (a: Vertex, b: Vertex, c: Vertex) => {
    const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
    if (val === 0) return 0;
    return val > 0 ? 1 : 2;
  };
  
  const o1 = orient(p1, p2, p3);
  const o2 = orient(p1, p2, p4);
  const o3 = orient(p3, p4, p1);
  const o4 = orient(p3, p4, p2);
  
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;
  
  return false;
}

function onSegment(p: Vertex, q: Vertex, r: Vertex): boolean {
  return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
         q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}

function findIntersectionPoint(line1: Linedef, line2: Linedef): Vertex | null {
  const p1 = line1.start;
  const p2 = line1.end;
  const p3 = line2.start;
  const p4 = line2.end;
  
  const denominator = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (denominator === 0) return null;
  
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denominator;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denominator;
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y)
    };
  }
  
  return null;
}

function splitLinedefAtPoint(line: Linedef, point: Vertex): [Linedef, Linedef] {
  return [
    { start: line.start, end: point },
    { start: point, end: line.end }
  ];
}

function areVerticesEqual(v1: Vertex, v2: Vertex, epsilon: number = 1e-9): boolean {
  return Math.abs(v1.x - v2.x) < epsilon && Math.abs(v1.y - v2.y) < epsilon;
}

export function splitLinedef(lines: Linedef[]): Linedef[] {
  let currentLines = [...lines];
  let hasIntersection = true;
  let maxIterations = 1000;
  let iterations = 0;
  
  while (hasIntersection && iterations < maxIterations) {
    hasIntersection = false;
    iterations++;
    
    // Проверяем все пары линий
    for (let i = 0; i < currentLines.length; i++) {
      for (let j = i + 1; j < currentLines.length; j++) {
        const line1 = currentLines[i];
        const line2 = currentLines[j];

        if (areVerticesEqual(line1.start, line2.start) ||
            areVerticesEqual(line1.start, line2.end) ||
            areVerticesEqual(line1.end, line2.start) ||
            areVerticesEqual(line1.end, line2.end)) {
          continue;
        }
        
        if (doLinesIntersect(line1, line2)) {
          const intersectionPoint = findIntersectionPoint(line1, line2);
          
          if (intersectionPoint) {
            const [newLine1a, newLine1b] = splitLinedefAtPoint(line1, intersectionPoint);
            const [newLine2a, newLine2b] = splitLinedefAtPoint(line2, intersectionPoint);
            
            currentLines.splice(i, 1, newLine1a, newLine1b);
            currentLines.splice(j + 1, 1, newLine2a, newLine2b);
            
            hasIntersection = true;
            break;
          }
        }
      }
      if (hasIntersection) break;
    }
  }
  
  return currentLines;
}

export function processLevel(settings: Settings): Settings {
    return {
        ...settings,
        level: splitLinedef(settings.level)
    }
}
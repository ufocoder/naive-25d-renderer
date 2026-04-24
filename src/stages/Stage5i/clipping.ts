import type { SegProjection } from "./projection";

export function createFloorPolygon(
  projection: SegProjection,
  screenHeight: number,
): Vertex[] {
  const { start, end } = projection;

  return [
    { x: start.screenX, y: start.bottomY },
    { x: end.screenX, y: end.bottomY },
    { x: end.screenX, y: screenHeight },
    { x: start.screenX, y: screenHeight },
  ];
}

export function createCeilPolygon(
  projection: SegProjection,
): Vertex[] {
  const { start, end } = projection;

  return [
    { x: start.screenX, y: 0 },
    { x: end.screenX, y: 0 },
    { x: end.screenX, y: end.topY },
    { x: start.screenX, y: start.topY },
  ];
}

export function createWallPolygon(projection: SegProjection) {
  const { start, end } = projection;

  return [
    { x: start.screenX, y: start.bottomY },
    { x: end.screenX, y: end.bottomY },
    { x: end.screenX, y: end.topY },
    { x: start.screenX, y: start.topY },
  ];
}

// Sutherland-Hodgman algorithm, URL: https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm
// Python implementation, URL https://github.com/mhdadk/sutherland-hodgman

export function intersectPolygons(subjectPolygon: Vertex[], clipPolygon: Vertex[]): Vertex[] {
    let outputList = subjectPolygon;
    
    let cp1 = clipPolygon[clipPolygon.length - 1];

    for (const cp2 of clipPolygon) {
        const inputList = outputList;
        outputList = [];
        
        if (inputList.length === 0) break;

        let s = inputList[inputList.length - 1];

        for (const e of inputList) {
            const insideE = isInside(cp1, cp2, e);
            const insideS = isInside(cp1, cp2, s);
            
            if (insideE) {
                if (!insideS) {
                    outputList.push(getIntersection(cp1, cp2, s, e));
                }
                outputList.push(e);
            } else if (insideS) {
                outputList.push(getIntersection(cp1, cp2, s, e));
            }
            s = e;
        }
        cp1 = cp2;
    }

    return ensureCounterClockwise(outputList)
}

function isInside(cp1: Vertex, cp2: Vertex, p: Vertex): boolean {
    const cross = (cp2.x - cp1.x) * (p.y - cp1.y) - (cp2.y - cp1.y) * (p.x - cp1.x);
    return cross >= -1e-10; 
}

function getIntersection(cp1: Vertex, cp2: Vertex, s: Vertex, e: Vertex): Vertex {
    const A1 = cp2.y - cp1.y;
    const B1 = cp1.x - cp2.x;
    const C1 = A1 * cp1.x + B1 * cp1.y;
    
    const A2 = e.y - s.y;
    const B2 = s.x - e.x;
    const C2 = A2 * s.x + B2 * s.y;
    
    const det = A1 * B2 - A2 * B1;
    
    if (Math.abs(det) < 1e-10) {
        return {
            x: (s.x + e.x) / 2,
            y: (s.y + e.y) / 2
        };
    }
    
    const x = (B2 * C1 - B1 * C2) / det;
    const y = (A1 * C2 - A2 * C1) / det;
    
    return { x, y };
}


function isCounterClockwise(polygon: Vertex[]): boolean {
    let sum = 0;
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        sum += (p2.x - p1.x) * (p2.y + p1.y);
    }
    return sum < 0;
}

function ensureCounterClockwise(polygon: Vertex[]): Vertex[] {
    if (!isCounterClockwise(polygon)) {
        return [...polygon].reverse();
    }
    return [...polygon];
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
    return angleA - angleB; // По часовой стрелке
  });
}
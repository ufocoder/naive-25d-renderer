export interface CollisionResult {
  x: number;
  y: number;
  collided: boolean;
}

export interface CollisionConfig {
  playerRadius: number;
  stepHeight: number;
}

export const DEFAULT_CONFIG: CollisionConfig = {
  playerRadius: 8,
  stepHeight: 500
};

export function isSolidWall(seg: Seg): boolean {
  return Boolean(!seg.isTwoSide || seg.isSolid);
}

export function closestPointOnSegment(seg: Seg, point: Vertex): Vertex {
  const ax = seg.end.x - seg.start.x;
  const ay = seg.end.y - seg.start.y;
  const len2 = ax * ax + ay * ay;
  
  if (len2 === 0) {
    return { x: seg.start.x, y: seg.start.y };
  }
  
  let t = ((point.x - seg.start.x) * ax + (point.y - seg.start.y) * ay) / len2;
  t = Math.max(0, Math.min(1, t));
  
  return {
    x: seg.start.x + ax * t,
    y: seg.start.y + ay * t
  };
}

export function circleSegmentCollision(
  center: Vertex,
  radius: number,
  seg: Seg
): { collided: boolean; pushX: number; pushY: number; distance: number } {
  const closest = closestPointOnSegment(seg, center);
  const dx = center.x - closest.x;
  const dy = center.y - closest.y;
  const distance = Math.hypot(dx, dy);
  
  if (distance >= radius) {
    return { collided: false, pushX: 0, pushY: 0, distance };
  }

  const lineDx = seg.end.x - seg.start.x;
  const lineDy = seg.end.y - seg.start.y;
  const len = Math.hypot(lineDx, lineDy);
  
  if (len === 0) {
    return { collided: false, pushX: 0, pushY: 0, distance };
  }

  let nx = -lineDy / len;
  let ny = lineDx / len;
  
  const side = (seg.end.x - seg.start.x) * (center.y - seg.start.y) -
               (seg.end.y - seg.start.y) * (center.x - seg.start.x);
  
  if (side < 0) {
    nx = -nx;
    ny = -ny;
  }
  
  const overlap = radius - distance;
  return {
    collided: true,
    pushX: nx * overlap,
    pushY: ny * overlap,
    distance
  };
}

function checkCollisionNaive(
  _: number,
  __: number,
  newX: number,
  newY: number,
  radius: number,
  linedefs: Seg[],
  filterSolid: boolean = true
): CollisionResult {
  let resultX = newX;
  let resultY = newY;
  let collided = false;

  for (const seg of linedefs) {
    if (filterSolid && !isSolidWall(seg)) {
      continue;
    }

    const collision = circleSegmentCollision(
      { x: resultX, y: resultY },
      radius,
      seg
    );
    
    if (collision.collided) {
      resultX += collision.pushX;
      resultY += collision.pushY;
      collided = true;
      
      const secondCollision = circleSegmentCollision(
        { x: resultX, y: resultY },
        radius,
        seg
      );
      
      if (secondCollision.collided) {
        resultX += secondCollision.pushX * 0.5;
        resultY += secondCollision.pushY * 0.5;
      }
    }
  }
  
  return { x: resultX, y: resultY, collided };
}

export function checkCollisionOptimized(
  oldX: number,
  oldY: number,
  newX: number,
  newY: number,
  radius: number,
  linedefs: Seg[],
  filterSolid: boolean = true
): CollisionResult {
  const minX = Math.min(oldX, newX) - radius;
  const minY = Math.min(oldY, newY) - radius;
  const maxX = Math.max(oldX, newX) + radius;
  const maxY = Math.max(oldY, newY) + radius;

  const candidateSegments = linedefs.filter(seg => {
    const segMinX = Math.min(seg.start.x, seg.end.x);
    const segMaxX = Math.max(seg.start.x, seg.end.x);
    const segMinY = Math.min(seg.start.y, seg.end.y);
    const segMaxY = Math.max(seg.start.y, seg.end.y);
    
    return !(maxX < segMinX || minX > segMaxX || maxY < segMinY || minY > segMaxY);
  });
  
  return checkCollisionNaive(oldX, oldY, newX, newY, radius, candidateSegments, filterSolid);
}
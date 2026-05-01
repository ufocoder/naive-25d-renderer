import { 
  computeBounds, 
  generateSegId, 
  resetSegIdCounter, 
  splitSegment, 
  getPointSide,
  extendToInfiniteLine,
  lineIntersectionWithRay,
  isConvexPolygon
} from "./geometry";

import type { BSPNode, BSPLeaf } from "./typings";

function invertSegment(seg: Seg): Seg {
  if (!isPortal(seg)) {
    return seg;
  }

  const inverted = { ...seg };
  
  inverted.frontSector = seg.backSector;
  inverted.backSector = seg.frontSector;

  if (inverted.frontSector === inverted.backSector) {
    inverted.isTwoSide = false;
  }

  return inverted;
}

function isPortal(seg: Seg): boolean {
  return Boolean(seg.isTwoSide && seg.backSector && seg.backSector !== seg.frontSector);
}

interface PartitionSegments {
  frontSegments: Seg[]; 
  backSegments: Seg[]; 
  onLineSegments: Seg[];
  newSegments: Seg[];
}

function partitionByInfiniteLine(
  segs: Seg[],
  splitter: Seg
): PartitionSegments {
  const frontSegments: Seg[] = [];
  const backSegments: Seg[] = [];
  const onLineSegments: Seg[] = [];
  const newSegments: Seg[] = [];
  
  const useInfiniteSplitLine = !isPortal(splitter);
  const splitLine = useInfiniteSplitLine ? extendToInfiniteLine(splitter) : splitter;
  
  for (const seg of segs) {
    if (seg.id === splitter.id) {
      onLineSegments.push(seg);
      continue;
    }
    
    const intersection = lineIntersectionWithRay(splitLine, seg, useInfiniteSplitLine);
    
    if (!intersection) {
      const midPoint = {
        x: (seg.start.x + seg.end.x) / 2,
        y: (seg.start.y + seg.end.y) / 2
      };
      const side = getPointSide(splitter, midPoint);
      
      if (side > 0) {
        frontSegments.push(seg);
      } else if (side < 0) {
        backSegments.push(seg);
      } else {
        onLineSegments.push(seg);
      }
      continue;
    }

    const isAtStart = Math.hypot(intersection.x - seg.start.x, intersection.y - seg.start.y) < 0.001;
    const isAtEnd = Math.hypot(intersection.x - seg.end.x, intersection.y - seg.end.y) < 0.001;
    
    if (isAtStart || isAtEnd) {
      const midPoint = {
        x: (seg.start.x + seg.end.x) / 2,
        y: (seg.start.y + seg.end.y) / 2
      };
      const side = getPointSide(splitter, midPoint);
      
      if (side > 0) {
        frontSegments.push(seg);
      } else if (side < 0) {
        backSegments.push(seg);
      } else {
        onLineSegments.push(seg);
      }
      continue;
    }
    
    const [segA, segB] = splitSegment(seg, intersection);
    
    segA.frontSector = seg.frontSector;
    segA.backSector = seg.backSector;
    segA.isTwoSide = seg.isTwoSide;
    segB.frontSector = seg.frontSector;
    segB.backSector = seg.backSector;
    segB.isTwoSide = seg.isTwoSide;
    
    newSegments.push(segA, segB);
    
    const midA = {
      x: (segA.start.x + segA.end.x) / 2,
      y: (segA.start.y + segA.end.y) / 2
    };

    const sideA = getPointSide(splitter, midA);
    
    if (sideA > 0) {
      frontSegments.push(segA);
    } else if (sideA < 0) {
      backSegments.push(segA);
    } else {
      onLineSegments.push(segA);
    }
    
    const midB = {
      x: (segB.start.x + segB.end.x) / 2,
      y: (segB.start.y + segB.end.y) / 2
    };
    const sideB = getPointSide(splitter, midB);
    
    if (sideB > 0) {
      frontSegments.push(segB);
    } else if (sideB < 0) {
      backSegments.push(segB);
    } else {
      onLineSegments.push(segB);
    }
  }
  
  return { frontSegments, backSegments, onLineSegments, newSegments };
}

function canCreateLeaf(segs: Seg[], minSegments: number = 3): boolean {
  if (segs.length < minSegments) return false;

  const vertexCount = new Map<string, number>();
  const norm = (x: number, y: number) => `${Math.round(x * 1000)}/${Math.round(y * 1000)}`;
  
  for (const seg of segs) {
    const startKey = norm(seg.start.x, seg.start.y);
    const endKey = norm(seg.end.x, seg.end.y);
    vertexCount.set(startKey, (vertexCount.get(startKey) || 0) + 1);
    vertexCount.set(endKey, (vertexCount.get(endKey) || 0) + 1);
  }

  for (const count of vertexCount.values()) {
    if (count !== 2) return false;
  }
  
  if (!isConnectedPolygon(segs)) return false;
  
  return isConvexPolygon(segs);
}

function isConnectedPolygon(segs: Seg[]): boolean {
  if (segs.length === 0) return false;
  
  const vertexToSegs = new Map<string, Seg[]>();
  const norm = (x: number, y: number) => `${Math.round(x * 1000)}/${Math.round(y * 1000)}`;
  
  for (const seg of segs) {
    const startKey = norm(seg.start.x, seg.start.y);
    const endKey = norm(seg.end.x, seg.end.y);
    
    if (!vertexToSegs.has(startKey)) vertexToSegs.set(startKey, []);
    if (!vertexToSegs.has(endKey)) vertexToSegs.set(endKey, []);
    
    vertexToSegs.get(startKey)!.push(seg);
    vertexToSegs.get(endKey)!.push(seg);
  }
  
  for (const [_, segList] of vertexToSegs) {
    if (segList.length !== 2) return false;
  }
  
  if (vertexToSegs.size === 0) return false;
  
  const startVertex = Array.from(vertexToSegs.keys())[0];
  const visited = new Set<string>();
  const stack: string[] = [startVertex];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const segsAtVertex = vertexToSegs.get(current)!;
    for (const seg of segsAtVertex) {
      const startKey = norm(seg.start.x, seg.start.y);
      const endKey = norm(seg.end.x, seg.end.y);
      const neighbor = current === startKey ? endKey : startKey;
      
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }
  }
  
  return visited.size === vertexToSegs.size;
}

function getSectorForLeaf(segs: Seg[]): Sector | null {
  if (segs.length === 0) return null;

  const firstSeg = segs[0];
  
  if (firstSeg.frontSector) {
    return firstSeg.frontSector;
  }

  for (const seg of segs) {
    if (seg.frontSector) return seg.frontSector;
    if (seg.backSector) return seg.backSector;
  }
  
  return null;
}

function normalizeVertexKey(v: Vertex): string {
  return `${Math.round(v.x * 1000)}/${Math.round(v.y * 1000)}`;
}

function sameVertex(a: Vertex, b: Vertex): boolean {
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001;
}

function canMergeCollinear(a: Seg, b: Seg, pivot: Vertex): boolean {
  if (a.isTwoSide !== b.isTwoSide) return false;
  if (a.frontSector?.id !== b.frontSector?.id) return false;
  if (a.backSector?.id !== b.backSector?.id) return false;
  if (a.color !== b.color) return false;

  const aOther = sameVertex(a.start, pivot) ? a.end : a.start;
  const bOther = sameVertex(b.start, pivot) ? b.end : b.start;

  const ax = aOther.x - pivot.x;
  const ay = aOther.y - pivot.y;
  const bx = bOther.x - pivot.x;
  const by = bOther.y - pivot.y;

  const cross = ax * by - ay * bx;
  if (Math.abs(cross) > 0.001) return false;

  const dot = ax * bx + ay * by;
  return dot < 0;
}

function simplifyLeafSegments(segs: Seg[]): Seg[] {
  let simplified = [...segs];
  let changed = true;

  while (changed) {
    changed = false;
    const vertexToIndexes = new Map<string, number[]>();

    for (let i = 0; i < simplified.length; i++) {
      const seg = simplified[i];
      const startKey = normalizeVertexKey(seg.start);
      const endKey = normalizeVertexKey(seg.end);

      if (!vertexToIndexes.has(startKey)) vertexToIndexes.set(startKey, []);
      if (!vertexToIndexes.has(endKey)) vertexToIndexes.set(endKey, []);
      vertexToIndexes.get(startKey)!.push(i);
      vertexToIndexes.get(endKey)!.push(i);
    }

    for (const [key, indexes] of vertexToIndexes) {
      if (indexes.length !== 2) continue;

      const [indexA, indexB] = indexes;
      const segA = simplified[indexA];
      const segB = simplified[indexB];
      if (!segA || !segB) continue;

      const [x, y] = key.split("/").map(v => Number(v) / 1000);
      const pivot: Vertex = { x, y };

      if (!canMergeCollinear(segA, segB, pivot)) continue;

      const aOther = sameVertex(segA.start, pivot) ? segA.end : segA.start;
      const bOther = sameVertex(segB.start, pivot) ? segB.end : segB.start;

      const merged: Seg = {
        ...segA,
        start: aOther,
        end: bOther,
      };

      simplified = simplified.filter((_, i) => i !== indexA && i !== indexB);
      simplified.push(merged);
      changed = true;
      break;
    }
  }

  return simplified;
}

function dedupeLeafGeometry(segs: Seg[]): Seg[] {
  const seen = new Set<string>();
  const deduped: Seg[] = [];

  for (const seg of segs) {
    const a = normalizeVertexKey(seg.start);
    const b = normalizeVertexKey(seg.end);
    const edgeKey = a < b ? `${a}|${b}` : `${b}|${a}`;
    const sectorKey = `${seg.frontSector?.id ?? "n"}:${seg.backSector?.id ?? "n"}:${seg.isTwoSide ? 1 : 0}`;
    const key = `${edgeKey}|${sectorKey}`;

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(seg);
  }

  return deduped;
}

function createLeaf(segs: Seg[], sector?: Sector | null): BSPLeaf {
  const uniqueSegs = segs.filter((seg, index, self) => 
    index === self.findIndex(s => s.id === seg.id)
  );
  const mergedSegs = simplifyLeafSegments(uniqueSegs);
  const dedupedSegs = dedupeLeafGeometry(mergedSegs);

  let leafSector: Sector | null = sector || null;
  if (!leafSector) {
    leafSector = getSectorForLeaf(dedupedSegs);
  }

  const sectorScopedSegs = leafSector
    ? dedupedSegs.filter(seg => isSegInSector(seg, leafSector))
    : dedupedSegs;
  const leafSegs = sectorScopedSegs.length > 0 ? sectorScopedSegs : dedupedSegs;
  
  if (!leafSector) {
    console.warn("Warning: Leaf created without sector reference");
    leafSector = {
      id: -1,
      floorHeight: 0,
      floorColor: "#333",
      ceilHeight: 10000,
      ceilColor: "#666",
      segs: []
    } as Sector;
  }
  
  return {
    kind: 'leaf',
    segs: leafSegs,
    bounds: computeBounds(leafSegs)
  };
}

function isSegInSector(seg: Seg, sector: Sector | null): boolean {
  if (!sector) {
    return true;
  }

  return seg.frontSector?.id === sector.id || seg.backSector?.id === sector.id;
}

function getAvailableSplitters(
  segs: Seg[],
  usedSplitterIds: Set<number>,
  currentSector: Sector | null
): Seg[] {
  const candidates = segs.filter(seg => !usedSplitterIds.has(seg.id!));
  const sectorScoped = candidates.filter(seg => isSegInSector(seg, currentSector));
  const pool = sectorScoped.length > 0 ? sectorScoped : candidates;

  const twoSideSplitters = pool.filter(s => s.isTwoSide === true);
  const oneSideSplitters = pool.filter(s => s.isTwoSide === false);

  return [...twoSideSplitters, ...oneSideSplitters];
}

function evaluateSplitter(
  frontCount: number,
  backCount: number,
  isPortalSeg: boolean,
  splitCount: number
): number {
  if (frontCount === 0 || backCount === 0) return Infinity;

  const splitPenalty = splitCount * 1000;
  const balancePenalty = Math.abs(frontCount - backCount);
  const nonPortalPenalty = isPortalSeg ? 0 : 10;

  return splitPenalty + balancePenalty + nonPortalPenalty;
}

function selectBestSplitter(
  segs: Seg[],
  availableSplitters: Seg[]
): { splitter: Seg | null; front: Seg[]; back: Seg[]; onLine: Seg[]; newSegments: Seg[] } {
  let bestSplitter: Seg | null = null;
  let bestFront: Seg[] = [];
  let bestBack: Seg[] = [];
  let bestOnLine: Seg[] = [];
  let bestNewSegments: Seg[] = [];
  let bestScore = Infinity;
  
  for (const splitter of availableSplitters) {
    const { frontSegments, backSegments, onLineSegments, newSegments } = partitionByInfiniteLine(
      segs,
      splitter
    );
    
    const score = evaluateSplitter(
      frontSegments.length, 
      backSegments.length, 
      isPortal(splitter),
      newSegments.length
    );
    
    if (score < bestScore) {
      bestScore = score;
      bestSplitter = splitter;
      bestFront = frontSegments;
      bestBack = backSegments;
      bestOnLine = onLineSegments;
      bestNewSegments = newSegments;

      if (score === 0) break;
    }
  }
  
  return {
    splitter: bestSplitter,
    front: bestFront,
    back: bestBack,
    onLine: bestOnLine,
    newSegments: bestNewSegments
  };
}

function buildBSPTreeRecursive(
  segs: Seg[],
  usedSplitterIds: Set<number>,
  currentSector: Sector | null,
  depth: number,
  maxDepth: number,
  minSegments: number
): { success: boolean; node?: BSPNode; newSegments?: Seg[] } {
  if (canCreateLeaf(segs, minSegments) || segs.length === 0) {
    if (segs.length === 0) {
      return { 
        success: true,
        node: {
          kind: 'leaf',
          segs: [],
          bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
        }
      };
    }
    
    return { 
      success: true,
      node: createLeaf(segs, currentSector)
    };
  }

  if (depth >= maxDepth) {
    return {
      success: true,
      node: createLeaf(segs, currentSector)
    };
  }

  const currentSplitters = getAvailableSplitters(segs, usedSplitterIds, currentSector);
  
  if (currentSplitters.length === 0) {
    return {
      success: true, 
      node: createLeaf(segs, currentSector)
    };
  }

  const { splitter, front, back, onLine, newSegments } = selectBestSplitter(
    segs,
    currentSplitters
  );
  
  if (!splitter) {
    return {
      success: true,
      node: createLeaf(segs, currentSector)
    };
  }
  
  const invertedOnLine = onLine.map(seg => invertSegment(seg));
  const frontSegs = [...front, ...onLine];
  const backSegs = [...back, ...invertedOnLine];
  
  if (frontSegs.length === 0 || backSegs.length === 0) {
    return {
      success: true,
      node: createLeaf(segs, currentSector)
    };
  }
  
  const newUsedSplitterIds = new Set(usedSplitterIds);
  newUsedSplitterIds.add(splitter.id!);
  
  const frontSector = splitter.frontSector || currentSector;
  const backSector = splitter.backSector || currentSector;
  
  const leftResult = buildBSPTreeRecursive(
    frontSegs,
    newUsedSplitterIds,
    frontSector,
    depth + 1,
    maxDepth,
    minSegments
  );
  
  if (!leftResult.success) {
    return { success: false };
  }
  
  const rightResult = buildBSPTreeRecursive(
    backSegs,
    newUsedSplitterIds,
    backSector,
    depth + 1,
    maxDepth,
    minSegments
  );
  
  if (!rightResult.success) {
    return { success: false };
  }

  const allNewSegments = [
    ...(leftResult.newSegments || []), 
    ...(rightResult.newSegments || []),
    ...newSegments
  ];
  
  return {
    success: true,
    node: {
      kind: 'branch',
      splitter: splitter,
      front: leftResult.node!,
      back: rightResult.node!
    },
    newSegments: allNewSegments
  };
}

export function buildBSPTree(
  segs: Seg[],
  rootSector?: Sector,
  maxDepth: number = 15,
  minSegments: number = 3
): BSPNode {
  resetSegIdCounter();
  
  const segsWithId = segs.map(seg => ({
    ...seg,
    id: generateSegId()
  }));
  
  const usedSplitterIds = new Set<number>();
  
  const result = buildBSPTreeRecursive(
    segsWithId,
    usedSplitterIds,
    rootSector || null,
    0,
    maxDepth,
    minSegments
  );
  
  if (!result.success || !result.node) {
    return createLeaf(segsWithId, rootSector);
  }
  
  return result.node;
}

export function collectLeaves(node: BSPNode): BSPLeaf[] {
  const leaves: BSPLeaf[] = [];
  
  function collect(n: BSPNode): void {
    if (n.kind === 'leaf') {
      leaves.push(n);
    } else {
      collect(n.front);
      collect(n.back);
    }
  }
  
  collect(node);

  return leaves;
}
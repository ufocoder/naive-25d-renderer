import { 
  computeBounds, 
  generateSegId, 
  resetSegIdCounter, 
  splitSegment, 
  getPointSide,
  extendToInfiniteLine,
  lineIntersectionWithRay,
  isConvexPolygon,
  getMidPoint
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
  splitter: Seg,
  allSegs: Map<number, Seg>
): PartitionSegments {
  const frontSegments: Seg[] = [];
  const backSegments: Seg[] = [];
  const onLineSegments: Seg[] = [];
  const newSegments: Seg[] = [];
  
  const infiniteLine = extendToInfiniteLine(splitter);
  
  for (const seg of segs) {
    if (seg.id === splitter.id) {
      onLineSegments.push(seg);
      continue;
    }
    
    const intersection = lineIntersectionWithRay(infiniteLine, seg, true);
    
    if (!intersection) {
      const midPoint = getMidPoint(seg);
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
      const midPoint = getMidPoint(seg);
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
    
    allSegs.set(segA.id!, segA);
    allSegs.set(segB.id!, segB);
    allSegs.delete(seg.id!);

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

function createLeaf(segs: Seg[], sector?: Sector | null): BSPLeaf {
  const uniqueSegs = segs.filter((seg, index, self) => 
    index === self.findIndex(s => s.id === seg.id)
  );

  let leafSector: Sector | null = sector || null;

  if (!leafSector) {
    leafSector = getSectorForLeaf(uniqueSegs);
  }
  
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
    segs: uniqueSegs,
    bounds: computeBounds(uniqueSegs)
  };
}

function getAvailableSplitters(segs: Seg[], usedSplitterIds: Set<number>): Seg[] {
  const twoSideSplitters = segs.filter(s => s.isTwoSide === true && !usedSplitterIds.has(s.id!));
  const oneSideSplitters = segs.filter(s => s.isTwoSide === false && !usedSplitterIds.has(s.id!));
  
  return [...twoSideSplitters, ...oneSideSplitters];
}

function evaluateSplitter(frontCount: number, backCount: number, isPortal: boolean): number {
  if (isPortal) {
    if (frontCount === 0 && backCount === 0) return Infinity;
    if (frontCount === 0) return backCount;
    if (backCount === 0) return frontCount;
    return Math.abs(frontCount - backCount);
  }

  if (frontCount === 0 || backCount === 0) return Infinity;

  return Math.abs(frontCount - backCount);
}

function selectBestSplitter(
  segs: Seg[],
  availableSplitters: Seg[],
  allSegs: Map<number, Seg>
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
      splitter,
      allSegs
    );
    
    const score = evaluateSplitter(frontSegments.length, backSegments.length, isPortal(splitter));
    
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
  allSegs: Map<number, Seg>,
  usedSplitterIds: Set<number>,
  currentSector: Sector | null,
  depth: number,
  maxDepth: number,
  minSegments: number,
  onSplitDebug?: (data: any) => void
): { success: boolean; node?: BSPNode; newSegments?: Seg[] } {
  if (canCreateLeaf(segs, minSegments)) {
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

  const currentSplitters = getAvailableSplitters(segs, usedSplitterIds);
  
  if (currentSplitters.length === 0) {
    return {
      success: true, 
      node: createLeaf(segs, currentSector)
    };
  }

  const { splitter, front, back, onLine, newSegments } = selectBestSplitter(
    segs,
    currentSplitters,
    allSegs
  );
  
  if (!splitter) {
    return {
      success: true,
      node: createLeaf(segs, currentSector)
    };
  }
  
  if (front.length === 0 || back.length === 0) {
    return {
      success: true,
      node: createLeaf(segs, currentSector)
    };
  }

  const invertedOnLine = onLine.map(seg => invertSegment(seg));

  const frontSegs = [...front, ...onLine];
  const backSegs = [...back, ...invertedOnLine];

  if (onSplitDebug) {
    onSplitDebug({ frontSegs, backSegs });
  }
  
  const newUsedSplitterIds = new Set(usedSplitterIds);
  newUsedSplitterIds.add(splitter.id!);
  
  const frontSector = splitter.frontSector || currentSector;
  const backSector = splitter.backSector || currentSector;
  
  const leftResult = buildBSPTreeRecursive(
    frontSegs,
    allSegs,
    newUsedSplitterIds,
    frontSector,
    depth + 1,
    maxDepth,
    minSegments,
    onSplitDebug
  );
  
  if (!leftResult.success) {
    return { success: false };
  }
  
  const rightResult = buildBSPTreeRecursive(
    backSegs,
    allSegs,
    newUsedSplitterIds,
    backSector,
    depth + 1,
    maxDepth,
    minSegments,
    onSplitDebug
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
  maxDepth: number = 10,
  minSegments: number = 3,
  onSplitDebug?: (data: any) => void
): BSPNode {
  resetSegIdCounter();
  
  const segsWithId = segs.map(seg => ({
    ...seg,
    id: generateSegId()
  }));
  
  const allSegs = new Map<number, Seg>();

  for (const seg of segsWithId) {
    allSegs.set(seg.id, seg);
  }
  
  const usedSplitterIds = new Set<number>();
  
  const result = buildBSPTreeRecursive(
    segsWithId,
    allSegs,
    usedSplitterIds,
    null,
    0,
    maxDepth,
    minSegments,
    onSplitDebug
  );
  
  if (!result.success || !result.node) {
    return createLeaf(segsWithId);
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
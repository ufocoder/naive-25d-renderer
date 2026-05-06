import type { BSPNode } from "@app/stages/Stage6a/bsp/typings";

export type SimplifiedBSPNode = 
  | {
      kind: 'leaf';
      segCount: number;
      segs: Array<{
        start: { x: number; y: number };
        end: { x: number; y: number };
        isTwoSided?: boolean;
        frontSectorId?: number;
        backSectorId?: number;
      }>;
      bounds: { minX: number; minY: number; maxX: number; maxY: number };
    }
  | {
      kind: 'branch';
      splitter: {
        start: { x: number; y: number };
        end: { x: number; y: number };
        isTwoSided?: boolean;
        frontSectorId?: number;
        backSectorId?: number;
      };
      front: SimplifiedBSPNode;
      back: SimplifiedBSPNode;
    };

export function simplifyBSP(node: BSPNode): SimplifiedBSPNode {
  if (node.kind === 'leaf') {
    return {
      kind: 'leaf',
      segCount: node.segs.length,
      segs: node.segs.map(seg => ({
        start: { x: seg.start.x, y: seg.start.y },
        end: { x: seg.end.x, y: seg.end.y },
        isTwoSided: seg.isTwoSide,
        frontSectorId: seg.frontSector?.id,
        backSectorId: seg.backSector?.id
      })),
      bounds: { ...node.bounds }
    };
  } else {
    return {
      kind: 'branch',
      splitter: {
        start: { x: node.splitter.start.x, y: node.splitter.start.y },
        end: { x: node.splitter.end.x, y: node.splitter.end.y },
        isTwoSided: node.splitter.isTwoSide,
        frontSectorId: node.splitter.frontSector?.id,
        backSectorId: node.splitter.backSector?.id
      },
      front: simplifyBSP(node.front),
      back: simplifyBSP(node.back)
    };
  }
}
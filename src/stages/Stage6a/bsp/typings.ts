export type BSPBranch = {
  kind: 'branch';
  splitter: Seg;
  front: BSPNode;
  back: BSPNode;
};

export type BSPLeaf = {
  kind: 'leaf';
  segs: Seg[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
};

export type BSPNode = BSPBranch | BSPLeaf;

export type Portal = {
  seg: Seg;
  fromSector: Sector;
  toSector: Sector;
};

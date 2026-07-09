export type EditableLinedef = Linedef & {
  color?: string;
  isTwoSide?: boolean;
  isSolid?: boolean;
};

export type JsonSettings = {
  camera: Omit<Camera, 'angle' | 'fov'> & {
    angle: number;
    fov: number;
  };
  level: {
    linedefs: EditableLinedef[];
    sectors?: EditableSector[];
  };
};

export type CameraField = 'x' | 'y' | 'angle' | 'fov' | 'moveSpeed' | 'rotationSpeed';

export type SectorNumberField = 'floorHeight' | 'ceilHeight' | 'brightness';

export type SectorColorField = 'floorColor' | 'ceilColor' | 'wallColor';

export type EditableSector = Omit<Sector, 'segs'> & {
  segs: EditableLinedef[];
};

export type SectorCandidate = {
  id: string;
  area: number;
  vertices: Vertex[];
  segs: EditableLinedef[];
};

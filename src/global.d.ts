interface Vertex {
  x: number;
  y: number;
}

interface ImportMetaEnv {
  readonly YANDEX_METRIKA_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Linedef {
  start: Vertex;
  end: Vertex;
}

interface Camera {
  angle: Angle;
  fov: Angle;
  x: number;
  y: number;
  z?: number;
  moveSpeed: number;
  rotationSpeed: number;
  riseSpeed?: number;
  screen: {
    width: number;
    height: number;
  }
}

interface Seg extends Linedef {
  id?: number;
  color?: string;
  isPartition?: boolean;
  frontSector?: Sector;
  backSector?: Sector;
  isTwoSide?: boolean;
  isSolid?: boolean;
}

interface Sector {
  id?: number;
  height?: number; // stage 5b only
  floorHeight?: number;
  floorColor?: string | Color;
  floorTexture?: string;
  ceilHeight?: number;
  ceilColor?: string | Color;
  ceilTexture?: string;
  wallColor?: string | Color;
  wallTexture?: string;
  brightness?: number;
  segs: Seg[];
  items?: Item[]
}

type Level = {
  linedefs: Linedef[];
  sectors?: Sector[];
}

interface Settings {
  camera: Camera;
  level: Level;
}

interface Camera {
  angle: Angle;
  fov: Angle;
  x: number;
  y: number;
  z?: number;
  height?: number;
  moveSpeed: number;
  rotationSpeed: number;
  screen: {
    width: number;
    height: number;
  }
}

interface Item {
  type: string;
  x: number;
  y: number;
  z?: number;
  radius: number;
  sprite?: {
    width: number;
    height: number;
    colors: Color[];
    bitmap: number[][];
  };
}

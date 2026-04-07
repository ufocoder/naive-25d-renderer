interface Vertex {
  x: number;
  y: number;
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
  screen: {
    width: number;
    height: number;
  }
}

interface Linedef {
  start: Vertex;
  end: Vertex;
}

interface Seg extends Linedef {
  color?: string;
  frontSector?: Sector;
  backSector?: Sector;
  isTwoSide?: boolean;
}

interface Sector {
  id?: number;
  height?: number; // stage 5b only
  floorHeight?: number;
  floorColor?: string;
  ceilHeight?: number;
  ceilColor?: string;
  segs: Seg[]
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
  moveSpeed: number;
  rotationSpeed: number;
  screen: {
    width: number;
    height: number;
  }
}

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

type Level = Linedef[];

interface Settings {
  camera: Camera;
  level: Level;
}

interface Angle {
  readonly degrees: number;
  readonly radians: number;
  readonly cos: number;
  readonly sin: number;
}

interface Camera {
  angle: Angle;
  fov: Angle;
  x: number;
  y: number;
  moveSpeed: number;
  rotationSpeed: number;
  screen: {
    width: number;
    height: number;
  }
}
import { Angle } from "@app/lib/Angle";
import { createCircleLines } from "@app/lib/level";

const camera: Camera = {
  x: 1800,
  y: 700,
  fov: new Angle(45),
  angle: new Angle(115),
  screen: {
    width: 400,
    height: 320,
  },
  moveSpeed: 1,
  rotationSpeed: 1,
};

const sector1 = {
  height: 40_000,
  segs: createCircleLines(1500, 1300, 840, 8)
};

const sector2 = {
  height: 40_000,
  segs: createCircleLines(1500, 1300, 75, 10)
}

const level: Level = {
  linedefs: [...sector2.segs, ...sector1.segs],
  sectors: [sector1, sector2]
}

const settings: Settings = {
  camera,
  level,
};

export default settings;

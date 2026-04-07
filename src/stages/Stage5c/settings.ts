import { Angle } from "@app/lib/Angle";
import { createCircleLines } from "@app/lib/level";

const camera: Camera = {
  x: 1800,
  y: 700,
  z: 16,
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
  floorHeight: 0,
  ceilHeight: 40_000,
  segs: createCircleLines(1500, 1300, 840, 8)
};

const sector2 = {
  height: 30_000,
  floorHeight: 0,
  ceilHeight: 30_000,
  segs: createCircleLines(1500, 1300, 100, 10)
}

const sector3 = {
  height: 20_000,
  floorHeight: 0,
  ceilHeight: 20_000,
  segs: createCircleLines(1500, 1300, 150, 10)
}

const sector4 = {
  height: 10_000,
  floorHeight: 0,
  ceilHeight: 10_000,
  segs: createCircleLines(1500, 1300, 200, 10)
}

const level: Level = {
  linedefs: [
    ...sector1.segs, 
    ...sector2.segs,
    ...sector3.segs, 
    ...sector4.segs,
  ],
  sectors: [
    sector1,
    sector2,
    sector3,
    sector4
  ]
}

const settings: Settings = {
  camera,
  level,
};

export default settings;

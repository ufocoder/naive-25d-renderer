import { Angle } from "@app/lib/Angle";
import { createCircleLines } from "@app/lib/level";

const camera: Camera = {
  x: 50,
  y: 300,
  z: 16,
  fov: new Angle(45),
  angle: new Angle(0),
  screen: {
    width: 400,
    height: 320,
  },
  moveSpeed: 1,
  rotationSpeed: 1,
};

const sector1: Sector = {
  id: 1,
  floorHeight: 0,
  floorColor: "#8B6914",
  ceilHeight: 40_000,
  ceilColor: "#87CEEB",
  wallColor: "#8B5A2B",
  segs: []
};

const sector2: Sector = {
  id: 2,
  floorHeight: 0,
  floorColor: "#A0522D",
  ceilHeight: 30_000,
  ceilColor: "#87CEEB",
  wallColor: "#CD853F",
  segs: []
};

const centerX = 400;
const centerY = 300;

const sector2Lines = createCircleLines(centerX, centerY, 160, 10).map(seg => ({
  ...seg,
  frontSector: sector2,
  backSector: sector1,
  isTwoSide: true
}));

const sector1Lines = createCircleLines(centerX, centerY, 400, 20).map(seg => ({
  ...seg,
  frontSector: sector1,
  backSector: undefined,
  isTwoSide: false
}));

sector1.segs = [...sector1Lines, ...sector2Lines];
sector2.segs = [...sector2Lines];

const level: Level = {
  linedefs: [
    ...sector1Lines,
    ...sector2Lines
  ],
  sectors: [sector1, sector2]
};

const settings: Settings = {
  camera,
  level,
};

export default settings;
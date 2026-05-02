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

const sector3: Sector = {
  id: 3,
  floorHeight: 0,
  floorColor: "#D2691E",
  ceilHeight: 20_000,
  ceilColor: "#87CEEB",
  wallColor: "#DEB887",
  segs: []
};

const sector4: Sector = {
  id: 4,
  floorHeight: 0,
  floorColor: "#F4A460",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: "#FFD700",
  segs: []
};

const centerX = 400;
const centerY = 300;

const sector4Lines = createCircleLines(centerX, centerY, 80, 6).map(seg => ({
  ...seg,
  frontSector: sector4,
  backSector: sector3,
  isTwoSide: true
}));

const sector3Lines = createCircleLines(centerX, centerY, 120, 8).map(seg => ({
  ...seg,
  frontSector: sector3,
  backSector: sector2,
  isTwoSide: true
}));

const sector2Lines = createCircleLines(centerX, centerY, 160, 10).map(seg => ({
  ...seg,
  frontSector: sector2,
  backSector: sector1,
  isTwoSide: true
}));

const sector1Lines = createCircleLines(centerX, centerY, 400, 12).map(seg => ({
  ...seg,
  frontSector: sector1,
  backSector: undefined,
  isTwoSide: false
}));

sector1.segs = [...sector1Lines, ...sector2Lines];
sector2.segs = [...sector2Lines, ...sector3Lines];
sector3.segs = [...sector3Lines, ...sector4Lines];
sector4.segs = sector4Lines;

const level: Level = {
  linedefs: [
    ...sector1Lines,
    ...sector2Lines,
    ...sector3Lines,
    ...sector4Lines
  ],
  sectors: [sector1, sector2, sector3, sector4]
};

const settings: Settings = {
  camera,
  level,
};

export const areaSegs = sector1Lines;

export default settings;
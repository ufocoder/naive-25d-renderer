import { Angle } from "@app/lib/Angle";

const startX = 50;
const startY = 125;


const stepHeight = 750;

const camera: Camera = {
  x: 75,  
  y: startY + 25,
  z: 2000,
  height: 2000,
  fov: new Angle(45),
  angle: new Angle(0),
  screen: {
    width: 400,
    height: 320,
  },
  riseSpeed: 10,
  moveSpeed: 0.5,
  rotationSpeed: 2,
};


const stepSector1: Sector = {
  id: 1,
  floorHeight: 0,
  floorTexture: "floor",
  ceilHeight: 10_000,
  ceilTexture: "ceil",
  wallTexture: "wall",
  brightness: 1.0,
  segs: []
};

const stepSector2: Sector = {
  id: 2,
  floorHeight: 1 * stepHeight,
  floorTexture: "floor",
  ceilHeight: 10_000,
  ceilTexture: "ceil",
  wallTexture: "wall",
  brightness: 0.8,
  segs: []
};

const stepSector3: Sector = {
  id: 3,
  floorHeight: 2 * stepHeight,
  floorTexture: "floor",
  ceilHeight: 10_000,
  ceilTexture: "ceil",
  wallTexture: "wall",
  brightness: 0.6,
  segs: []
};

const stepSector4: Sector = {
  id: 4,
  floorHeight: 3 * stepHeight,
  floorTexture: "floor",
  ceilHeight: 10_000,
  ceilTexture: "ceil",
  wallTexture: "wall",
  brightness: 0.4,
  segs: []
};

const stepSector5: Sector = {
  id: 5,
  floorHeight: 4 * stepHeight,
  floorTexture: "floor",
  ceilHeight: 10_000,
  ceilTexture: "ceil",
  wallTexture: "wall",
  brightness: 0.2,
  segs: []
};

const createRect = (x: number, y: number, xs: number, ys: number, isTwoSide: boolean, isSolid: boolean, frontSector: Sector): Seg[] => ([
  { start: { x, y }, end: { x: x + xs, y }, isTwoSide, isSolid, frontSector },
  { start: { x: x + xs, y }, end: { x: x + xs, y: y + ys }, isTwoSide, isSolid, frontSector },
  { start: { x: x + xs, y: y + ys }, end: { x: x, y: y + ys }, isTwoSide, isSolid, frontSector },
  { start: { x: x, y: y + ys }, end: { x, y }, isTwoSide, isSolid, frontSector },
]);

const stepSegs1 = createRect(startX, startY, 50, 50, true, true, stepSector1);
stepSegs1[1].isSolid = false;
stepSegs1[1].backSector = stepSector2;

const stepSegs2 = createRect(startX + 50, startY, 50, 50, true, true, stepSector2);
stepSegs2[1].isSolid = false;
stepSegs2[3].isSolid = false;
stepSegs2[3].backSector = stepSector1;
stepSegs2[1].backSector = stepSector3;

const stepSegs3 = createRect(startX + 50 * 2, startY, 50, 50, true, true, stepSector3);
stepSegs3[1].isSolid = false;
stepSegs3[3].isSolid = false;
stepSegs3[3].backSector = stepSector2;
stepSegs3[1].backSector = stepSector4;

const stepSegs4 = createRect(startX + 50 * 3, startY, 50, 50, true, true, stepSector4);
stepSegs4[1].isSolid = false;
stepSegs4[3].isSolid = false;
stepSegs4[3].backSector = stepSector3;
stepSegs4[1].backSector = stepSector5;

const stepSegs5 = createRect(startX + 50 * 4, startY, 50, 50, true, true, stepSector5);
stepSegs5[3].isSolid = false;
stepSegs5[3].backSector = stepSector4;

const level: Level = {
  linedefs: [
    ...stepSegs1,
    ...stepSegs2,
    ...stepSegs3,
    ...stepSegs4,
    ...stepSegs5
  ],
  sectors: []
};

const settings: Settings = {
  camera,
  level,
};

export default settings;
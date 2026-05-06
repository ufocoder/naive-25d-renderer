import { Angle } from "@app/lib/Angle";

const camera: Camera = {
  x: 125,  
  y: 175,
  z: 2_000,
  height: 2_000,
  fov: new Angle(45),
  angle: new Angle(0),
  screen: {
    width: 400,
    height: 320,
  },
  moveSpeed: 3,
  rotationSpeed: 2,
};

const stepHeight = 500;

const roomSector: Sector = {
  id: 0,
  floorHeight: 0,
  floorColor: "#777",
  ceilHeight: 10_000,
  ceilColor: "#999",
  wallColor: "#333",
  segs: []
};

const stepSector1: Sector = {
  id: 1,
  floorHeight: 1 * stepHeight,
  floorColor: "green",
  ceilHeight: 10_000,
  ceilColor: "#999",
  wallColor: "red",
  segs: []
};

const stepSector2: Sector = {
  id: 2,
  floorHeight: 2 * stepHeight,
  floorColor: "green",
  ceilHeight: 10_000,
  ceilColor: "#999",
  wallColor: "red",
  segs: []
};

const stepSector3: Sector = {
  id: 3,
  floorHeight: 3 * stepHeight,
  floorColor: "green",
  ceilHeight: 10_000,
  ceilColor: "#999",
  wallColor: "red",
  segs: []
};

const stepSector4: Sector = {
  id: 4,
  floorHeight: 4 * stepHeight,
  floorColor: "green",
  ceilHeight: 10_000,
  ceilColor: "#999",
  wallColor: "red",
  segs: []
};

const stepSector5: Sector = {
  id: 5,
  floorHeight: 5 * stepHeight,
  floorColor: "green",
  ceilHeight: 10_000,
  ceilColor: "#999",
  wallColor: "red",
  segs: []
};

const createRect = (x: number, y: number, xs: number, ys: number, frontSector: Sector, backSector?: Sector): Seg[] => ([
  { start: { x, y }, end: { x: x + xs, y }, isTwoSide: true, frontSector, backSector },
  { start: { x: x + xs, y }, end: { x: x + xs, y: y + ys }, isTwoSide: true, frontSector, backSector },
  { start: { x: x + xs, y: y + ys }, end: { x: x, y: y + ys }, isTwoSide: true, frontSector, backSector },
  { start: { x: x, y: y + ys }, end: { x, y }, isTwoSide: true, frontSector, backSector },
]);

const roomLeft: Seg = { 
  start: { x: 0, y: 100 }, 
  end: { x: 0, y: 250 }, 
  isTwoSide: false, 
  frontSector: roomSector 
};

const roomBottom: Seg = { 
  start: { x: 0, y: 100 }, 
  end: { x: 400, y: 100 }, 
  isTwoSide: false, 
  frontSector: roomSector 
};

const roomTop: Seg = { 
  start: { x: 400, y: 250 }, 
  end: { x: 0, y: 250 }, 
  isTwoSide: false, 
  frontSector: roomSector 
};

const roomRightBottom: Seg = { 
  start: { x: 400, y: 100 }, 
  end: { x: 400, y: 150 }, 
  isTwoSide: false, 
  frontSector: roomSector 
};

const roomRightMiddle: Seg = { 
  start: { x: 400, y: 150 }, 
  end: { x: 400, y: 200 }, 
  isTwoSide: true,
  frontSector: roomSector,
  backSector: stepSector1
};

const roomRightTop: Seg = { 
  start: { x: 400, y: 200 }, 
  end: { x: 400, y: 250 }, 
  isTwoSide: false, 
  frontSector: roomSector 
};

const roomSegs = [
  roomBottom,
  roomRightBottom,
  roomTop,     
  roomLeft,
  roomRightMiddle,
  roomRightTop
];

const stepSegs1 = createRect(400, 150, 50, 50, stepSector1);
stepSegs1[3].backSector = roomSector;
stepSegs1[1].backSector = stepSector2;

const stepSegs2 = createRect(450, 150, 50, 50, stepSector2);
stepSegs2[3].backSector = stepSector1;
stepSegs2[1].backSector = stepSector3;

const stepSegs3 = createRect(500, 150, 50, 50, stepSector3);
stepSegs3[3].backSector = stepSector2;
stepSegs3[1].backSector = stepSector4;

const stepSegs4 = createRect(550, 150, 50, 50, stepSector4);
stepSegs4[3].backSector = stepSector3;
stepSegs4[1].backSector = stepSector5;

const stepSegs5 = createRect(600, 150, 50, 50, stepSector5);
stepSegs5[3].backSector = stepSector4;
stepSegs5[1].backSector = undefined;

const level: Level = {
  linedefs: [
    ...roomSegs,
    ...stepSegs1,
    ...stepSegs2,
    ...stepSegs3,
    ...stepSegs4,
    ...stepSegs5,
  ],
  sectors: []
};

const settings: Settings = {
  camera,
  level,
};

export default settings;
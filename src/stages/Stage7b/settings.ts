import { Angle } from "@app/lib/Angle";

const camera: Camera = {
  x: 15,  
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

const columnSector1: Sector = { id: 6, floorHeight: 8_000, floorColor: "#900000", ceilHeight: 8_000, ceilColor: "#900000", wallColor: "red", segs: []};
const columnSector2: Sector = { id: 7, floorHeight: 10_000, floorColor: "green", ceilHeight: 10_000, ceilColor: "#999", wallColor: "#900000", segs: []};
const columnSector3: Sector = { id: 8, floorHeight: 8_000, floorColor: "green", ceilHeight: 8_000, ceilColor: "#999", wallColor: "#900000", segs: []};
const columnSector4: Sector = { id: 9, floorHeight: 10_000, floorColor: "green", ceilHeight: 10_000, ceilColor: "#999", wallColor: "red", segs: []};
const columnSector5: Sector = { id: 10, floorHeight: 9_000, floorColor: "green", ceilHeight: 9_000, ceilColor: "#999", wallColor: "#900000", segs: []};
const columnSector6: Sector = { id: 10, floorHeight: 7_000, floorColor: "green", ceilHeight: 7_000, ceilColor: "#999", wallColor: "red", segs: []};

const createRect = (x: number, y: number, xs: number, ys: number, isTwoSide: boolean, isSolid: boolean  , frontSector: Sector, backSector?: Sector): Seg[] => ([
  { start: { x, y }, end: { x: x + xs, y }, isTwoSide, isSolid, frontSector, backSector },
  { start: { x: x + xs, y }, end: { x: x + xs, y: y + ys }, isTwoSide, isSolid, frontSector, backSector },
  { start: { x: x + xs, y: y + ys }, end: { x: x, y: y + ys }, isTwoSide, isSolid, frontSector, backSector },
  { start: { x: x, y: y + ys }, end: { x, y }, isTwoSide, isSolid, frontSector, backSector },
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

const stepSegs1 = createRect(400, 150, 50, 50, true, true, stepSector1);
stepSegs1[1].isSolid = false;
stepSegs1[3].isSolid = false;
stepSegs1[3].backSector = roomSector;
stepSegs1[1].backSector = stepSector2;

const stepSegs2 = createRect(450, 150, 50, 50, true, true, stepSector2);
stepSegs2[1].isSolid = false;
stepSegs2[3].isSolid = false;
stepSegs2[3].backSector = stepSector1;
stepSegs2[1].backSector = stepSector3;

const stepSegs3 = createRect(500, 150, 50, 50, true, true, stepSector3);
stepSegs3[1].isSolid = false;
stepSegs3[3].isSolid = false;
stepSegs3[3].backSector = stepSector2;
stepSegs3[1].backSector = stepSector4;

const stepSegs4 = createRect(550, 150, 50, 50, true, true, stepSector4);
stepSegs4[1].isSolid = false;
stepSegs4[3].isSolid = false;
stepSegs4[3].backSector = stepSector3;
stepSegs4[1].backSector = stepSector5;

const stepSegs5 = createRect(600, 150, 50, 50, true, true, stepSector5);
stepSegs5[3].isSolid = false;
stepSegs5[3].backSector = stepSector4;

const columnSegs1 = createRect(90, 120, 15, 15, true, true, columnSector1, roomSector);
const columnSegs2 = createRect(90, 200, 15, 15, true, true, columnSector2, roomSector);
const columnSegs3 = createRect(180, 120, 15, 15, true, true, columnSector3, roomSector);
const columnSegs4 = createRect(180, 200, 15, 25, true, true, columnSector4, roomSector);
const columnSegs5 = createRect(270, 200, 15, 15, true, true, columnSector5, roomSector);
const columnSegs6 = createRect(270, 120, 15, 15, true, true, columnSector6, roomSector);

const level: Level = {
  linedefs: [
    ...roomSegs,
    ...stepSegs1,
    ...stepSegs2,
    ...stepSegs3,
    ...stepSegs4,
    ...stepSegs5,
    ...columnSegs1,
    ...columnSegs2,
    ...columnSegs3,
    ...columnSegs4,
    ...columnSegs5,
    ...columnSegs6
  ],
  sectors: []
};

const settings: Settings = {
  camera,
  level,
};

export default settings;
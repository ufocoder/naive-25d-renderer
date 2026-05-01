import { Angle } from "@app/lib/Angle";

const camera: Camera = {
  x: 50,
  y: 300,
  z: 2_000,
  fov: new Angle(45),
  angle: new Angle(-45),
  screen: {
    width: 400,
    height: 320,
  },
  moveSpeed: 3,
  rotationSpeed: 2,
};

const roomSector: Sector = {
  id: 1,
  floorHeight: 0,
  floorColor: "#919191",
  ceilHeight: 10_000,
  ceilColor: "rgb(69, 69, 69)a8a",
  wallColor: "#2b2b2b",
  segs: []
};

const roomWithColumnSegs: Seg[] = [
  { start: { x: 0, y: 0 }, end: { x: 400, y: 0 }, isTwoSide: false },
  { start: { x: 400, y: 0 }, end: { x: 400, y: 400 }, isTwoSide: false },
  { start: { x: 400, y: 400 }, end: { x: 0, y: 400 }, isTwoSide: false },
  { start: { x: 0, y: 400 }, end: { x: 0, y: 0 }, isTwoSide: false },
  //
  { start: { x: 150, y: 150 }, end: { x: 250, y: 150 }, isTwoSide: true },
  { start: { x: 250, y: 150 }, end: { x: 250, y: 250 }, isTwoSide: true },
  { start: { x: 250, y: 250 }, end: { x: 150, y: 250 }, isTwoSide: true },
  { start: { x: 150, y: 250 }, end: { x: 150, y: 150 }, isTwoSide: true }
];

const allSegs = roomWithColumnSegs.map(seg => {
  seg.frontSector = roomSector;
  return seg;
});
  
roomSector.segs = allSegs;

const sectors = [roomSector];

const level: Level = {
  linedefs: sectors.map(r => r.segs).flat(),
  sectors
};

const settings: Settings = {
  camera,
  level,
};

export default settings;

import { Angle } from "@app/lib/Angle";

const camera: Camera = {
  x: 10,  
  y: 200,
  z: 2_000,
  fov: new Angle(45),
  angle: new Angle(0),
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
  floorColor: "#777",
  ceilHeight: 10_000,
  ceilColor: "#999",
  wallColor: "#333",
  segs: []
};

const columnSector: Sector = {
  id: 2,
  floorHeight: 2_000,
  floorColor: "green",
  ceilHeight: 8_000,
  ceilColor: "blue",
  wallColor: "red",
  segs: []
};

const roomSegs: Seg[] = [
  { start: { x: 0, y: 0 }, end: { x: 400, y: 0 }, isTwoSide: false, frontSector: roomSector },
  { start: { x: 400, y: 0 }, end: { x: 400, y: 400 }, isTwoSide: false, frontSector: roomSector },
  { start: { x: 400, y: 400 }, end: { x: 0, y: 400 }, isTwoSide: false, frontSector: roomSector },
  { start: { x: 0, y: 400 }, end: { x: 0, y: 0 }, isTwoSide: false, frontSector: roomSector },
];

const columnSegs: Seg[] = [
  { start: { x: 150, y: 150 }, end: { x: 250, y: 150 }, isTwoSide: true, frontSector: columnSector, backSector: roomSector },
  { start: { x: 250, y: 150 }, end: { x: 250, y: 250 }, isTwoSide: true, frontSector: columnSector, backSector: roomSector },
  { start: { x: 250, y: 250 }, end: { x: 150, y: 250 }, isTwoSide: true, frontSector: columnSector, backSector: roomSector },
  { start: { x: 150, y: 250 }, end: { x: 150, y: 150 }, isTwoSide: true, frontSector: columnSector, backSector: roomSector },
];

roomSector.segs = [...roomSegs, ...columnSegs];
columnSector.segs = columnSegs;

const sectors = [roomSector, columnSector];

const level: Level = {
  linedefs: sectors.map(r => r.segs).flat(),
  sectors
};

const settings: Settings = {
  camera,
  level,
};

export default settings;

export const areaSegs = roomSegs;

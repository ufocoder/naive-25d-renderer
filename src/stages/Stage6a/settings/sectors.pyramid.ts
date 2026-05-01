import { Angle } from "@app/lib/Angle";

const camera: Camera = {
  x: 200,
  y: 380,
  z: 16,
  fov: new Angle(45),
  angle: new Angle(-90),
  screen: {
    width: 400,
    height: 320,
  },
  moveSpeed: 3,
  rotationSpeed: 2,
};


const groundSector: Sector = {
  id: 1,
  floorHeight: 0,
  floorColor: "#444",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: "#666",
  segs: []
};

const step1Sector: Sector = {
  id: 2,
  floorHeight: 32,
  floorColor: "#8B6914",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: "#A0522D",
  segs: []
};

const step2Sector: Sector = {
  id: 3,
  floorHeight: 64,
  floorColor: "#8B6914",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: "#A0522D",
  segs: []
};

const step3Sector: Sector = {
  id: 4,
  floorHeight: 96,
  floorColor: "#8B6914",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: "#A0522D",
  segs: []
};

const step1Size = 120;
const step2Size = 80;
const step3Size = 40;
const centerX = 200;
const centerY = 200;

function createTwoSideSegments(x: number, y: number, size: number, frontSector: Sector, backSector: Sector): Seg[] {
  const half = size / 2;
  const left = x - half;
  const right = x + half;
  const top = y - half;
  const bottom = y + half;
  
  return [
    { start: { x: left, y: top }, end: { x: right, y: top }, frontSector, backSector, isTwoSide: true },
    { start: { x: right, y: top }, end: { x: right, y: bottom }, frontSector, backSector, isTwoSide: true },
    { start: { x: right, y: bottom }, end: { x: left, y: bottom }, frontSector, backSector, isTwoSide: true },
    { start: { x: left, y: bottom }, end: { x: left, y: top }, frontSector, backSector, isTwoSide: true }
  ];
}


const step3Walls = createTwoSideSegments(centerX, centerY, step3Size, step3Sector, step2Sector);
const step2Walls = createTwoSideSegments(centerX, centerY, step2Size, step2Sector, step1Sector);
const step1Walls = createTwoSideSegments(centerX, centerY, step1Size, step1Sector, groundSector);


const roomWalls = [
  { start: { x: 0, y: 0 }, end: { x: 400, y: 0 }, frontSector: groundSector, backSector: undefined, isTwoSide: false },
  { start: { x: 400, y: 0 }, end: { x: 400, y: 400 }, frontSector: groundSector, backSector: undefined, isTwoSide: false },
  { start: { x: 400, y: 400 }, end: { x: 0, y: 400 }, frontSector: groundSector, backSector: undefined, isTwoSide: false },
  { start: { x: 0, y: 400 }, end: { x: 0, y: 0 }, frontSector: groundSector, backSector: undefined, isTwoSide: false }
];


groundSector.segs = [...roomWalls, ...step1Walls];
step1Sector.segs = [...step1Walls, ...step2Walls];
step2Sector.segs = [...step2Walls, ...step3Walls];
step3Sector.segs = step3Walls;

const allSegments = [...roomWalls, ...step1Walls, ...step2Walls, ...step3Walls];
const allSectors = [groundSector, step1Sector, step2Sector, step3Sector];

const level: Level = {
  linedefs: allSegments,
  sectors: allSectors
};

const settings: Settings = {
  camera,
  level,
};

export default settings;
import { Angle } from "@app/lib/Angle";
import { createRectangleLines } from "@app/lib/level";

const camera: Camera = {
  x: 70,
  y: 70,
  z: 16,
  fov: new Angle(45),
  angle: new Angle(0),
  screen: {
    width: 400,
    height: 320,
  },
  moveSpeed: 3,
  rotationSpeed: 2,
};

const room1: Sector = {
  id: 1,
  floorHeight: 0,
  floorColor: "#444",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: '#666',
  segs: []
};

const room2: Sector = {
  id: 2,
  floorHeight: 0,
  floorColor: "#666",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: '#888',
  segs: []
};

const room3: Sector = {
  id: 3,
  floorHeight: 0,
  floorColor: "#888",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: '#999',
  segs: []
};

const room4: Sector = {
  id: 4,
  floorHeight: 0,
  floorColor: "#999",
  ceilHeight: 10_000,
  ceilColor: "#87CEEB",
  wallColor: "#AAA",
  segs: []
};

const segs1 = createRectangleLines(120, 70, 150, 80, '#FF9500')
  .map(seg => {
    seg.frontSector = room1
    return seg;
  });

const segs2 = createRectangleLines(270, 70, 150, 80, '#FFCC00')
  .map(seg => {
    seg.frontSector = room2;
    return seg;
  });

const segs3 = createRectangleLines(385, 70, 80, 80, '#FF2D55')
  .map(seg => {
    seg.frontSector = room3;
    return seg;
  });

const segs4 = createRectangleLines(385, 150, 80, 80, '#FF2D55')
  .map(seg => {
    seg.frontSector = room4;
    return seg;
  });

segs1[1].backSector = room2;
segs1[1].isTwoSide = true

segs2[3].backSector = room1;
segs2[3].isTwoSide = true;

segs3[2].backSector = room4;
segs3[2].isTwoSide = true;
segs3[3].backSector = room2;
segs3[3].isTwoSide = true;

segs4[0].backSector = room3;
segs4[0].isTwoSide = true;

room1.segs = segs1;
room2.segs = segs2;
room3.segs = segs3;
room4.segs = segs4;

const level: Level = {
  linedefs: [...segs1, ...segs2, ...segs3, ...segs4],
  sectors: [room1, room2, room3, room4]
};

const settings: Settings = {
  camera,
  level,
};

export default settings;
import { Angle } from "@app/lib/Angle";
import { createLineY, createLine } from "@app/lib/level";

const camera: Camera = {
  x: 200,
  y: 280,
  fov: new Angle(45),
  angle: new Angle(270),
  screen: {
    width: 400,
    height: 320,
  },
  moveSpeed: 1,
  rotationSpeed: 1,
};

const level: Level = {
  linedefs: [
    createLine(130, 80, 180, 30),
    createLineY(210, 40, 80),
  ]
};

const settings: Settings = {
  camera,
  level,
};

export default settings;

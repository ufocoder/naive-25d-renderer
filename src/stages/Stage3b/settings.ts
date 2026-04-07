import { Angle } from "@app/lib/Angle";
import { createLineX } from "@app/lib/level";

const camera: Camera = {
  x: 200,
  y: 200,
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
    createLineX(150, 0, 320),
    createLineX(250, 0, 320),
  ]
};

const settings: Settings = {
  camera,
  level,
};

export default settings;

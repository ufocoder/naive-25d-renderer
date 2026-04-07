import { Angle } from "@app/lib/Angle";
import { createLine } from "@app/lib/level";

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

const linedefs: Linedef[] = [
  createLine(110, 30, 250, 80),
  createLine(120, 80, 180, 0),
];

const settings: Settings = {
  camera,
  level: {
    linedefs
  }
};

export default settings;

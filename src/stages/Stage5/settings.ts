import { Angle } from "@app/lib/Angle";
import { createCircleLines } from "@app/lib/level";

const camera: Camera = {
  x: 200,
  y: 180,
  fov: new Angle(45),
  angle: new Angle(270),
  screen: {
    width: 400,
    height: 320,
  },
  moveSpeed: 1,
  rotationSpeed: 1,
};

const level: Level = [
  ...createCircleLines(200, 160, 150, 16)
];

const settings: Settings = {
  camera,
  level,
};

export default settings;

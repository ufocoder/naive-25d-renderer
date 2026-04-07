import { Angle } from "@app/lib/Angle";
import { createLineY } from "@app/lib/level";

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

const linedefs: Linedef[] = [];
const len = 20;

for (let x = 110; x < 280; x += len) {
  linedefs.push(createLineY(x, 40, len));
}


const settings: Settings = {
  camera,
  level: {
    linedefs
  }
};

export default settings;

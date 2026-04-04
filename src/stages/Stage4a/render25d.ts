import { drawPolygon } from "@app/lib/canvas";
import { projectionToPoints, projectLinedef, toDistance } from "../Stage3a/render25d";

interface Wall {
  projection: ReturnType<typeof projectLinedef>;
  distance: number;
  color: string;
}

const colors: string[] = [
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#00C7BE',
  '#5AC8FA',
  '#FF3B30',
  '#007AFF',
  '#AF52DE',
  '#FF2D55',
  '#A2845E',
];

function gerenateColor(index: number) {
  return colors[index % colors.length];
}

function toMiddleVertex(a: Vertex, b: Vertex): Vertex {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

export default function render25d(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
) {
  const camera = settings.camera;
  const walls: Wall[] = [];

  settings.level.forEach(function(linedef, index) {
    const projection = projectLinedef(camera, linedef);

    if (!projection) {
      return;
    }

    const linedefMiddle = toMiddleVertex(
      linedef.start,
      linedef.end,
    );

    const distance = toDistance(camera, linedefMiddle);

    walls.push({
      distance, 
      projection,
      color: gerenateColor(index)
    });
  })

  walls.sort((a, b) => b.distance - a.distance);

  for (const wall of walls) {
    drawPolygon(ctx, projectionToPoints(camera, wall.projection!), wall.color);
  }
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export type Texture = {
  width: number;
  height: number;
  bitmap: number[][];
  colors: Color[];
  scale: number;
}

export function getTextureColor(texture: Texture, x: number, y: number): Color {
  const texX = Math.floor(Math.abs(x) % texture.width);
  const texY = Math.floor(Math.abs(y) % texture.height);
  const colorIndex = texture.bitmap[texY]?.[texX] ?? 0;

  return texture.colors[colorIndex] || texture.colors[0];
}

export const textures: Record<string, Texture> = {
  ceil: {
    scale: 4,
    width: 4,
    height: 4,
    bitmap: [
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
    ],
    colors: [
      { r: 70, g: 70, b: 70 },
      { r: 50, g: 50, b: 50 },
    ],
  },
  floor: {
    scale: 2,
    width: 4,
    height: 4,
    bitmap: [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [1, 1, 0, 0],
      [1, 1, 0, 0],
    ],
    colors: [
      { r: 120, g: 120, b: 120 },
      { r: 90, g: 90, b: 90 },
    ],
  },
  wall: {
    scale: 1,
    width: 8,
    height: 8,
    bitmap: [
      [0, 0, 0, 0, 1, 1, 1, 1],
      [0, 0, 0, 0, 1, 1, 1, 1],
      [0, 0, 0, 0, 1, 1, 1, 1],
      [0, 0, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 0, 0, 0, 0],
      [1, 1, 1, 1, 0, 0, 0, 0],
    ],
    colors: [
      { r: 120, g: 200, b: 120 },
      { r: 200, g: 100, b: 100 },
    ],
  },
  health_sprite: {
    scale: 1,
    width: 8,
    height: 8,
    bitmap: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
    ],
    colors: [
      { r: 0, g: 0, b: 0, a: 0 },
      { r: 255, g: 80, b: 80, a: 255 },
    ],
  },
};

import { CANVAS_HEIGHT, CANVAS_WIDTH, HIT_DISTANCE } from './constants';
import { sameVertex, toScreen } from './geometry';
import type { EditableLinedef, SectorCandidate } from './types';

type Viewport = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type RenderEditorCanvasOptions = {
  cursorPoint: Vertex | null;
  effectiveCursorPoint: Vertex | null;
  findNearestVertex: (point: Vertex) => Vertex | null;
  isAddingLinedef: boolean;
  isDraggingCamera: boolean;
  isEditingCamera: boolean;
  isEditingSectors: boolean;
  isEditingVertex: boolean;
  pendingLinedefStart: Vertex | null;
  sectorCandidates: SectorCandidate[];
  selectedIndex: number | null;
  selectedSectorId: number | null;
  selectedVertex: Vertex | null;
  settings: Settings;
  viewport: Viewport;
};

function drawGrid(ctx: CanvasRenderingContext2D, viewport: Viewport) {
  const step = 40 * viewport.scale;
  const startX = viewport.offsetX % step;
  const startY = viewport.offsetY % step;

  ctx.strokeStyle = '#e1e7f2';
  ctx.lineWidth = 1;

  for (let x = startX; x < CANVAS_WIDTH; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }

  for (let y = startY; y < CANVAS_HEIGHT; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

function isCameraInHitRadius(settings: Settings, point: Vertex | null, viewport: Viewport) {
  if (!point) return false;

  const camera = settings.camera;

  return Math.hypot(point.x - camera.x, point.y - camera.y) * viewport.scale <= HIT_DISTANCE;
}

function drawCamera(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
  options: RenderEditorCanvasOptions,
) {
  const camera = settings.camera;
  const position = toScreen({ x: camera.x, y: camera.y }, options.viewport);
  const lookX = position.x + camera.angle.cos * 22;
  const lookY = position.y + camera.angle.sin * 22;
  const isActive =
    options.isDraggingCamera ||
    (options.isEditingCamera &&
      isCameraInHitRadius(settings, options.cursorPoint, options.viewport));

  if (options.isEditingCamera) {
    ctx.save();
    ctx.strokeStyle = isActive ? '#be123c' : '#fb7185';
    ctx.fillStyle = isActive ? 'rgba(255, 228, 234, 0.9)' : 'rgba(255, 241, 244, 0.75)';
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.beginPath();
    ctx.arc(position.x, position.y, isActive ? 12 : 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = isActive ? '#be123c' : '#111827';
  ctx.beginPath();
  ctx.arc(position.x, position.y, isActive ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isActive ? '#be123c' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(position.x, position.y);
  ctx.lineTo(lookX, lookY);
  ctx.stroke();
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  vertices: Vertex[],
  viewport: Viewport,
) {
  if (vertices.length < 3) return;

  const screenVertices = vertices.map((vertex) => toScreen(vertex, viewport));

  ctx.beginPath();
  ctx.moveTo(screenVertices[0].x, screenVertices[0].y);

  for (const vertex of screenVertices.slice(1)) {
    ctx.lineTo(vertex.x, vertex.y);
  }

  ctx.closePath();
}

function drawSectors(
  ctx: CanvasRenderingContext2D,
  settings: Settings,
  selectedSectorId: number | null,
  viewport: Viewport,
) {
  const sectors = settings.level.sectors ?? [];
  if (sectors.length === 0) return;

  ctx.save();

  for (const sector of sectors) {
    drawPolygon(ctx, sector.segs.map((seg) => seg.start), viewport);
    ctx.fillStyle = sector.id === selectedSectorId
      ? 'rgba(124, 58, 237, 0.22)'
      : 'rgba(34, 197, 94, 0.14)';
    ctx.strokeStyle = sector.id === selectedSectorId ? '#7c3aed' : '#22c55e';
    ctx.lineWidth = sector.id === selectedSectorId ? 3 : 2;
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawSectorCandidates(
  ctx: CanvasRenderingContext2D,
  options: RenderEditorCanvasOptions,
) {
  if (!options.isEditingSectors) return;

  ctx.save();
  ctx.setLineDash([8, 5]);
  ctx.strokeStyle = '#14b8a6';
  ctx.lineWidth = 2;

  for (const candidate of options.sectorCandidates) {
    if (options.settings.level.sectors?.some((sector) =>
      sector.segs.length === candidate.segs.length &&
      sector.segs.every((seg, index) => sameVertex(seg.start, candidate.segs[index].start)),
    )) {
      continue;
    }

    drawPolygon(ctx, candidate.vertices, options.viewport);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHitRadius(
  ctx: CanvasRenderingContext2D,
  cursorPoint: Vertex | null,
  viewport: Viewport,
) {
  if (!cursorPoint) return;

  const screenPoint = toScreen(cursorPoint, viewport);

  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(screenPoint.x, screenPoint.y, HIT_DISTANCE, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPendingLinedef(ctx: CanvasRenderingContext2D, options: RenderEditorCanvasOptions) {
  if (!options.isAddingLinedef || !options.effectiveCursorPoint) return;

  const cursorScreen = toScreen(options.effectiveCursorPoint, options.viewport);

  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.fillStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);

  if (options.pendingLinedefStart) {
    const startScreen = toScreen(options.pendingLinedefStart, options.viewport);

    ctx.beginPath();
    ctx.moveTo(startScreen.x, startScreen.y);
    ctx.lineTo(cursorScreen.x, cursorScreen.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(startScreen.x, startScreen.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(cursorScreen.x, cursorScreen.y, 4, 0, Math.PI * 2);
  ctx.fill();

  if (options.cursorPoint && options.findNearestVertex(options.cursorPoint)) {
    ctx.setLineDash([]);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cursorScreen.x, cursorScreen.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawVertexEditOverlay(ctx: CanvasRenderingContext2D, options: RenderEditorCanvasOptions) {
  if (!options.isEditingVertex) return;

  const hovered = options.cursorPoint ? options.findNearestVertex(options.cursorPoint) : null;

  ctx.save();
  ctx.setLineDash([]);
  ctx.lineWidth = 2;

  if (hovered && (!options.selectedVertex || !sameVertex(hovered, options.selectedVertex))) {
    const point = toScreen(hovered, options.viewport);

    ctx.strokeStyle = '#059669';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (options.selectedVertex) {
    const point = toScreen(options.selectedVertex, options.viewport);

    ctx.strokeStyle = '#7c3aed';
    ctx.fillStyle = '#ede9fe';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function prepareCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const pixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssWidth = canvas.clientWidth || rect.width || CANVAS_WIDTH;
  const cssHeight = canvas.clientHeight || rect.height || CANVAS_HEIGHT;
  const pixelWidth = Math.max(1, Math.round(cssWidth * pixelRatio));
  const pixelHeight = Math.max(1, Math.round(cssHeight * pixelRatio));

  if (canvas.width !== pixelWidth) {
    canvas.width = pixelWidth;
  }

  if (canvas.height !== pixelHeight) {
    canvas.height = pixelHeight;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(
    (cssWidth / CANVAS_WIDTH) * pixelRatio,
    0,
    0,
    (cssHeight / CANVAS_HEIGHT) * pixelRatio,
    0,
    0,
  );
}

export function renderEditorCanvas(
  canvas: HTMLCanvasElement,
  options: RenderEditorCanvasOptions,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  prepareCanvas(canvas, ctx);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#f8faff';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawGrid(ctx, options.viewport);
  drawSectors(ctx, options.settings, options.selectedSectorId, options.viewport);
  drawSectorCandidates(ctx, options);

  options.settings.level.linedefs.forEach((linedef, index) => {
    const start = toScreen(linedef.start, options.viewport);
    const end = toScreen(linedef.end, options.viewport);
    const selected = options.selectedIndex === index;
    const editableLinedef = linedef as EditableLinedef;
    const isPortal = editableLinedef.isTwoSide === true && editableLinedef.isSolid === false;

    ctx.save();
    if (isPortal) {
      ctx.setLineDash([10, 5]);
    }
    ctx.strokeStyle = selected ? '#ef4444' : isPortal ? '#0f766e' : editableLinedef.color ?? '#2563eb';
    ctx.lineWidth = selected ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    ctx.fillStyle = selected ? '#ef4444' : '#1f2a44';
    for (const point of [start, end]) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, selected ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  drawCamera(ctx, options.settings, options);
  drawPendingLinedef(ctx, options);
  drawVertexEditOverlay(ctx, options);
  drawHitRadius(ctx, options.cursorPoint, options.viewport);
}

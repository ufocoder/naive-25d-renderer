import { Angle } from '@app/lib/Angle';
import { JsonViewer } from '@app/components/JsonViewer';
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
  type Component,
} from 'solid-js';

import { CANVAS_HEIGHT, CANVAS_WIDTH, HIT_DISTANCE, STORAGE_KEY } from './editor/constants';
import {
  distanceToSegment,
  eventToCanvasPoint as getCanvasPointFromEvent,
  toWorld as projectToWorld,
} from './editor/geometry';
import {
  addLinedefToSettings,
  deleteLinedefAtIndex,
  deleteVertexFromSettings,
  findNearestVertex as findNearestLevelVertex,
  getSharedSectorIdsForLinedef,
  getLinedefsBounds,
  moveVertexInSettings,
  updateLinedefColor,
  updateLinedefPoint,
  updateLinedefPortal,
  updateSectorColorField,
  updateSectorNumberField,
} from './editor/level';
import { renderEditorCanvas } from './editor/render';
import {
  cloneSettings,
  defaultSettings,
  loadInitialSettings,
  toJsonSettings,
} from './editor/settings';
import {
  createMissingSectorsFromLinedefs,
  createSectorFromCandidate,
  findClosedSectorCandidates,
  findSectorCandidateAtPoint,
  isPointInPolygon,
  polygonArea,
} from './editor/sectors';
import EditorToolbar from './editor/toolbar/EditorToolbar';
import type {
  CameraField,
  EditableLinedef,
  EditableSector,
  SectorColorField,
  SectorNumberField,
} from './editor/types';

const Editor: Component = () => {
  const [settings, setSettings] = createSignal<Settings>(cloneSettings(defaultSettings));
  const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);
  const [hydrated, setHydrated] = createSignal(false);
  const [cursorPoint, setCursorPoint] = createSignal<Vertex | null>(null);
  const [isAddingLinedef, setIsAddingLinedef] = createSignal(false);
  const [pendingLinedefStart, setPendingLinedefStart] = createSignal<Vertex | null>(null);
  const [isEditingVertex, setIsEditingVertex] = createSignal(false);
  const [selectedVertex, setSelectedVertex] = createSignal<Vertex | null>(null);
  const [isDraggingVertex, setIsDraggingVertex] = createSignal(false);
  const [isEditingCamera, setIsEditingCamera] = createSignal(false);
  const [isDraggingCamera, setIsDraggingCamera] = createSignal(false);
  const [isNavigatingMap, setIsNavigatingMap] = createSignal(false);
  const [isDraggingMap, setIsDraggingMap] = createSignal(false);
  const [lastDragPoint, setLastDragPoint] = createSignal<Vertex | null>(null);
  const [selectedSectorId, setSelectedSectorId] = createSignal<number | null>(null);
  const [canvasRevision, setCanvasRevision] = createSignal(0);
  const [scale, setScale] = createSignal(1);
  const [offsetX, setOffsetX] = createSignal(40);
  const [offsetY, setOffsetY] = createSignal(40);
  const [copyStatus, setCopyStatus] = createSignal<'idle' | 'copied' | 'error'>('idle');
  let canvasRef: HTMLCanvasElement | undefined;

  const selectedLinedef = createMemo(() => {
    const index = selectedIndex();
    if (index === null) return null;
    return settings().level.linedefs[index] as EditableLinedef | undefined;
  });

  const selectedSector = createMemo(() => {
    const id = selectedSectorId();
    if (id === null) return null;

    return (settings().level.sectors ?? []).find((sector) => sector.id === id) as
      | EditableSector
      | undefined;
  });

  const selectedLinedefSharedSectorIds = createMemo(() =>
    getSharedSectorIdsForLinedef(settings(), selectedLinedef()),
  );

  const canSelectedLinedefBePortal = createMemo(() =>
    selectedLinedefSharedSectorIds().length >= 2,
  );
  const isSelectedLinedefPortalCandidate = createMemo(() =>
    selectedLinedefSharedSectorIds().length > 0,
  );

  const jsonSettings = createMemo(() => toJsonSettings(settings()));
  const json = createMemo(() => JSON.stringify(jsonSettings(), null, 2));
  const sidebarHint = createMemo(() => {
    if (isAddingLinedef()) {
      return pendingLinedefStart()
        ? 'Укажите вторую точку linedef.'
        : 'Укажите первую точку linedef.';
    }

    if (isEditingVertex()) {
      return 'Нажмите на vertex в радиусе курсора и перетащите его.';
    }

    if (isEditingCamera()) {
      return 'Нажмите на маркер камеры в радиусе курсора и перетащите его.';
    }

    if (isNavigatingMap()) {
      return 'Перетащите карту мышью, колесом изменяйте zoom вокруг указателя.';
    }

    return 'Нажмите на элемент на карте, чтобы открыть его редактирование.';
  });
  const sectorCandidates = createMemo(() =>
    findClosedSectorCandidates(settings().level.linedefs),
  );

  const viewport = () => ({
    scale: scale(),
    offsetX: offsetX(),
    offsetY: offsetY(),
  });

  const eventToCanvasPoint = (event: MouseEvent) => {
    const canvas = canvasRef;
    if (!canvas) return null;

    return getCanvasPointFromEvent(event, canvas);
  };

  const eventToWorld = (event: MouseEvent) => {
    const point = eventToCanvasPoint(event);
    return point ? projectToWorld(point, viewport()) : null;
  };

  const findNearestVertex = (point: Vertex) => {
    return findNearestLevelVertex(point, settings().level.linedefs, scale());
  };

  const effectiveCursorPoint = () => {
    const point = cursorPoint();
    if (!point) return null;

    return isAddingLinedef() ? findNearestVertex(point) ?? point : point;
  };

  const render = () => {
    const canvas = canvasRef;
    if (!canvas) return;

    renderEditorCanvas(canvas, {
      cursorPoint: cursorPoint(),
      effectiveCursorPoint: effectiveCursorPoint(),
      findNearestVertex,
      isAddingLinedef: isAddingLinedef(),
      isDraggingCamera: isDraggingCamera(),
      isEditingCamera: isEditingCamera(),
      isEditingSectors: false,
      isEditingVertex: isEditingVertex(),
      pendingLinedefStart: pendingLinedefStart(),
      sectorCandidates: sectorCandidates(),
      selectedIndex: selectedIndex(),
      selectedSectorId: selectedSectorId(),
      selectedVertex: selectedVertex(),
      settings: settings(),
      viewport: viewport(),
    });
  };

  const persist = () => {
    localStorage.setItem(STORAGE_KEY, json());
  };

  const copyJsonToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(json());
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }

    window.setTimeout(() => setCopyStatus('idle'), 1600);
  };

  onMount(() => {
    const resizeObserver = new ResizeObserver(() => {
      setCanvasRevision((revision) => revision + 1);
    });

    if (canvasRef) {
      resizeObserver.observe(canvasRef);
    }

    setSettings(loadInitialSettings());
    setHydrated(true);

    onCleanup(() => {
      resizeObserver.disconnect();
    });
  });

  createEffect(() => {
    canvasRevision();
    render();
    if (hydrated() && typeof localStorage !== 'undefined') {
      persist();
    }
  });

  const startAddingLinedef = () => {
    setSelectedIndex(null);
    setSelectedVertex(null);
    setIsEditingVertex(false);
    setIsDraggingVertex(false);
    setIsEditingCamera(false);
    setIsDraggingCamera(false);
    setIsNavigatingMap(false);
    setIsDraggingMap(false);
    setLastDragPoint(null);
    setSelectedSectorId(null);
    setPendingLinedefStart(null);
    setIsAddingLinedef(true);
  };

  const cancelAddingLinedef = () => {
    setPendingLinedefStart(null);
    setIsAddingLinedef(false);
  };

  const startEditingVertex = () => {
    cancelAddingLinedef();
    setIsNavigatingMap(false);
    setIsDraggingMap(false);
    setLastDragPoint(null);
    setIsEditingCamera(false);
    setIsDraggingCamera(false);
    setSelectedSectorId(null);
    setSelectedIndex(null);
    setSelectedVertex(null);
    setIsDraggingVertex(false);
    setIsEditingVertex(true);
  };

  const cancelEditingVertex = () => {
    setSelectedVertex(null);
    setIsDraggingVertex(false);
    setIsEditingVertex(false);
  };

  const startEditingCamera = () => {
    cancelAddingLinedef();
    cancelEditingVertex();
    setIsNavigatingMap(false);
    setIsDraggingMap(false);
    setLastDragPoint(null);
    setSelectedSectorId(null);
    setSelectedIndex(null);
    setIsDraggingCamera(false);
    setIsEditingCamera(true);
  };

  const cancelEditingCamera = () => {
    setIsDraggingCamera(false);
    setIsEditingCamera(false);
  };

  const startNavigatingMap = () => {
    cancelAddingLinedef();
    cancelEditingVertex();
    cancelEditingCamera();
    setSelectedSectorId(null);
    setSelectedIndex(null);
    setIsDraggingMap(false);
    setLastDragPoint(null);
    setIsNavigatingMap(true);
  };

  const cancelNavigatingMap = () => {
    setIsDraggingMap(false);
    setLastDragPoint(null);
    setIsNavigatingMap(false);
  };

  const toggleAddingLinedef = () => {
    if (isAddingLinedef()) {
      cancelAddingLinedef();
      return;
    }

    startAddingLinedef();
  };

  const toggleNavigatingMap = () => {
    if (isNavigatingMap()) {
      cancelNavigatingMap();
      return;
    }

    startNavigatingMap();
  };

  const addLinedef = (start: Vertex, end: Vertex) => {
    if (Math.hypot(end.x - start.x, end.y - start.y) === 0) return;

    setSettings((prev) => {
      const nextSettings = addLinedefToSettings(prev, start, end);
      const createdSectors = createMissingSectorsFromLinedefs(
        nextSettings.level.linedefs,
        nextSettings.level.sectors,
      );

      setSelectedIndex(prev.level.linedefs.length);

      if (createdSectors.length === 0) return nextSettings;

      return {
        ...nextSettings,
        level: {
          ...nextSettings.level,
          sectors: [...(nextSettings.level.sectors ?? []), ...createdSectors],
        },
      };
    });
  };

  const handleAddLinedefClick = (point: Vertex) => {
    const snappedPoint = findNearestVertex(point) ?? point;
    const start = pendingLinedefStart();

    if (!start) {
      setSelectedIndex(null);
      setPendingLinedefStart(snappedPoint);
      return;
    }

    addLinedef(start, snappedPoint);
    setPendingLinedefStart(null);
    setIsAddingLinedef(false);
  };

  const moveSelectedVertex = (point: Vertex) => {
    const selected = selectedVertex();
    if (!selected) return;

    setSettings((prev) => moveVertexInSettings(prev, selected, point));
    setSelectedVertex({ ...point });
  };

  const updateSelectedVertex = (axis: 'x' | 'y', value: number) => {
    const selected = selectedVertex();
    if (!selected) return;

    moveSelectedVertex({
      ...selected,
      [axis]: value,
    });
  };

  const deleteSelectedVertex = () => {
    const selected = selectedVertex();
    if (!selected) return;

    setSettings((prev) => deleteVertexFromSettings(prev, selected));
    cancelEditingVertex();
    setSelectedIndex(null);
    setSelectedSectorId(null);
  };

  const isCameraInHitRadius = (point: Vertex) => {
    const camera = settings().camera;

    return Math.hypot(point.x - camera.x, point.y - camera.y) * scale() <= HIT_DISTANCE;
  };

  const moveCamera = (point: Vertex) => {
    setSettings((prev) => ({
      ...prev,
      camera: {
        ...prev.camera,
        x: point.x,
        y: point.y,
      },
    }));
  };

  const findNearestLinedefIndex = (point: Vertex) => {
    let bestIndex: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    settings().level.linedefs.forEach((linedef, index) => {
      const distance = distanceToSegment(point, linedef) * scale();
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    return bestDistance <= HIT_DISTANCE ? bestIndex : null;
  };

  const updateSelectedLinedef = (
    field: 'start' | 'end',
    axis: 'x' | 'y',
    value: number,
  ) => {
    const index = selectedIndex();
    if (index === null) return;

    setSettings((prev) => updateLinedefPoint(prev, index, field, axis, value));
  };

  const updateSelectedColor = (color: string) => {
    const index = selectedIndex();
    if (index === null) return;

    setSettings((prev) => updateLinedefColor(prev, index, color));
  };

  const updateSelectedPortal = (enabled: boolean) => {
    const index = selectedIndex();
    if (index === null || !canSelectedLinedefBePortal()) return;

    setSettings((prev) => updateLinedefPortal(prev, index, enabled));
  };

  const updateSelectedSectorNumber = (field: SectorNumberField, value: number) => {
    const id = selectedSectorId();
    if (id === null) return;

    setSettings((prev) => updateSectorNumberField(prev, id, field, value));
  };

  const updateSelectedSectorColor = (field: SectorColorField, value: string) => {
    const id = selectedSectorId();
    if (id === null) return;

    setSettings((prev) => updateSectorColorField(prev, id, field, value));
  };

  const updateCamera = (field: CameraField, value: number) => {
    setSettings((prev) => ({
      ...prev,
      camera: {
        ...prev.camera,
        [field]:
          field === 'angle' || field === 'fov'
            ? new Angle(value)
            : value,
      },
    }));
  };

  const deleteSelectedLinedef = () => {
    const index = selectedIndex();
    if (index === null) return;

    setSettings((prev) => deleteLinedefAtIndex(prev, index));
    setSelectedIndex(null);
  };

  const findSectorAtPoint = (point: Vertex) => {
    const sectors = settings().level.sectors ?? [];

    return sectors
      .filter((sector) => isPointInPolygon(point, sector.segs.map((seg) => seg.start)))
      .sort((first, second) => {
        const firstArea = Math.abs(polygonArea(first.segs.map((seg) => seg.start)));
        const secondArea = Math.abs(polygonArea(second.segs.map((seg) => seg.start)));

        return firstArea - secondArea;
      })[0] ?? null;
  };

  const selectOrCreateSector = (point: Vertex) => {
    const existingSector = findSectorAtPoint(point);

    if (existingSector) {
      setSelectedIndex(null);
      setSelectedSectorId(existingSector.id ?? null);
      return;
    }

    const candidate = findSectorCandidateAtPoint(point, sectorCandidates());
    if (!candidate) {
      setSelectedIndex(null);
      setSelectedSectorId(null);
      return;
    }

    setSettings((prev) => {
      const sector = createSectorFromCandidate(candidate, prev.level.sectors);

      setSelectedIndex(null);
      setSelectedSectorId(sector.id ?? null);

      return {
        ...prev,
        level: {
          ...prev.level,
          sectors: [...(prev.level.sectors ?? []), sector],
        },
      };
    });
  };

  const panMap = (from: Vertex, to: Vertex) => {
    setOffsetX((current) => current + to.x - from.x);
    setOffsetY((current) => current + to.y - from.y);
  };

  const zoomAtPoint = (factor: number, point: Vertex) => {
    const currentScale = scale();
    const nextScale = Math.max(0.25, Math.min(4, currentScale * factor));
    const ratio = nextScale / currentScale;

    setOffsetX(point.x - (point.x - offsetX()) * ratio);
    setOffsetY(point.y - (point.y - offsetY()) * ratio);
    setScale(nextScale);
  };

  const handleVertexMouseDown = (point: Vertex) => {
    const vertex = findNearestVertex(point);

    if (!vertex) {
      if (selectedVertex()) {
        cancelEditingVertex();
        return;
      }

      setIsDraggingVertex(false);
      return;
    }

    setSelectedIndex(null);
    setSelectedVertex(vertex);
    setIsDraggingVertex(true);
  };

  const switchToVertexAtPoint = (point: Vertex) => {
    const vertex = findNearestVertex(point);
    if (!vertex) return false;

    startEditingVertex();
    setSelectedVertex(vertex);

    return true;
  };

  const switchToCameraAtPoint = (point: Vertex) => {
    if (!isCameraInHitRadius(point)) return false;

    startEditingCamera();

    return true;
  };

  const handleCanvasClick = (event: MouseEvent) => {
    const point = eventToWorld(event);
    if (!point) return;

    setCursorPoint(point);

    if (isAddingLinedef()) {
      handleAddLinedefClick(point);
      return;
    }

    if (isEditingVertex()) {
      return;
    }

    if (isEditingCamera()) {
      return;
    }

    if (isNavigatingMap()) {
      return;
    }

    if (switchToCameraAtPoint(point)) {
      return;
    }

    if (switchToVertexAtPoint(point)) {
      return;
    }

    const linedefIndex = findNearestLinedefIndex(point);
    if (linedefIndex !== null) {
      setSelectedSectorId(null);
      setSelectedIndex(linedefIndex);
      return;
    }

    selectOrCreateSector(point);
  };

  const handleCanvasMouseMove = (event: MouseEvent) => {
    const point = eventToWorld(event);

    setCursorPoint(point);

    if (isNavigatingMap() && isDraggingMap()) {
      const canvasPoint = eventToCanvasPoint(event);
      const previousPoint = lastDragPoint();

      if (canvasPoint && previousPoint) {
        panMap(previousPoint, canvasPoint);
        setLastDragPoint(canvasPoint);
      }

      return;
    }

    if (point && isEditingVertex() && isDraggingVertex()) {
      moveSelectedVertex(point);
      return;
    }

    if (point && isEditingCamera() && isDraggingCamera()) {
      moveCamera(point);
    }
  };

  const handleCanvasMouseDown = (event: MouseEvent) => {
    const point = eventToWorld(event);
    if (!point) return;

    setCursorPoint(point);

    if (isNavigatingMap()) {
      setIsDraggingMap(true);
      setLastDragPoint(eventToCanvasPoint(event));
      return;
    }

    if (isEditingVertex()) {
      handleVertexMouseDown(point);
      return;
    }

    if (isEditingCamera()) {
      if (!isCameraInHitRadius(point)) {
        cancelEditingCamera();
        return;
      }

      setIsDraggingCamera(true);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingVertex(false);
    setIsDraggingCamera(false);
    setIsDraggingMap(false);
    setLastDragPoint(null);
  };

  const handleCanvasWheel = (event: WheelEvent) => {
    if (!isNavigatingMap()) return;

    const point = eventToCanvasPoint(event);
    if (!point) return;

    event.preventDefault();
    setCursorPoint(projectToWorld(point, viewport()));
    zoomAtPoint(event.deltaY < 0 ? 1.12 : 1 / 1.12, point);
  };

  const zoom = (factor: number) => {
    zoomAtPoint(factor, {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
    });
  };

  const centerMap = () => {
    const nextScale = 1;
    const bounds = getLinedefsBounds(settings().level.linedefs);

    setScale(nextScale);

    if (!bounds) {
      setOffsetX(CANVAS_WIDTH / 2);
      setOffsetY(CANVAS_HEIGHT / 2);
      return;
    }

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    setOffsetX(CANVAS_WIDTH / 2 - centerX * nextScale);
    setOffsetY(CANVAS_HEIGHT / 2 - centerY * nextScale);
  };

  const numberValue = (event: InputEvent) =>
    Number((event.currentTarget as HTMLInputElement).value);

  const colorValue = (value: string | Color | undefined, fallback: string) =>
    typeof value === 'string' ? value : fallback;

  return (
    <section class="flex flex-col gap-4">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div class="flex min-w-0 flex-col gap-3">
          <EditorToolbar
            isAddingLinedef={isAddingLinedef()}
            isNavigatingMap={isNavigatingMap()}
            onAddLinedefToggle={toggleAddingLinedef}
            onCenterMap={centerMap}
            onNavigateMapToggle={toggleNavigatingMap}
            onZoomIn={() => zoom(1.25)}
            onZoomOut={() => zoom(0.8)}
          />

          <canvas
            ref={(canvas) => {
              canvasRef = canvas;
            }}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onWheel={handleCanvasWheel}
            onMouseLeave={() => {
              setCursorPoint(null);
              setIsDraggingVertex(false);
              setIsDraggingCamera(false);
              setIsDraggingMap(false);
              setLastDragPoint(null);
            }}
            class={
              isNavigatingMap()
                ? isDraggingMap()
                  ? 'h-auto w-full max-w-full cursor-grabbing rounded border border-[#c3d0ea] bg-white'
                  : 'h-auto w-full max-w-full cursor-grab rounded border border-[#c3d0ea] bg-white'
                : isEditingVertex() || isEditingCamera()
                  ? 'h-auto w-full max-w-full cursor-move rounded border border-[#c3d0ea] bg-white'
                  : 'h-auto w-full max-w-full rounded border border-[#c3d0ea] bg-white'
            }
          />
        </div>

        <aside class="flex min-w-0 flex-col gap-3">
          <div class="rounded border border-[#d8deea] bg-[#f8faff] p-3">
            <p class="text-sm font-medium text-[#4a5a75]">{sidebarHint()}</p>
          </div>

          <Show when={selectedVertex()}>
            {(vertex) => (
              <div class="rounded border border-[#d8deea] bg-white p-3">
                <h2 class="mb-3 text-lg font-semibold text-[#1f2a44]">Vertex</h2>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                    X
                    <input
                      type="number"
                      value={vertex().x}
                      onInput={(event) => updateSelectedVertex('x', numberValue(event))}
                      class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                    />
                  </label>
                  <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                    Y
                    <input
                      type="number"
                      value={vertex().y}
                      onInput={(event) => updateSelectedVertex('y', numberValue(event))}
                      class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                    />
                  </label>
                  <div class="flex items-end sm:col-span-2">
                    <button
                      type="button"
                      onClick={deleteSelectedVertex}
                      class="w-full rounded border border-[#e2b4b4] bg-[#fff7f7] px-3 py-2 text-sm font-semibold text-[#8a2a2a] transition-colors hover:bg-[#ffeaea]"
                    >
                      Удалить vertex
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Show>

          <Show when={!selectedVertex()}>
            <div class="rounded border border-[#d8deea] bg-white p-3">
              <Show
                when={selectedLinedef()}
                fallback={
                  <p class="text-sm text-[#6b7a8f]">
                    Нажмите на linedef на карте, чтобы открыть редактирование.
                  </p>
                }
              >
                {(selected) => (
                  <div class="grid gap-3 sm:grid-cols-2">
                    <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                      Start X
                      <input
                        type="number"
                        value={selected().start.x}
                        onInput={(event) => updateSelectedLinedef('start', 'x', numberValue(event))}
                        class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                      />
                    </label>
                    <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                      Start Y
                      <input
                        type="number"
                        value={selected().start.y}
                        onInput={(event) => updateSelectedLinedef('start', 'y', numberValue(event))}
                        class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                      />
                    </label>
                    <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                      End X
                      <input
                        type="number"
                        value={selected().end.x}
                        onInput={(event) => updateSelectedLinedef('end', 'x', numberValue(event))}
                        class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                      />
                    </label>
                    <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                      End Y
                      <input
                        type="number"
                        value={selected().end.y}
                        onInput={(event) => updateSelectedLinedef('end', 'y', numberValue(event))}
                        class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                      />
                    </label>
                    <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                      Цвет
                      <input
                        type="color"
                        value={selected().color ?? '#2563eb'}
                        onInput={(event) =>
                          updateSelectedColor((event.currentTarget as HTMLInputElement).value)
                        }
                        class="h-9 rounded border border-[#c3d0ea] bg-white px-2 py-1"
                      />
                    </label>
                    <div class="flex flex-col gap-2 rounded border border-[#d8deea] bg-[#f8faff] p-2 text-sm text-[#4a5a75] sm:col-span-2">
                      <label
                        class={
                          canSelectedLinedefBePortal()
                            ? 'flex items-center gap-2 font-semibold text-[#1f2a44]'
                            : 'flex items-center gap-2 font-semibold text-[#8a94a8]'
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected().isTwoSide === true && selected().isSolid === false}
                          disabled={!canSelectedLinedefBePortal()}
                          onInput={(event) =>
                            updateSelectedPortal((event.currentTarget as HTMLInputElement).checked)
                          }
                          class="h-4 w-4"
                        />
                        Портал между секторами
                      </label>
                      <Show when={isSelectedLinedefPortalCandidate()}>
                        <p class="text-xs leading-relaxed text-[#6b7a8f]">
                          {canSelectedLinedefBePortal()
                            ? `Связанные sectors: ${selectedLinedefSharedSectorIds().join(', ')}.`
                            : 'Портал можно включить только для linedef, который входит минимум в два sector.'}
                        </p>
                      </Show>
                    </div>
                    <div class="flex items-end">
                      <button
                        type="button"
                        onClick={deleteSelectedLinedef}
                        class="w-full rounded border border-[#e2b4b4] bg-[#fff7f7] px-3 py-2 text-sm font-semibold text-[#8a2a2a] transition-colors hover:bg-[#ffeaea]"
                      >
                        Удалить linedef
                      </button>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </Show>

          <Show when={selectedSector()}>
            {(sector) => (
              <div class="rounded border border-[#b8ded8] bg-[#f1fcfa] p-3">
                <h2 class="mb-3 text-lg font-semibold text-[#174c45]">
                  Sector #{sector().id}
                </h2>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="flex flex-col gap-1 text-sm text-[#245c55]">
                    Floor height
                    <input
                      type="number"
                      value={sector().floorHeight ?? 0}
                      onInput={(event) =>
                        updateSelectedSectorNumber('floorHeight', numberValue(event))
                      }
                      class="rounded border border-[#b8ded8] px-2 py-1 text-[#1f2a44]"
                    />
                  </label>
                  <label class="flex flex-col gap-1 text-sm text-[#245c55]">
                    Ceil height
                    <input
                      type="number"
                      value={sector().ceilHeight ?? 120}
                      onInput={(event) =>
                        updateSelectedSectorNumber('ceilHeight', numberValue(event))
                      }
                      class="rounded border border-[#b8ded8] px-2 py-1 text-[#1f2a44]"
                    />
                  </label>
                  <label class="flex flex-col gap-1 text-sm text-[#245c55]">
                    Brightness
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={sector().brightness ?? 1}
                      onInput={(event) =>
                        updateSelectedSectorNumber('brightness', numberValue(event))
                      }
                      class="rounded border border-[#b8ded8] px-2 py-1 text-[#1f2a44]"
                    />
                  </label>
                  <label class="flex flex-col gap-1 text-sm text-[#245c55]">
                    Floor color
                    <input
                      type="color"
                      value={colorValue(sector().floorColor, '#4ade80')}
                      onInput={(event) =>
                        updateSelectedSectorColor(
                          'floorColor',
                          (event.currentTarget as HTMLInputElement).value,
                        )
                      }
                      class="h-9 rounded border border-[#b8ded8] bg-white px-2 py-1"
                    />
                  </label>
                  <label class="flex flex-col gap-1 text-sm text-[#245c55]">
                    Ceil color
                    <input
                      type="color"
                      value={colorValue(sector().ceilColor, '#93c5fd')}
                      onInput={(event) =>
                        updateSelectedSectorColor(
                          'ceilColor',
                          (event.currentTarget as HTMLInputElement).value,
                        )
                      }
                      class="h-9 rounded border border-[#b8ded8] bg-white px-2 py-1"
                    />
                  </label>
                  <label class="flex flex-col gap-1 text-sm text-[#245c55]">
                    Wall color
                    <input
                      type="color"
                      value={colorValue(sector().wallColor, '#2563eb')}
                      onInput={(event) =>
                        updateSelectedSectorColor(
                          'wallColor',
                          (event.currentTarget as HTMLInputElement).value,
                        )
                      }
                      class="h-9 rounded border border-[#b8ded8] bg-white px-2 py-1"
                    />
                  </label>
                </div>
              </div>
            )}
          </Show>

          <Show when={isEditingCamera()}>
            <div class="rounded border border-[#d8deea] bg-white p-3">
              <h2 class="mb-3 text-lg font-semibold text-[#1f2a44]">Камера</h2>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                  X
                  <input
                    type="number"
                    value={settings().camera.x}
                    onInput={(event) => updateCamera('x', numberValue(event))}
                    class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                  Y
                  <input
                    type="number"
                    value={settings().camera.y}
                    onInput={(event) => updateCamera('y', numberValue(event))}
                    class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                  Angle
                  <input
                    type="number"
                    value={settings().camera.angle.degrees}
                    onInput={(event) => updateCamera('angle', numberValue(event))}
                    class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                  FOV
                  <input
                    type="number"
                    min="1"
                    max="179"
                    value={settings().camera.fov.degrees}
                    onInput={(event) => updateCamera('fov', numberValue(event))}
                    class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                  Move speed
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={settings().camera.moveSpeed}
                    onInput={(event) => updateCamera('moveSpeed', numberValue(event))}
                    class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                  />
                </label>
                <label class="flex flex-col gap-1 text-sm text-[#4a5a75]">
                  Rotation speed
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={settings().camera.rotationSpeed}
                    onInput={(event) => updateCamera('rotationSpeed', numberValue(event))}
                    class="rounded border border-[#c3d0ea] px-2 py-1 text-[#1f2a44]"
                  />
                </label>
              </div>
            </div>
          </Show>
        </aside>
      </div>

      <section class="flex min-w-0 flex-col gap-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-semibold text-[#1f2a44]">JSON Settings</h2>
            <Show when={copyStatus() !== 'idle'}>
              <span
                class={
                  copyStatus() === 'copied'
                    ? 'text-sm font-medium text-[#047857]'
                    : 'text-sm font-medium text-[#be123c]'
                }
              >
                {copyStatus() === 'copied' ? 'Скопировано' : 'Не удалось скопировать'}
              </span>
            </Show>
          </div>
          <button
            type="button"
            onClick={copyJsonToClipboard}
            class="rounded border border-[#c3d0ea] bg-transparent px-3 py-2 text-sm font-semibold text-[#1f2a44] transition-colors hover:bg-[#f4f8ff]"
          >
            Скопировать
          </button>
        </div>
        <JsonViewer data={jsonSettings()} />
      </section>
    </section>
  );
};

export default Editor;

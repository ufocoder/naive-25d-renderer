import content from '@app/styles/content.module.css';
import editorStyles from '@app/styles/editor.module.css';
import mapStyles from '@app/styles/map.module.css';
import { Angle } from '@app/lib/Angle';
import Canvas from '@app/components/Canvas/CanvasBase';
import { JsonViewer } from '@app/components/JsonViewer';
import { useBspTree } from '@app/stages/Stage3b/hooks/useBspTree';
import { useCameraControlsV3 } from '@app/stages/Stage4b/hooks/useCameraControls';
import { createRender25d } from '@app/stages/Stage5e/render25d';
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

const PREVIEW_CANVAS_WIDTH = 400;
const PREVIEW_CANVAS_HEIGHT = 320;
const PREVIEW_COMPACT_HEIGHT_SCALE = 80;

function isSameVertex(first: Vertex, second: Vertex) {
  return first.x === second.x && first.y === second.y;
}

function isSameLinedef(first: Linedef, second: Linedef) {
  return (
    (isSameVertex(first.start, second.start) && isSameVertex(first.end, second.end)) ||
    (isSameVertex(first.start, second.end) && isSameVertex(first.end, second.start))
  );
}

function getPreviewHeightScale(sourceSectors: Sector[]) {
  const maxCeilHeight = Math.max(
    0,
    ...sourceSectors.map((sector) => sector.ceilHeight ?? 120),
  );

  return maxCeilHeight <= 1_000 ? PREVIEW_COMPACT_HEIGHT_SCALE : 1;
}

function createPreviewSettings(source: Settings): Settings {
  const sourceSectors = [
    ...(source.level.sectors ?? []),
    ...createMissingSectorsFromLinedefs(source.level.linedefs, source.level.sectors),
  ];
  const heightScale = getPreviewHeightScale(sourceSectors);
  const cameraHeight = source.camera.height ?? source.camera.z ?? 60;
  const previewSectors: Sector[] = sourceSectors.map((sector) => ({
    ...sector,
    floorHeight: (sector.floorHeight ?? 0) * heightScale,
    floorColor: sector.floorColor ?? { r: 74, g: 222, b: 128 },
    floorTexture: sector.floorTexture ?? 'floor',
    ceilHeight: (sector.ceilHeight ?? 120) * heightScale,
    ceilColor: sector.ceilColor ?? { r: 147, g: 197, b: 253 },
    ceilTexture: sector.ceilTexture ?? 'ceil',
    wallColor: sector.wallColor ?? { r: 37, g: 99, b: 235 },
    wallTexture: sector.wallTexture ?? 'wall',
    brightness: sector.brightness ?? 1,
    items: sector.items?.map((item) => ({ ...item })),
    segs: [],
  }));

  previewSectors.forEach((sector, sectorIndex) => {
    const sourceSector = sourceSectors[sectorIndex];

    sector.segs = sourceSector.segs.map((seg) => {
      const backSector = previewSectors.find((candidate, candidateIndex) => {
        if (candidateIndex === sectorIndex) return false;

        return sourceSectors[candidateIndex].segs.some((candidateSeg) =>
          isSameLinedef(seg, candidateSeg),
        );
      });
      const isPortal = Boolean(seg.isTwoSide && seg.isSolid === false && backSector);

      return {
        ...seg,
        start: { ...seg.start },
        end: { ...seg.end },
        frontSector: sector,
        backSector: isPortal ? backSector : undefined,
        isTwoSide: isPortal,
        isSolid: !isPortal,
      };
    });
  });

  return {
    camera: {
      ...source.camera,
      z: (source.camera.z ?? cameraHeight) * heightScale,
      height: cameraHeight * heightScale,
      riseSpeed: source.camera.riseSpeed ?? 10,
      screen: {
        width: PREVIEW_CANVAS_WIDTH,
        height: PREVIEW_CANVAS_HEIGHT,
      },
    },
    level: {
      ...source.level,
      linedefs: previewSectors.flatMap((sector) => sector.segs),
      sectors: previewSectors,
    },
  };
}

function applyPreviewCameraToEditorSettings(source: Settings, previewCamera: Camera): Settings {
  const sourceSectors = [
    ...(source.level.sectors ?? []),
    ...createMissingSectorsFromLinedefs(source.level.linedefs, source.level.sectors),
  ];
  const heightScale = getPreviewHeightScale(sourceSectors);

  return {
    ...source,
    camera: {
      ...source.camera,
      x: previewCamera.x,
      y: previewCamera.y,
      angle: new Angle(previewCamera.angle.degrees),
      z: previewCamera.z === undefined ? undefined : previewCamera.z / heightScale,
      height: previewCamera.height === undefined ? undefined : previewCamera.height / heightScale,
    },
  };
}

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
  const sectorCandidates = createMemo(() =>
    findClosedSectorCandidates(settings().level.linedefs),
  );
  const previewSettings = createMemo(() => createPreviewSettings(settings()));
  const previewBspTree = useBspTree({ settings: previewSettings });
  const hasPreviewSectors = createMemo(() => (previewSettings().level.sectors?.length ?? 0) > 0);
  const renderLevelPreview = (ctx: CanvasRenderingContext2D, currentSettings: Settings) => {
    createRender25d({ bspTree: previewBspTree() })(ctx, currentSettings);
  };
  const setPreviewSettingsFromControls = (
    value: Settings | ((previous: Settings) => Settings),
  ) => {
    setSettings((prev) => {
      const previousPreviewSettings = createPreviewSettings(prev);
      const nextPreviewSettings =
        typeof value === 'function' ? value(previousPreviewSettings) : value;

      return applyPreviewCameraToEditorSettings(prev, nextPreviewSettings.camera);
    });
  };

  useCameraControlsV3({
    settings: previewSettings,
    setSettings: setPreviewSettingsFromControls,
    bspTree: previewBspTree(),
  });

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

  const cancelPendingLinedefStart = () => {
    if (!isAddingLinedef() || !pendingLinedefStart()) return false;

    setPendingLinedefStart(null);
    return true;
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (!cancelPendingLinedefStart()) return;

      event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
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

  const handleCanvasContextMenu = (event: MouseEvent) => {
    if (!cancelPendingLinedefStart()) return;

    event.preventDefault();
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
    <section class={content.contentSection}>
      <div class={editorStyles.editorLayout}>
        <div class={editorStyles.editorMainColumn}>
          <EditorToolbar
            isAddingLinedef={isAddingLinedef()}
            isNavigatingMap={isNavigatingMap()}
            onAddLinedefToggle={toggleAddingLinedef}
            onCenterMap={centerMap}
            onNavigateMapToggle={toggleNavigatingMap}
            onZoomIn={() => zoom(1.25)}
            onZoomOut={() => zoom(0.8)}
          />

          <div class={editorStyles.editorWorkspace}>
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
              onContextMenu={handleCanvasContextMenu}
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
                    ? editorStyles.editorCanvasGrabbing
                    : editorStyles.editorCanvasGrab
                  : isEditingVertex() || isEditingCamera()
                    ? editorStyles.editorCanvasMove
                    : editorStyles.editorCanvas
              }
            />

            <aside class={editorStyles.editorInspectorPanel}>
              <Show
                when={selectedVertex() || selectedLinedef() || selectedSector() || isEditingCamera()}
                fallback={
                  <p class={editorStyles.editorInspectorEmpty}>
                    Для редактирования элемента необходимо на него кликнуть.
                  </p>
                }
              >
                <Show when={selectedVertex()}>
                  {(vertex) => (
                    <div class={editorStyles.editorPanel}>
                      <h2 class={editorStyles.editorPanelTitle}>Vertex</h2>
                      <div class={editorStyles.editorFormGrid}>
                        <label class={editorStyles.editorField}>
                          X
                          <input
                            type="number"
                            value={vertex().x}
                            onInput={(event) => updateSelectedVertex('x', numberValue(event))}
                            class={editorStyles.editorInput}
                          />
                        </label>
                        <label class={editorStyles.editorField}>
                          Y
                          <input
                            type="number"
                            value={vertex().y}
                            onInput={(event) => updateSelectedVertex('y', numberValue(event))}
                            class={editorStyles.editorInput}
                          />
                        </label>
                        <div class={editorStyles.editorActionCell}>
                          <button
                            type="button"
                            onClick={deleteSelectedVertex}
                            class={editorStyles.editorDangerButton}
                          >
                            Удалить vertex
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Show>

          <Show when={!selectedVertex()}>
            <Show when={selectedLinedef()}>
              {(selected) => (
                <div class={editorStyles.editorPanel}>
                  <div class={editorStyles.editorFormGrid}>
                    <label class={editorStyles.editorField}>
                      Start X
                      <input
                        type="number"
                        value={selected().start.x}
                        onInput={(event) => updateSelectedLinedef('start', 'x', numberValue(event))}
                        class={editorStyles.editorInput}
                      />
                    </label>
                    <label class={editorStyles.editorField}>
                      Start Y
                      <input
                        type="number"
                        value={selected().start.y}
                        onInput={(event) => updateSelectedLinedef('start', 'y', numberValue(event))}
                        class={editorStyles.editorInput}
                      />
                    </label>
                    <label class={editorStyles.editorField}>
                      End X
                      <input
                        type="number"
                        value={selected().end.x}
                        onInput={(event) => updateSelectedLinedef('end', 'x', numberValue(event))}
                        class={editorStyles.editorInput}
                      />
                    </label>
                    <label class={editorStyles.editorField}>
                      End Y
                      <input
                        type="number"
                        value={selected().end.y}
                        onInput={(event) => updateSelectedLinedef('end', 'y', numberValue(event))}
                        class={editorStyles.editorInput}
                      />
                    </label>
                    <label class={editorStyles.editorField}>
                      Цвет
                      <input
                        type="color"
                        value={selected().color ?? '#2563eb'}
                        onInput={(event) =>
                          updateSelectedColor((event.currentTarget as HTMLInputElement).value)
                        }
                        class={editorStyles.editorSelect}
                      />
                    </label>
                    <div class={editorStyles.editorOption}>
                      <label
                        class={
                          canSelectedLinedefBePortal()
                            ? editorStyles.editorPortalOption
                            : editorStyles.editorPortalOptionDisabled
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected().isTwoSide === true && selected().isSolid === false}
                          disabled={!canSelectedLinedefBePortal()}
                          onInput={(event) =>
                            updateSelectedPortal((event.currentTarget as HTMLInputElement).checked)
                          }
                          class={mapStyles.mapCheckbox}
                        />
                        Портал между секторами
                      </label>
                      <Show when={isSelectedLinedefPortalCandidate()}>
                        <p class={editorStyles.editorOptionText}>
                          {canSelectedLinedefBePortal()
                            ? `Связанные sectors: ${selectedLinedefSharedSectorIds().join(', ')}.`
                            : 'Портал можно включить только для linedef, который входит минимум в два sector.'}
                        </p>
                      </Show>
                    </div>
                    <div class={editorStyles.editorActionCell}>
                      <button
                        type="button"
                        onClick={deleteSelectedLinedef}
                        class={editorStyles.editorDangerButton}
                      >
                        Удалить linedef
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Show>
          </Show>

          <Show when={selectedSector()}>
            {(sector) => (
              <div class={editorStyles.editorSectorPanel}>
                <h2 class={editorStyles.editorSectorTitle}>
                  Sector #{sector().id}
                </h2>
                <div class={editorStyles.editorFormGrid}>
                  <label class={editorStyles.editorSectorField}>
                    Floor height
                    <input
                      type="number"
                      value={sector().floorHeight ?? 0}
                      onInput={(event) =>
                        updateSelectedSectorNumber('floorHeight', numberValue(event))
                      }
                      class={editorStyles.editorSectorInput}
                    />
                  </label>
                  <label class={editorStyles.editorSectorField}>
                    Ceil height
                    <input
                      type="number"
                      value={sector().ceilHeight ?? 120}
                      onInput={(event) =>
                        updateSelectedSectorNumber('ceilHeight', numberValue(event))
                      }
                      class={editorStyles.editorSectorInput}
                    />
                  </label>
                  <label class={editorStyles.editorSectorField}>
                    Brightness
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={sector().brightness ?? 1}
                      onInput={(event) =>
                        updateSelectedSectorNumber('brightness', numberValue(event))
                      }
                      class={editorStyles.editorSectorInput}
                    />
                  </label>
                  <label class={editorStyles.editorSectorField}>
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
                      class={editorStyles.editorSectorSelect}
                    />
                  </label>
                  <label class={editorStyles.editorSectorField}>
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
                      class={editorStyles.editorSectorSelect}
                    />
                  </label>
                  <label class={editorStyles.editorSectorField}>
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
                      class={editorStyles.editorSectorSelect}
                    />
                  </label>
                </div>
              </div>
            )}
          </Show>

          <Show when={isEditingCamera()}>
            <div class={editorStyles.editorPanel}>
              <h2 class={editorStyles.editorPanelTitle}>Камера</h2>
              <div class={editorStyles.editorFormGrid}>
                <label class={editorStyles.editorField}>
                  X
                  <input
                    type="number"
                    value={settings().camera.x}
                    onInput={(event) => updateCamera('x', numberValue(event))}
                    class={editorStyles.editorInput}
                  />
                </label>
                <label class={editorStyles.editorField}>
                  Y
                  <input
                    type="number"
                    value={settings().camera.y}
                    onInput={(event) => updateCamera('y', numberValue(event))}
                    class={editorStyles.editorInput}
                  />
                </label>
                <label class={editorStyles.editorField}>
                  Angle
                  <input
                    type="number"
                    value={settings().camera.angle.degrees}
                    onInput={(event) => updateCamera('angle', numberValue(event))}
                    class={editorStyles.editorInput}
                  />
                </label>
                <label class={editorStyles.editorField}>
                  FOV
                  <input
                    type="number"
                    min="1"
                    max="179"
                    value={settings().camera.fov.degrees}
                    onInput={(event) => updateCamera('fov', numberValue(event))}
                    class={editorStyles.editorInput}
                  />
                </label>
                <label class={editorStyles.editorField}>
                  Move speed
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={settings().camera.moveSpeed}
                    onInput={(event) => updateCamera('moveSpeed', numberValue(event))}
                    class={editorStyles.editorInput}
                  />
                </label>
                <label class={editorStyles.editorField}>
                  Rotation speed
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={settings().camera.rotationSpeed}
                    onInput={(event) => updateCamera('rotationSpeed', numberValue(event))}
                    class={editorStyles.editorInput}
                  />
                </label>
              </div>
            </div>
          </Show>
              </Show>
            </aside>
          </div>
        </div>
      </div>

      <section class={editorStyles.levelPreviewSection}>
        <h2 class={editorStyles.editorJsonTitle}>Просмотр уровня</h2>
        <Show
          when={hasPreviewSectors()}
          fallback={
            <div class={editorStyles.levelPreviewEmpty}>
              Создайте сектор, чтобы увидеть 2.5D-просмотр уровня.
            </div>
          }
        >
          <div class={editorStyles.levelPreviewFrame}>
            <Canvas
              settings={previewSettings}
              width={PREVIEW_CANVAS_WIDTH}
              height={PREVIEW_CANVAS_HEIGHT}
              render={renderLevelPreview}
              className={editorStyles.levelPreviewCanvas}
            />
          </div>
        </Show>
      </section>

      <section class={editorStyles.editorJsonSection}>
        <div class={editorStyles.editorHeaderRow}>
          <div class={editorStyles.editorHeaderTitleGroup}>
            <h2 class={editorStyles.editorJsonTitle}>JSON Settings</h2>
            <Show when={copyStatus() !== 'idle'}>
              <span
                class={
                  copyStatus() === 'copied'
                    ? editorStyles.editorCopySuccess
                    : editorStyles.editorCopyError
                }
              >
                {copyStatus() === 'copied' ? 'Скопировано' : 'Не удалось скопировать'}
              </span>
            </Show>
          </div>
          <button
            type="button"
            onClick={copyJsonToClipboard}
            class={editorStyles.editorGhostButton}
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

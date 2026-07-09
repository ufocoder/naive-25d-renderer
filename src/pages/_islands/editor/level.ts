import { HIT_DISTANCE } from './constants';
import { sameVertex } from './geometry';
import { isPointInPolygon } from './sectors';
import { cloneLinedef } from './settings';
import type { EditableLinedef, SectorColorField, SectorNumberField } from './types';

function isSameLinedef(first: Linedef, second: Linedef) {
  return (
    (sameVertex(first.start, second.start) && sameVertex(first.end, second.end)) ||
    (sameVertex(first.start, second.end) && sameVertex(first.end, second.start))
  );
}

function applyPortalState(linedef: Linedef, enabled: boolean): EditableLinedef {
  return {
    ...cloneLinedef(linedef),
    isTwoSide: enabled,
    isSolid: !enabled,
  };
}

function moveVertexInLinedef(linedef: Linedef, selected: Vertex, point: Vertex): EditableLinedef {
  return {
    ...cloneLinedef(linedef),
    start: sameVertex(linedef.start, selected) ? { ...point } : { ...linedef.start },
    end: sameVertex(linedef.end, selected) ? { ...point } : { ...linedef.end },
  };
}

function linedefUsesVertex(linedef: Linedef, vertex: Vertex) {
  return sameVertex(linedef.start, vertex) || sameVertex(linedef.end, vertex);
}

function getSectorVertices(sector: Sector): Vertex[] {
  return sector.segs.map((seg) => seg.start);
}

function isLinedefInsideSector(linedef: Linedef, sector: Sector) {
  const center = {
    x: (linedef.start.x + linedef.end.x) / 2,
    y: (linedef.start.y + linedef.end.y) / 2,
  };

  return isPointInPolygon(center, getSectorVertices(sector));
}

export function findNearestVertex(
  point: Vertex,
  linedefs: Linedef[],
  scale: number,
): Vertex | null {
  let nearest: Vertex | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const linedef of linedefs) {
    for (const vertex of [linedef.start, linedef.end]) {
      const distance = Math.hypot(point.x - vertex.x, point.y - vertex.y) * scale;

      if (distance < nearestDistance) {
        nearest = vertex;
        nearestDistance = distance;
      }
    }
  }

  return nearest && nearestDistance <= HIT_DISTANCE ? { ...nearest } : null;
}

export function addLinedefToSettings(settings: Settings, start: Vertex, end: Vertex): Settings {
  const linedefs = settings.level.linedefs.map(cloneLinedef);

  linedefs.push({
    start: { ...start },
    end: { ...end },
    color: '#2563eb',
  } as EditableLinedef);

  return {
    ...settings,
    level: {
      ...settings.level,
      linedefs,
    },
  };
}

export function moveVertexInSettings(settings: Settings, selected: Vertex, point: Vertex): Settings {
  return {
    ...settings,
    level: {
      ...settings.level,
      linedefs: settings.level.linedefs.map((linedef) =>
        moveVertexInLinedef(linedef, selected, point),
      ),
      sectors: settings.level.sectors?.map((sector) => ({
        ...sector,
        segs: sector.segs.map((seg) => moveVertexInLinedef(seg, selected, point)),
      })),
    },
  };
}

export function deleteVertexFromSettings(settings: Settings, vertex: Vertex): Settings {
  return {
    ...settings,
    level: {
      ...settings.level,
      linedefs: settings.level.linedefs
        .filter((linedef) => !linedefUsesVertex(linedef, vertex))
        .map(cloneLinedef),
      sectors: settings.level.sectors
        ?.filter((sector) => !sector.segs.some((seg) => linedefUsesVertex(seg, vertex)))
        .map((sector) => ({
          ...sector,
          segs: sector.segs.map(cloneLinedef),
        })),
    },
  };
}

export function updateLinedefPoint(
  settings: Settings,
  index: number,
  field: 'start' | 'end',
  axis: 'x' | 'y',
  value: number,
): Settings {
  const linedefs = settings.level.linedefs.map(cloneLinedef);
  const linedef = linedefs[index];
  if (!linedef) return settings;

  linedefs[index] = {
    ...linedef,
    [field]: {
      ...linedef[field],
      [axis]: value,
    },
  };

  return {
    ...settings,
    level: {
      ...settings.level,
      linedefs,
    },
  };
}

export function updateLinedefColor(settings: Settings, index: number, color: string): Settings {
  const linedefs = settings.level.linedefs.map(cloneLinedef);
  const linedef = linedefs[index];
  if (!linedef) return settings;

  linedefs[index] = { ...linedef, color };

  return {
    ...settings,
    level: {
      ...settings.level,
      linedefs,
    },
  };
}

export function getSharedSectorIdsForLinedef(
  settings: Settings,
  linedef: Linedef | null | undefined,
): number[] {
  if (!linedef) return [];

  const sectorIds = new Set<number>();

  for (const sector of settings.level.sectors ?? []) {
    if (typeof sector.id !== 'number') continue;

    if (
      sector.segs.some((seg) => isSameLinedef(seg, linedef)) ||
      isLinedefInsideSector(linedef, sector)
    ) {
      sectorIds.add(sector.id);
    }
  }

  return [...sectorIds];
}

export function updateLinedefPortal(
  settings: Settings,
  index: number,
  enabled: boolean,
): Settings {
  const linedef = settings.level.linedefs[index];
  if (!linedef) return settings;

  return {
    ...settings,
    level: {
      ...settings.level,
      linedefs: settings.level.linedefs.map((current, currentIndex) =>
        currentIndex === index ? applyPortalState(current, enabled) : cloneLinedef(current),
      ),
      sectors: settings.level.sectors?.map((sector) => ({
        ...sector,
        segs: sector.segs.map((seg) =>
          isSameLinedef(seg, linedef) ? applyPortalState(seg, enabled) : cloneLinedef(seg),
        ),
      })),
    },
  };
}

export function deleteLinedefAtIndex(settings: Settings, index: number): Settings {
  return {
    ...settings,
    level: {
      ...settings.level,
      linedefs: settings.level.linedefs
        .filter((_, currentIndex) => currentIndex !== index)
        .map(cloneLinedef),
    },
  };
}

export function updateSectorNumberField(
  settings: Settings,
  sectorId: number,
  field: SectorNumberField,
  value: number,
): Settings {
  return {
    ...settings,
    level: {
      ...settings.level,
      sectors: settings.level.sectors?.map((sector) =>
        sector.id === sectorId
          ? {
              ...sector,
              [field]: value,
              segs: sector.segs.map(cloneLinedef),
            }
          : {
              ...sector,
              segs: sector.segs.map(cloneLinedef),
            },
      ),
    },
  };
}

export function updateSectorColorField(
  settings: Settings,
  sectorId: number,
  field: SectorColorField,
  value: string,
): Settings {
  return {
    ...settings,
    level: {
      ...settings.level,
      sectors: settings.level.sectors?.map((sector) =>
        sector.id === sectorId
          ? {
              ...sector,
              [field]: value,
              segs: sector.segs.map(cloneLinedef),
            }
          : {
              ...sector,
              segs: sector.segs.map(cloneLinedef),
            },
      ),
    },
  };
}

export function deleteSectorById(settings: Settings, sectorId: number): Settings {
  return {
    ...settings,
    level: {
      ...settings.level,
      sectors: settings.level.sectors
        ?.filter((sector) => sector.id !== sectorId)
        .map((sector) => ({
          ...sector,
          segs: sector.segs.map(cloneLinedef),
        })),
    },
  };
}

export function getLinedefsBounds(linedefs: Linedef[]) {
  if (linedefs.length === 0) return null;

  const points = linedefs.flatMap((linedef) => [linedef.start, linedef.end]);

  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

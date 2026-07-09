import type { EditableLinedef, EditableSector, SectorCandidate } from './types';

const MIN_AREA = 1;

function vertexKey(vertex: Vertex): string {
  return `${vertex.x}:${vertex.y}`;
}

function edgeKey(start: Vertex, end: Vertex): string {
  return `${vertexKey(start)}>${vertexKey(end)}`;
}

function normalizeCycle(vertices: Vertex[]): string {
  const keys = vertices.map(vertexKey);
  const variants = [keys, [...keys].reverse()].map((variant) => {
    let best = variant;

    for (let index = 1; index < variant.length; index += 1) {
      const rotated = [...variant.slice(index), ...variant.slice(0, index)];
      if (rotated.join('|') < best.join('|')) {
        best = rotated;
      }
    }

    return best.join('|');
  });

  return variants[0] < variants[1] ? variants[0] : variants[1];
}

export function polygonArea(vertices: Vertex[]): number {
  let area = 0;

  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

export function isPointInPolygon(point: Vertex, vertices: Vertex[]): boolean {
  let inside = false;

  for (let index = 0, previousIndex = vertices.length - 1; index < vertices.length; previousIndex = index, index += 1) {
    const current = vertices[index];
    const previous = vertices[previousIndex];
    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function findLinedefBetween(
  linedefs: Linedef[],
  start: Vertex,
  end: Vertex,
): EditableLinedef | null {
  const linedef = linedefs.find((candidate) =>
    (candidate.start.x === start.x &&
      candidate.start.y === start.y &&
      candidate.end.x === end.x &&
      candidate.end.y === end.y) ||
    (candidate.start.x === end.x &&
      candidate.start.y === end.y &&
      candidate.end.x === start.x &&
      candidate.end.y === start.y),
  );

  if (!linedef) return null;

  return {
    ...linedef,
    start: { ...start },
    end: { ...end },
  };
}

function createCandidate(linedefs: Linedef[], vertices: Vertex[]): SectorCandidate | null {
  const area = Math.abs(polygonArea(vertices));
  if (area < MIN_AREA) return null;

  const segs: EditableLinedef[] = [];

  for (let index = 0; index < vertices.length; index += 1) {
    const start = vertices[index];
    const end = vertices[(index + 1) % vertices.length];
    const linedef = findLinedefBetween(linedefs, start, end);
    if (!linedef) return null;

    segs.push(linedef);
  }

  return {
    id: normalizeCycle(vertices),
    area,
    vertices: vertices.map((vertex) => ({ ...vertex })),
    segs,
  };
}

export function findClosedSectorCandidates(linedefs: Linedef[]): SectorCandidate[] {
  const adjacency = new Map<string, Vertex[]>();
  const verticesByKey = new Map<string, Vertex>();

  for (const linedef of linedefs) {
    const startKey = vertexKey(linedef.start);
    const endKey = vertexKey(linedef.end);

    verticesByKey.set(startKey, { ...linedef.start });
    verticesByKey.set(endKey, { ...linedef.end });
    adjacency.set(startKey, [...(adjacency.get(startKey) ?? []), { ...linedef.end }]);
    adjacency.set(endKey, [...(adjacency.get(endKey) ?? []), { ...linedef.start }]);
  }

  const candidates = new Map<string, SectorCandidate>();
  const maxDepth = Math.max(3, linedefs.length);

  for (const start of verticesByKey.values()) {
    const startKey = vertexKey(start);

    function walk(current: Vertex, path: Vertex[], usedEdges: Set<string>) {
      const neighbors = adjacency.get(vertexKey(current)) ?? [];

      for (const next of neighbors) {
        const currentEdgeKey = edgeKey(current, next);
        const reverseEdgeKey = edgeKey(next, current);
        const nextKey = vertexKey(next);

        if (usedEdges.has(currentEdgeKey) || usedEdges.has(reverseEdgeKey)) {
          continue;
        }

        if (nextKey === startKey && path.length >= 3) {
          const candidate = createCandidate(linedefs, path);
          if (candidate) {
            candidates.set(candidate.id, candidate);
          }
          continue;
        }

        if (path.some((vertex) => vertexKey(vertex) === nextKey) || path.length >= maxDepth) {
          continue;
        }

        walk(next, [...path, next], new Set([...usedEdges, currentEdgeKey, reverseEdgeKey]));
      }
    }

    walk(start, [start], new Set());
  }

  return [...candidates.values()].sort((a, b) => a.area - b.area);
}

function getPolygonCenter(vertices: Vertex[]): Vertex {
  return {
    x: vertices.reduce((sum, vertex) => sum + vertex.x, 0) / vertices.length,
    y: vertices.reduce((sum, vertex) => sum + vertex.y, 0) / vertices.length,
  };
}

function getSectorCandidateId(sector: Sector) {
  return normalizeCycle(sector.segs.map((seg) => seg.start));
}

function filterMinimalSectorCandidates(candidates: SectorCandidate[]) {
  return candidates.filter((candidate, index) => {
    return !candidates.some((other, otherIndex) => {
      if (otherIndex === index || other.area >= candidate.area) return false;

      return isPointInPolygon(getPolygonCenter(other.vertices), candidate.vertices);
    });
  });
}

export function createMissingSectorsFromLinedefs(
  linedefs: Linedef[],
  existingSectors: Sector[] = [],
): EditableSector[] {
  const existingIds = new Set(existingSectors.map(getSectorCandidateId));
  const candidates = filterMinimalSectorCandidates(findClosedSectorCandidates(linedefs));
  const sectors = [...existingSectors];
  const createdSectors: EditableSector[] = [];

  for (const candidate of candidates) {
    if (existingIds.has(candidate.id)) continue;

    const sector = createSectorFromCandidate(candidate, sectors);
    sectors.push(sector);
    createdSectors.push(sector);
    existingIds.add(candidate.id);
  }

  return createdSectors;
}

export function findSectorCandidateAtPoint(
  point: Vertex,
  candidates: SectorCandidate[],
): SectorCandidate | null {
  return candidates.find((candidate) => isPointInPolygon(point, candidate.vertices)) ?? null;
}

export function createSectorFromCandidate(
  candidate: SectorCandidate,
  existingSectors: Sector[] = [],
): EditableSector {
  const nextId = Math.max(0, ...existingSectors.map((sector) => sector.id ?? 0)) + 1;

  return {
    id: nextId,
    floorHeight: 0,
    floorColor: '#4ade80',
    ceilHeight: 120,
    ceilColor: '#93c5fd',
    wallColor: '#2563eb',
    brightness: 1,
    segs: candidate.segs.map((seg) => ({
      ...seg,
      start: { ...seg.start },
      end: { ...seg.end },
    })),
  };
}

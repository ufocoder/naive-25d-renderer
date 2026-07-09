import { Angle } from '@app/lib/Angle';

import { CANVAS_HEIGHT, CANVAS_WIDTH, STORAGE_KEY } from './constants';
import type { EditableLinedef, EditableSector, JsonSettings } from './types';

export const defaultSettings: Settings = {
  camera: {
    x: 200,
    y: 180,
    fov: new Angle(45),
    angle: new Angle(270),
    screen: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    },
    moveSpeed: 2,
    rotationSpeed: 2,
  },
  level: {
    linedefs: [
      { start: { x: 120, y: 100 }, end: { x: 340, y: 100 }, color: '#2563eb' } as EditableLinedef,
      { start: { x: 340, y: 100 }, end: { x: 340, y: 260 }, color: '#2563eb' } as EditableLinedef,
      { start: { x: 340, y: 260 }, end: { x: 120, y: 260 }, color: '#2563eb' } as EditableLinedef,
      { start: { x: 120, y: 260 }, end: { x: 120, y: 100 }, color: '#2563eb' } as EditableLinedef,
    ],
  },
};

export function cloneLinedef(linedef: Linedef): EditableLinedef {
  return {
    ...linedef,
    start: { ...linedef.start },
    end: { ...linedef.end },
  };
}

export function cloneSector(sector: Sector): EditableSector {
  return {
    ...sector,
    segs: sector.segs.map(cloneLinedef),
  };
}

export function cloneSettings(settings: Settings): Settings {
  return {
    ...settings,
    camera: {
      ...settings.camera,
      angle: new Angle(settings.camera.angle.degrees),
      fov: new Angle(settings.camera.fov.degrees),
      screen: { ...settings.camera.screen },
    },
    level: {
      ...settings.level,
      linedefs: settings.level.linedefs.map(cloneLinedef),
      sectors: settings.level.sectors?.map(cloneSector),
    },
  };
}

export function toJsonSettings(settings: Settings): JsonSettings {
  return {
    camera: {
      ...settings.camera,
      angle: settings.camera.angle.degrees,
      fov: settings.camera.fov.degrees,
      screen: { ...settings.camera.screen },
    },
    level: {
      linedefs: settings.level.linedefs.map(cloneLinedef),
      sectors: settings.level.sectors?.map(cloneSector),
    },
  };
}

export function fromJsonSettings(value: JsonSettings): Settings {
  return {
    camera: {
      ...value.camera,
      angle: new Angle(value.camera.angle),
      fov: new Angle(value.camera.fov),
      screen: { ...value.camera.screen },
    },
    level: {
      linedefs: value.level.linedefs.map(cloneLinedef),
      sectors: value.level.sectors?.map(cloneSector),
    },
  };
}

export function loadInitialSettings(): Settings {
  if (typeof localStorage === 'undefined') {
    return cloneSettings(defaultSettings);
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneSettings(defaultSettings);
  }

  try {
    return fromJsonSettings(JSON.parse(raw) as JsonSettings);
  } catch {
    return cloneSettings(defaultSettings);
  }
}

import { createSignal, onCleanup, type Accessor, type Setter } from "solid-js";
import createLoop from "@app/lib/loop";
import { Angle } from "@app/lib/Angle";
import type { BSPNode } from "@app/stages/Stage6a/bsp/typings";
import { findCameraSector } from "@app/stages/Stage6a/bsp/traverse";


const DEFAULT_CAMERA_HEIGHT = 500;
const DEFAULT_CAMERA_VERTICAL_SPEED = 50;

interface UseCameraControlsProps {
  bspTree: BSPNode;
  settings: Accessor<Settings>;
  setSettings: Setter<Settings>;
}

export function useCameraControlsV2({
  bspTree,
  setSettings
}: UseCameraControlsProps) {
  const [isRising, setRising] = createSignal(0);
  const [isMoving, setMoving] = createSignal(0);
  const [isRotating, setRotating] = createSignal(0);

  function moveCamera(camera: Camera, direction: number, sector: Sector) {
    let playerCos = camera.angle.cos * camera.moveSpeed;
    let playerSin = camera.angle.sin * camera.moveSpeed;
    let newX = camera.x + direction * playerCos;
    let newY = camera.y + direction * playerSin;
    let height = camera.height || DEFAULT_CAMERA_HEIGHT;
    let newZ = sector.floorHeight! + height;

    return {
      ...camera,
      x: newX,
      y: newY,
      z: newZ,
    };
  }

   function riseCamera(camera: Camera, direction: number, sector: Sector) {
    let speed = camera.riseSpeed || DEFAULT_CAMERA_VERTICAL_SPEED;
    let height = camera.height || DEFAULT_CAMERA_HEIGHT;
    let newZ = camera.z! + direction * speed;
    
    newZ = Math.max(sector.floorHeight! + height, Math.min(sector.ceilHeight! - height, newZ!));

    return {
      ...camera,
      z: newZ,
    };
  }

  function rotateCamera(camera: Camera, direction: number) {
    return {
      ...camera,
      angle: new Angle((camera.angle.degrees + direction * camera.rotationSpeed + 360) % 360),
    };
  }

  const mainLoop = createLoop(function () {
    if (isMoving()) {
      setSettings((prev) => {
        const sector = findCameraSector(bspTree, prev.camera)!;

        return {
          ...prev,
          camera: moveCamera(prev.camera, isMoving(), sector),
        }
      });
    }

    if (isRotating()) {
      setSettings((prev) => {
        return {
          ...prev,
          camera: rotateCamera(prev.camera, isRotating()),
        }
      });
    }

    if (isRising()) {
      setSettings((prev) => {
        const sector = findCameraSector(bspTree, prev.camera)!;

        return {
          ...prev,
          camera: riseCamera(prev.camera, isRising(), sector),
        }
      });
    }
  });

  mainLoop.play();

  const handleDocumentKeyup = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) {
      return;
    }
    switch (e.code) {
      case "KeyZ":
      case "KeyX":
        setRising(0);
        break;

      case "KeyW":
      case "ArrowUp":
      case "KeyS":
      case "ArrowDown":
        setMoving(0);
        break;

      case "KeyA":
      case "ArrowLeft":
      case "KeyD":
      case "ArrowRight":
        setRotating(0);
        break;
    }
  };

  const handleDocumentKeydown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) {
      return;
    }
    switch (e.code) {
      case "KeyZ":
        setRising(1);
        return;
      case "KeyX":
        setRising(-1);
        return;
      case "KeyW":
      case "ArrowUp":
        setMoving(1);
        return;
      case "KeyS":
      case "ArrowDown":
        setMoving(-1);
        break;

      case "KeyA":
      case "ArrowLeft":
        setRotating(-1);
        break;
      case "KeyD":
      case "ArrowRight":
        setRotating(1);
        break;
    }
  };

  document.addEventListener("keyup", handleDocumentKeyup);
  document.addEventListener("keydown", handleDocumentKeydown);

  onCleanup(() => {
    mainLoop.pause();
    document.removeEventListener("keyup", handleDocumentKeyup);
    document.removeEventListener("keydown", handleDocumentKeydown);
  });
}

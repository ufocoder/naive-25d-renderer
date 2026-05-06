import { createSignal, onCleanup, type Accessor, type Setter } from "solid-js";
import createLoop from "@app/lib/loop";
import { Angle } from "@app/lib/Angle";
import type { BSPNode } from "@app/stages/Stage6a/bsp/typings";
import { findCameraSector } from "@app/stages/Stage6a/bsp/traverse";
import { checkCollisionOptimized, DEFAULT_CONFIG } from "../collision";

const DEFAULT_CAMERA_HEIGHT = 500;
const DEFAULT_CAMERA_VERTICAL_SPEED = 50;

interface UseCameraControlsProps {
  bspTree: BSPNode;
  settings: Accessor<Settings>;
  setSettings: Setter<Settings>;
}

export function useCameraControlsV3({
  bspTree,
  setSettings
}: UseCameraControlsProps) {
  const [isRising, setRising] = createSignal(0);
  const [isMoving, setMoving] = createSignal(0);
  const [isRotating, setRotating] = createSignal(0);

  function moveCamera(camera: Camera, direction: number, sector: Sector, settings: Settings) {
    const moveSpeed = camera.moveSpeed;
    
    let moveX = 0;
    let moveY = 0;
    
    if (direction !== 0) {
      moveX += camera.angle.cos * direction * moveSpeed;
      moveY += camera.angle.sin * direction * moveSpeed;
    }
    
    const collision = checkCollisionOptimized(
      camera.x,
      camera.y,
      camera.x + moveX,
      camera.y + moveY,
      DEFAULT_CONFIG.playerRadius,
      settings.level.linedefs,
      true
    );
    
    const height = camera.height || DEFAULT_CAMERA_HEIGHT;
    let newZ = sector.floorHeight! + height;

    const oldFloorZ = camera.z! - height;
    const newFloorZ = sector.floorHeight!;
    const stepUp = newFloorZ - oldFloorZ;
    
    if (stepUp > 0 && stepUp <= DEFAULT_CONFIG.stepHeight) {
      newZ = sector.floorHeight! + height;
    } else if (stepUp > DEFAULT_CONFIG.stepHeight) {
      return { ...camera };
    }
    
    return {
      ...camera,
      x: collision.x,
      y: collision.y,
      z: newZ,
    };
  }

  function riseCamera(camera: Camera, direction: number, sector: Sector) {
    const speed = camera.riseSpeed || DEFAULT_CAMERA_VERTICAL_SPEED;
    const height = camera.height || DEFAULT_CAMERA_HEIGHT;
    let newZ = camera.z! + direction * speed;
    
    newZ = Math.max(
      sector.floorHeight! + height,
      Math.min(sector.ceilHeight! - height, newZ)
    );

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
    if (isMoving() !== 0) {
      setSettings((prev) => {
        const sector = findCameraSector(bspTree, prev.camera);
        if (!sector) return prev;
        
        return {
          ...prev,
          camera: moveCamera(prev.camera, isMoving(), sector, prev),
        };
      });
    }

    if (isRotating() !== 0) {
      setSettings((prev) => {
        return {
          ...prev,
          camera: rotateCamera(prev.camera, isRotating()),
        };
      });
    }

    if (isRising() !== 0) {
      setSettings((prev) => {
        const sector = findCameraSector(bspTree, prev.camera);
        if (!sector) return prev;
        
        return {
          ...prev,
          camera: riseCamera(prev.camera, isRising(), sector),
        };
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
        break;
      case "KeyX":
        setRising(-1);
        break;
      case "KeyW":
      case "ArrowUp":
        setMoving(1);
        break;
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
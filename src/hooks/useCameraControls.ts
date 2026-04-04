import { createSignal, onCleanup, type Accessor, type Setter } from "solid-js";
import createLoop from "@app/lib/loop";
import { Angle } from "@app/lib/Angle";

interface UseCameraControlsProps<T> {
  settings: Accessor<T>;
  setSettings: Setter<T>;
}

export function useCameraControls<T extends { camera: Camera }>({
  setSettings,
}: UseCameraControlsProps<T>) {
  const [isMoving, setMoving] = createSignal(0);
  const [isRotating, setRotating] = createSignal(0);

  function moveCamera(camera: Camera, direction: number) {
    let playerCos = camera.angle.cos * camera.moveSpeed;
    let playerSin = camera.angle.sin * camera.moveSpeed;
    let newX = camera.x + direction * playerCos;
    let newY = camera.y + direction * playerSin;

    return {
      ...camera,
      x: newX,
      y: newY,
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
      setSettings((prev) => ({
        ...prev,
        camera: moveCamera(prev.camera, isMoving()),
      }));
    }

    if (isRotating()) {
      setSettings((prev) => ({
        ...prev,
        camera: rotateCamera(prev.camera, isRotating()),
      }));
    }
  });

  mainLoop.play();

  const handleDocumentKeyup = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) {
      return;
    }
    switch (e.code) {
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

import mapStyles from '@app/styles/map.module.css';
export interface KeyboardControlsProps {
  withVertical?: boolean;
}

export default function KeyboardControls({ withVertical }: KeyboardControlsProps) {
  const handleMouseDown = (key: string) => {
    const keydownEvent = new KeyboardEvent('keydown', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    });
    
    document.dispatchEvent(keydownEvent);
  };

  const handleMouseUp = (key: string) => {
    const keyupEvent = new KeyboardEvent('keyup', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      bubbles: true,
      cancelable: true,
    });
    
    document.dispatchEvent(keyupEvent);
  };

  return (
    <p class={mapStyles.mapControls}>
      <span>Управление камерой </span>
      <kbd 
        class={mapStyles.mapControlButton}
        onPointerDown={() => handleMouseDown('w')}
        onPointerUp={() => handleMouseUp('w')}
        onContextMenu={(e) => e.preventDefault()}
      >
        W
      </kbd>
      <kbd 
        class={mapStyles.mapControlButton}
        onPointerDown={() => handleMouseDown('a')}
        onPointerUp={() => handleMouseUp('a')}
        onContextMenu={(e) => e.preventDefault()}
      >
        A
      </kbd>
      <kbd 
        class={mapStyles.mapControlButton}
        onPointerDown={() => handleMouseDown('s')}
        onPointerUp={() => handleMouseUp('s')}
        onContextMenu={(e) => e.preventDefault()}
      >
        S
      </kbd>
      <kbd 
        class={mapStyles.mapControlButton}
        onPointerDown={() => handleMouseDown('d')}
        onPointerUp={() => handleMouseUp('d')}
        onContextMenu={(e) => e.preventDefault()}
      >
        D
      </kbd>
      {withVertical && (
        <>
          <span> и </span>
          <kbd 
            class={mapStyles.mapControlButton}
            onPointerDown={() => handleMouseDown('z')}
            onPointerUp={() => handleMouseUp('z')}
            onContextMenu={(e) => e.preventDefault()}
          >
            Z
          </kbd>
          <kbd 
            class={mapStyles.mapControlButton}
            onPointerDown={() => handleMouseDown('x')}
            onPointerUp={() => handleMouseUp('x')}
            onContextMenu={(e) => e.preventDefault()}
          >
            X
          </kbd>
        </>
      )}
    </p>
  );
}

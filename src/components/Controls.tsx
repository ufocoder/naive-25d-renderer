interface KeyboardControlsProps {
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
    <p class="font-normal text-gray-500 my-2 select-none">
      <span>Camera horizontal controls </span>
      <kbd 
        class="p-1.5 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded cursor-pointer hover:bg-gray-200 transition-colors select-none"
        onMouseDown={() => handleMouseDown('w')}
        onMouseUp={() => handleMouseUp('w')}
        onContextMenu={(e) => e.preventDefault()}
      >
        W
      </kbd>{" "}
      <kbd 
        class="p-1.5 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded cursor-pointer hover:bg-gray-200 transition-colors select-none"
        onMouseDown={() => handleMouseDown('a')}
        onMouseUp={() => handleMouseUp('a')}
        onContextMenu={(e) => e.preventDefault()}
      >
        A
      </kbd>{" "}
      <kbd 
        class="p-1.5 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded cursor-pointer hover:bg-gray-200 transition-colors select-none"
        onMouseDown={() => handleMouseDown('s')}
        onMouseUp={() => handleMouseUp('s')}
        onContextMenu={(e) => e.preventDefault()}
      >
        S
      </kbd>{" "}
      <kbd 
        class="p-1.5 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded cursor-pointer hover:bg-gray-200 transition-colors select-none"
        onMouseDown={() => handleMouseDown('d')}
        onMouseUp={() => handleMouseUp('d')}
        onContextMenu={(e) => e.preventDefault()}
      >
        D
      </kbd>{" "}
      {withVertical && (
        <>
          <span> and vertical </span>
          <kbd 
            class="p-1.5 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded cursor-pointer hover:bg-gray-200 transition-colors select-none"
            onMouseDown={() => handleMouseDown('z')}
            onMouseUp={() => handleMouseUp('z')}
            onContextMenu={(e) => e.preventDefault()}
          >
            Z
          </kbd>{" "}
          <kbd 
            class="p-1.5 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded cursor-pointer hover:bg-gray-200 transition-colors select-none"
            onMouseDown={() => handleMouseDown('x')}
            onMouseUp={() => handleMouseUp('x')}
            onContextMenu={(e) => e.preventDefault()}
          >
            X
          </kbd>{" "}
        </>
      )}
    </p>
  );
}
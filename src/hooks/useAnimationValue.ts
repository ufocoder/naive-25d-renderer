// useAnimationValue.ts
import { createSignal, onCleanup } from 'solid-js';

interface UseAnimationValueOptions {
  duration: number;
  loop?: boolean;
}

interface UseAnimationValueReturn {
  percent: () => number;
  startAnimation: () => void;
  stopAnimation: () => void;
}

export function useAnimationValue(options: UseAnimationValueOptions): UseAnimationValueReturn {
  const { duration = 5_000, loop = false } = options;
  
  const [percent, setPercent] = createSignal<number>(0);
  
  let animationFrameId: number | null = null;
  let startTime: number | null = null;
  let isAnimating = false;
  let direction = 1;
  
  const updateValue = (currentTime: number) => {
    if (!isAnimating || startTime === null) return;
    
    const elapsed = currentTime - startTime;
    let progress = Math.min(1, elapsed / duration);
    
    let currentPercent: number;
    if (direction === 1) {
      currentPercent = progress;
    } else {
      currentPercent = 1 - progress;
    }
    
    setPercent(currentPercent);
    
    if (progress >= 1) {
      if (loop) {
        direction *= -1;
        startTime = currentTime;
        animationFrameId = requestAnimationFrame(updateValue);
      } else {
        stopAnimation();
      }
    } else {
      animationFrameId = requestAnimationFrame(updateValue);
    }
  };
  
  const startAnimation = () => {
    stopAnimation();

    direction = percent() >= 0.99 ? -1 : 1;
    
    let currentProgress = direction === 1 ? percent() : 1 - percent();
    
    isAnimating = true;
    startTime = performance.now() - (currentProgress * duration);
    animationFrameId = requestAnimationFrame(updateValue);
  };
  
  const stopAnimation = () => {
    isAnimating = false;
    startTime = null;
    
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  onCleanup(() => {
    stopAnimation();
  });
  
  return {
    percent,
    startAnimation,
    stopAnimation
  };
}
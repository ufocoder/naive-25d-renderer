import editorStyles from '@app/styles/editor.module.css';
import type { Component, JSX } from 'solid-js';
import { createEffect, createSignal, onCleanup } from 'solid-js';

interface StepProgressButtonProps {
  active: boolean;
  children: JSX.Element;
  duration: number;
  onClick: () => void;
  step: number;
}

const StepProgressButton: Component<StepProgressButtonProps> = (props) => {
  const [filled, setFilled] = createSignal(false);
  let frameId: number | undefined;

  createEffect(() => {
    if (frameId !== undefined) {
      cancelAnimationFrame(frameId);
    }

    setFilled(false);

    if (props.active && props.step > 0) {
      frameId = requestAnimationFrame(() => {
        setFilled(true);
      });
    }
  });

  onCleanup(() => {
    if (frameId !== undefined) {
      cancelAnimationFrame(frameId);
    }
  });

  return (
    <button
      type="button"
      class={editorStyles.toolbarProgressButton}
      onClick={props.onClick}
    >
      <span
        aria-hidden="true"
        class={editorStyles.toolbarProgressFill}
        style={{
          transition: filled()
            ? `width ${props.duration}ms linear`
            : 'none',
          width: filled() ? '100%' : '0%',
        }}
      />
      <span class={editorStyles.relativeLayer}>{props.children}</span>
    </button>
  );
};

export default StepProgressButton;

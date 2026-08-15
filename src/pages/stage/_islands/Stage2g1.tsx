import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import Map2d from '@app/components/Map2d';
import StepProgressButton from '@app/pages/stage/_components/StepProgressButton';
import render2d from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import render25d, { type Stage2g1Animation } from '@app/stages/Stage2g1/render25d';
import defaultSettings from '@app/stages/Stage2g1/settings';

interface StageProps {
  part?: number;
}

type Stage2g1Settings = Settings & {
  animation: Stage2g1Animation;
};

const Stage: Component<StageProps> = (props) => {
  let runId = 0;
  let nextStep: (() => void) | null = null;
  const [isAutoPlaying, setIsAutoPlaying] = createSignal(false);
  const [progressStep, setProgressStep] = createSignal(0);

  const handleAnimationStep = () => {
    setProgressStep((step) => step + 1);
  };

  const handleAnimationComplete = () => {
    setIsAutoPlaying(false);
  };

  const [settings, setSettings] = createSignal<Stage2g1Settings>({
    ...defaultSettings,
    animation: {
      delay: 1_000,
      isActive: (id) => id === runId,
      mode: 'step',
      onComplete: handleAnimationComplete,
      onStepStart: handleAnimationStep,
      runId,
      waitForNextStep: () =>
        new Promise<void>((resolve) => {
          nextStep = resolve;
        }),
    },
  });

  const resolveNextStep = () => {
    nextStep?.();
    nextStep = null;
  };

  const updateAnimation = (mode: Stage2g1Animation['mode']) => {
    resolveNextStep();
    runId += 1;
    setIsAutoPlaying(mode === 'auto');
    setProgressStep(0);

    setSettings((prevSettings) => ({
      ...prevSettings,
      animation: {
        delay: 1_000,
        isActive: (id) => id === runId,
        mode,
        onComplete: handleAnimationComplete,
        onStepStart: handleAnimationStep,
        runId,
        waitForNextStep: () =>
          new Promise<void>((resolve) => {
            nextStep = resolve;
          }),
      },
    }));
  };

  const playFullAnimation = () => {
    updateAnimation('auto');
  };

  const playNextStep = () => {
    if (settings().animation.mode === 'step' && nextStep) {
      resolveNextStep();
      return;
    }

    updateAnimation('step');
  };

  const renderPart = (part: number) => {
    switch (part) {
      case 0:
        return (
          <>
            <div class={stageStyles.demoGrid}>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2.5D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Canvas
                    settings={settings}
                    width={settings().camera.screen.width}
                    height={settings().camera.screen.height}
                    render={render25d}
                  />
                </div>
                <div class={stageStyles.buttonRow}>
                  <StepProgressButton
                    active={isAutoPlaying()}
                    duration={settings().animation.delay}
                    onClick={playFullAnimation}
                    step={progressStep()}
                  >
                    Запустить всю анимацию
                  </StepProgressButton>
                  <button
                    type="button"
                    class={stageStyles.primaryActionButton}
                    onClick={playNextStep}
                  >
                    Следующий шаг
                  </button>
                </div>
              </div>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  2D Renderer
                </h2>
                <div class={stageStyles.centered}>
                  <Map2d
                    width={400}
                    height={320}
                    settings={settings}
                    render={render2d}
                  />
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div class={content.contentSection}>
      {renderPart(props.part ?? 0)}
    </div>
  );
};

export default Stage;

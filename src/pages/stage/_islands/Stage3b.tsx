import content from '@app/styles/content.module.css';
import stageStyles from '@app/styles/stage.module.css';
import Canvas from "@app/components/Canvas/CanvasBase";
import { JsonViewer } from '@app/components/JsonViewer';
import wait from '@app/lib/wait';
import StepProgressButton from '@app/pages/stage/_components/StepProgressButton';
import render2dStage0 from '@app/stages/Stage0b/render2d';
import type { Component } from 'solid-js';
import { createMemo, createSignal, onCleanup } from 'solid-js';
import { simplifyBSP } from '@app/stages/Stage3b/bsp/debug';
import { useBspTree } from '@app/stages/Stage3b/hooks/useBspTree';
import {
  countBSPBranches,
  renderBSPAnimation,
} from '@app/stages/Stage3b/renderBSP';
import defaultSettings from '@app/stages/Stage3b/settings/sectors.column';

interface StageProps {
  part?: number;
}

const Stage: Component<StageProps> = (props) => {
  const [settings] = createSignal<Settings>(defaultSettings);
  const bspTree = useBspTree({ settings });
  const totalSteps = createMemo(() => countBSPBranches(bspTree()));
  const [currentStep, setCurrentStep] = createSignal(0);
  const [isAutoPlaying, setIsAutoPlaying] = createSignal(false);
  const [progressStep, setProgressStep] = createSignal(0);
  const animationDelay = 1_100;
  let runId = 0;

  const stopAnimation = () => {
    runId += 1;
    setIsAutoPlaying(false);
  };

  const playFullAnimation = async () => {
    stopAnimation();
    const currentRunId = runId;
    setCurrentStep(0);
    setProgressStep(0);
    setIsAutoPlaying(true);

    for (let step = 1; step <= totalSteps(); step += 1) {
      if (currentRunId !== runId) return;
      setCurrentStep(step);
      setProgressStep(step);
      await wait(animationDelay);
    }

    if (currentRunId === runId) {
      setIsAutoPlaying(false);
    }
  };

  const playNextStep = () => {
    stopAnimation();
    setCurrentStep((step) => step >= totalSteps() ? 1 : step + 1);
  };

  const resetAnimation = () => {
    stopAnimation();
    setCurrentStep(0);
    setProgressStep(0);
  };

  onCleanup(stopAnimation);

  const renderPart = (part: number) => {
    switch (part) {
      case 0:
        return (
          <>
            <div class={stageStyles.demoGridWithSpacing}>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  Исходный уровень
                </h2>
                <div class={stageStyles.centered}>
                  <Canvas
                    width={400}
                    height={400}
                    settings={settings}
                    render={render2dStage0}
                  />
                </div>
              </div>
              <div class={stageStyles.demoColumn}>
                <h2 class={stageStyles.demoTitle}>
                  Последовательное BSP-разбиение
                </h2>
                <div class={stageStyles.centered}>
                  <Canvas
                    width={400}
                    height={400}
                    settings={settings}
                    render={(ctx, currentSettings) =>
                      renderBSPAnimation(
                        ctx,
                        currentSettings,
                        bspTree(),
                        currentStep(),
                      )
                    }
                  />
                </div>
                <div class={stageStyles.statusMessage}>
                  Разделение {currentStep()} из {totalSteps()}
                </div>
                <div class={stageStyles.threeButtonGrid}>
                  <StepProgressButton
                    active={isAutoPlaying()}
                    duration={animationDelay}
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
                    Следующее разделение
                  </button>
                  <button
                    type="button"
                    class={stageStyles.secondaryActionButton}
                    onClick={resetAnimation}
                  >
                    Сбросить
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      case 1:
        return (
          <>
            <div class={stageStyles.singleColumn}>
              <JsonViewer data={simplifyBSP(bspTree())} />
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

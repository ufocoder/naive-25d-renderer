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
            <div class="my-10 flex flex-col justify-center gap-6 md:grid md:grid-cols-2 md:gap-4 md:items-start justify-items">
              <div class="flex flex-col gap-2">
                <h2 class="flex justify-center text-2xl">
                  Исходный уровень
                </h2>
                <div class="flex justify-center">
                  <Canvas
                    width={400}
                    height={400}
                    settings={settings}
                    render={render2dStage0}
                  />
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <h2 class="flex justify-center text-2xl">
                  Последовательное BSP-разбиение
                </h2>
                <div class="flex justify-center">
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
                <div class="flex min-h-5 justify-center text-sm text-gray-600">
                  Разделение {currentStep()} из {totalSteps()}
                </div>
                <div class="grid grid-cols-3 gap-2">
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
                    class="border border-[#9eb3da] bg-[#dce6fa] px-4 py-2 text-sm font-medium text-[#1f2a44] transition-colors hover:bg-[#c8d8f5]"
                    onClick={playNextStep}
                  >
                    Следующее разделение
                  </button>
                  <button
                    type="button"
                    class="border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
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
            <div class="flex flex-col">
              <JsonViewer data={simplifyBSP(bspTree())} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div class="flex flex-col gap-4">
      {renderPart(props.part ?? 0)}
    </div>
  );
};

export default Stage;

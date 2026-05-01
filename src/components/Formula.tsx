import { createEffect, onCleanup } from 'solid-js';
import katex from 'katex';
import 'katex/dist/katex.min.css'; // Не забудьте импортировать стили!

interface FormulaProps {
  latex: string;
  displayMode?: boolean;
  throwOnError?: boolean;
  class?: string;
}

export const Formula = (props: FormulaProps) => {
  let containerRef!: HTMLDivElement;

  const renderFormula = () => {
    if (!containerRef) return;

    try {
      katex.render(props.latex, containerRef, {
        displayMode: props.displayMode ?? true,
        throwOnError: props.throwOnError ?? false,
        output: 'html',
        fleqn: false,
        leqno: false,
      });
    } catch (error) {
      console.error('KaTeX render error:', error);
      containerRef.innerHTML = `<span style="color: red;">Ошибка: ${props.latex}</span>`;
    }
  };

  createEffect(() => {
    renderFormula();
  });

  onCleanup(() => {
    if (containerRef) {
      containerRef.innerHTML = '';
    }
  });

  return <div ref={containerRef} class={props.class} />;
};
import jsonStyles from '@app/styles/json.module.css';
import { codeToHtml } from 'shiki';
import { createResource, createEffect, onCleanup, Suspense } from 'solid-js';

interface CodeBlockProps {
  code: string;
  lang: string;
  theme?: string;
  class?: string;
}

const CodeHighlight = (props: CodeBlockProps) => {
  let container: HTMLDivElement | null = null;

  const [html] = createResource(async () => {
    return await codeToHtml(props.code, {
      lang: props.lang,
      theme: props.theme || 'github-light',
    });
  });

  onCleanup(() => {
    if (container) container.innerHTML = '';
  });

  createEffect(() => {
    if (html() && container) {
      container.innerHTML = html()!;
    }
  });

  return <div ref={ref => { container = ref; }} class={props.class} />;
};

export default function CodeBlock(props: CodeBlockProps) {
  return (
    <Suspense fallback={<div class={jsonStyles.jsonEmpty}>Loading code...</div>}>
      <CodeHighlight {...props} class={`code-block ${props.class ?? ''}`} />
    </Suspense>
  );
};

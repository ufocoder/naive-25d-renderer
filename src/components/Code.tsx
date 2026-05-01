import { codeToHtml } from 'shiki';
import { createResource, createEffect, onCleanup, Suspense } from 'solid-js';

interface CodeBlockProps {
  code: string;
  lang: string;
  theme?: string;
  class?: string;
}

const CodeHighlight = (props: CodeBlockProps) => {
  let ref!: HTMLDivElement;

  const [html] = createResource(async () => {
    return await codeToHtml(props.code, {
      lang: props.lang,
      theme: props.theme || 'github-dark',
    });
  });

  onCleanup(() => {
    if (ref) ref.innerHTML = '';
  });

  createEffect(() => {
    if (html() && ref) {
      ref.innerHTML = html()!;
    }
  });

  return <div ref={ref} class={props.class} />;
};

export default function CodeBlock(props: CodeBlockProps) {
  return (
    <Suspense fallback={<div class="text-gray-400 p-4">Loading code...</div>}>
      <CodeHighlight {...props} />
    </Suspense>
  );
};

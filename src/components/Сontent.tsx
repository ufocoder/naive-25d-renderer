import { type Component, type JSX } from 'solid-js';

interface ContentProps {
  class?: string;
  children: JSX.Element;
}

const Content: Component<ContentProps> = (props) => {
  return (
    <div class={`bg-gray-100 border border-gray-200 p-4 text ${props.class || ''}`}>
      {props.children}
    </div>
  );
};

export default Content;
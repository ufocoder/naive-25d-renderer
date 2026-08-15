import content from '@app/styles/content.module.css';
import { type Component, type JSX } from 'solid-js';

interface ContentProps {
  class?: string;
  children: JSX.Element;
}

const Content: Component<ContentProps> = (props) => {
  return (
    <div class={`${content.contentBox} ${props.class || ''}`}>
      {props.children}
    </div>
  );
};

export default Content;

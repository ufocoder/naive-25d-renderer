import type { Component } from 'solid-js';

const PlaceholderStage: Component<{ title: string }> = (props) => (
  <section class="flex flex-col gap-4">
    <h1 class="text-2xl font-semibold text-[#1f2a44]">{props.title}</h1>
    <p class="text-[#6b7a8f]">Заглушка — подключите stage-компонент.</p>
  </section>
);

export default PlaceholderStage;

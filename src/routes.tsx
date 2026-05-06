import { Route, } from '@solidjs/router';
import { lazy } from 'solid-js';

const pages = import.meta.glob('./stages/*/index.tsx');

function getRoutePath(filePath: string): string {
  const [_, __, stageName] = filePath.split('/');
  const route = stageName.toLowerCase().replace(/^stage([0-9]?[a-z]*)/i, (_, suffix) => {
    return `/stage-${suffix}`;
  });
  
  return route;
}

export const routes = Object.entries(pages).map(([path, importer]) => {
  const Component = lazy(importer as any);
  const routePath = getRoutePath(path);

  return <Route path={routePath} component={Component} />;
});
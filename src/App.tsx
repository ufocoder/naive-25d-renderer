import { A, Navigate, Route, Router, useLocation } from '@solidjs/router';
import type { Component, ParentComponent } from 'solid-js';
import Stage1a from './stages/Stage1a';
import Stage1b from './stages/Stage1b';
import Stage2 from './stages/Stage2';
import Stage3a from './stages/Stage3a';
import Stage3b from './stages/Stage3b';
import Stage4a from './stages/Stage4a';
import Stage4b from './stages/Stage4b';
// import Stage5 from './stages/Stage5';

export type MenuLink = {
  href: string;
  label: string;
};

export type MenuGroup = {
  title: string;
  links: MenuLink[];
};

export type MenuEntry = MenuGroup | MenuLink;

function isMenuGroup(entry: MenuEntry): entry is MenuGroup {
  return 'links' in entry;
}

export const menuGroups: MenuEntry[] = [
  {
    title: 'Stage 1: Одиночная стена',
    links: [
      { href: '/stage-1a', label: 'Проекция вершин' },
      { href: '/stage-1b', label: 'Проекция стены' },
    ],
  },
  {
    title: 'Stage 2: Ряд стен',
    links: [
      { href: '/stage-2', label: 'Проблема Fish eye ' },
    ]
  },
  {
    title: 'Stage 3: отсечение стены',
    links: [
      { href: '/stage-3a', label: 'Простой тест: ряд стен' },
      { href: '/stage-3b', label: 'Сложный тест: окружность' },
    ],
  },
  {
    title: 'Stage 4: алгоритм художника',
    links: [
      { href: '/stage-4a', label: 'Необходимость сортировки' },
      { href: '/stage-4b', label: 'Разделение стен' },
    ],
  },
];

function linkClass(active: boolean) {
  return `block rounded-lg border px-3 py-2 text-sm no-underline transition-colors ${
    active
      ? 'border-[#9eb3da] bg-[#dce6fa] text-[#1f2a44]'
      : 'border-transparent text-[#4a5a75] hover:border-[#c3d0ea] hover:bg-[#e3ebfa]'
  }`;
}

function isPathActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href;
}

const Layout: ParentComponent = (props) => {
  const location = useLocation();

  return (
    <div class="grid min-h-screen grid-cols-[300px_1fr] bg-[#f4f6fb] max-[860px]:grid-cols-1">
      <nav
        class="flex flex-col gap-3 overflow-x-auto border-r border-[#d8deea] bg-[#eef2fb] p-6 max-[860px]:flex-row max-[860px]:border-r-0 max-[860px]:border-b"
        aria-label="Stage navigation"
      >
        <p class="m-0 mb-2 min-w-max pr-2 text-xl font-bold text-[#1f2a44] max-[860px]:mb-0">
          Naive 2.5 Render
        </p>

        <div class="flex flex-col gap-5 max-[860px]:flex-row max-[860px]:flex-wrap max-[860px]:gap-4">
          {menuGroups.map((entry) =>
            isMenuGroup(entry) ? (
              <div class="flex min-w-0 flex-col gap-1.5 max-[860px]:min-w-[200px]">
                <p class="m-0 text-xs font-semibold uppercase tracking-wide select-none text-[#6b7a8f]">
                  {entry.title}
                </p>
                <ul class="m-0 list-none space-y-1 pl-0">
                  {entry.links.map((link) => (
                    <li>
                      <A
                        href={link.href}
                        class={linkClass(
                          isPathActive(location.pathname, link.href),
                        )}
                      >
                        {link.label}
                      </A>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <A
                href={entry.href}
                class={linkClass(isPathActive(location.pathname, entry.href))}
              >
                {entry.label}
              </A>
            ),
          )}
        </div>
      </nav>
      <main class="bg-[#f8faff] p-6">{props.children}</main>
    </div>
  );
};

const App: Component = () => (
  <Router root={Layout}>
    <Route path="/" component={() => <Navigate href="/stage-1-1" />} />
    <Route path="/stage-1a" component={Stage1a} />
    <Route path="/stage-1b" component={Stage1b} />
    <Route path="/stage-2" component={Stage2} />
    <Route path="/stage-3a" component={Stage3a} />
    <Route path="/stage-3b" component={Stage3b} />
    <Route path="/stage-4a" component={Stage4a} />
    <Route path="/stage-4b" component={Stage4b} />
  </Router>
);

export default App;

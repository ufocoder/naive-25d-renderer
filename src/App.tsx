import { A, Route, HashRouter, useLocation } from '@solidjs/router';
import type { Component, ParentComponent } from 'solid-js';
import { createSignal } from 'solid-js';
import Welcome from './stages/Welcome';
import Stage1a from './stages/Stage1a';
import Stage1b from './stages/Stage1b';
import Stage2 from './stages/Stage2';
import Stage3a from './stages/Stage3a';
import Stage3b from './stages/Stage3b';
import Stage3c from './stages/Stage3c';
import Stage4a from './stages/Stage4a';
import Stage4b from './stages/Stage4b';
import Stage5a from './stages/Stage5a';
import Stage5b from './stages/Stage5b';
import Stage5c from './stages/Stage5c';
import Stage5d from './stages/Stage5d';
import Stage5e from './stages/Stage5e';
import Stage5f from './stages/Stage5f';
import Stage5g from './stages/Stage5g';
import Stage5h from './stages/Stage5h';
import Stage5i from './stages/Stage5i';
import Stage6a from './stages/Stage6a';
import Stage6b from './stages/Stage6b';
import Stage6c from './stages/Stage6c';
import Stage6d from './stages/Stage6d';
import Stage6e from './stages/Stage6e';
import Stage6f from './stages/Stage6f';

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
      { href: '/stage-3a', label: 'Тест #1: ряд стен' },
      { href: '/stage-3b', label: 'Тест #2: корридор' },
      { href: '/stage-3c', label: 'Тест #3: окружность' },
    ],
  },
  {
    title: 'Stage 4: алгоритм художника',
    links: [
      { href: '/stage-4a', label: 'Сортировки стен' },
      { href: '/stage-4b', label: 'Разделение стен' },
    ],
  },
  {
    title: 'Stage 5: сектор',
    links: [
      { href: '/stage-5a', label: 'Уровень из секторов' },
      { href: '/stage-5b', label: 'Проблема: высота сектора' },
      { href: '/stage-5c', label: 'Нормализация высот секторов' },
      { href: '/stage-5d', label: 'Пол и потолок: сектор' },
      { href: '/stage-5e', label: 'Порталы 1D: соединяем сектора' },
      { href: '/stage-5f', label: 'Порталы 2D: прямоугольник' },
      { href: '/stage-5g', label: 'Высота камеры' },
      { href: '/stage-5h', label: 'Порталы 2D: трапеция' },
      { href: '/stage-5i', label: 'Порталы 2D: многоугольник' },
    ],
  },
  {
    title: 'Stage 6: bsp',
    links: [
      { href: '/stage-6a', label: 'Разбитие на подсектора' },
      { href: '/stage-6b', label: 'Один сектор с геометрией' },
      { href: '/stage-6c', label: 'Порталы 1D: соединяем сектора' },
      { href: '/stage-6d', label: 'Порталы 2D: соединяем сектора' },
      { href: '/stage-6e', label: 'Высота камеры' },
      { href: '/stage-6f', label: 'Разные высоты секторов' },
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
  if (href === '/') return pathname === '/' || pathname === '';
  return pathname === href;
}

function NavContent(props: { onLinkClick?: () => void }) {
  const location = useLocation();

  return (
    <>
      {menuGroups.map((entry) =>
        isMenuGroup(entry) ? (
          <div class="flex min-w-0 flex-col gap-1.5">
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
                    onClick={props.onLinkClick}
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
            onClick={props.onLinkClick}
          >
            {entry.label}
          </A>
        ),
      )}
    </>
  );
}

const Layout: ParentComponent = (props) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = createSignal(false);

  return (
    <>
      {/* Mobile header */}
      <div class="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 border-b border-[#d8deea] bg-[#eef2fb] px-4 py-3">
        <button
          aria-label="Открыть меню"
          class="rounded p-1.5 text-[#1f2a44] transition-colors hover:bg-[#d8deea]"
          onClick={() => setMenuOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
        </button>
        <span class="text-lg font-bold text-[#1f2a44]">Naive 2.5 Render</span>
      </div>

      <div class="grid min-h-screen grid-cols-[300px_1fr] bg-[#f4f6fb] max-[860px]:grid-cols-1">
        <nav
          class="hidden lg:flex h-screen max-h-screen flex-col gap-3 overflow-y-auto overflow-x-hidden border-r border-[#d8deea] bg-[#eef2fb] p-6"
          aria-label="Stage navigation"
        >
          <p class="m-0 mb-2 min-w-max pr-2 text-xl font-bold text-[#1f2a44]">
            Naive 2.5 Render
          </p>

          <div class="flex flex-col gap-5">
            {menuGroups.map((entry) =>
              isMenuGroup(entry) ? (
                <div class="flex min-w-0 flex-col gap-1.5">
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

        <main class="bg-[#f8faff] p-6 max-[860px]:pt-16 lg:pt-6">{props.children}</main>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen() && (
        <div class="fixed inset-0 z-40 lg:hidden">
          <div
            class="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside class="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[#eef2fb] shadow-xl overflow-auto">
            <div class="flex items-center justify-between border-b border-[#d8deea] px-4 py-3">
              <span class="text-lg font-bold text-[#1f2a44]">Навигация</span>
              <button
                aria-label="Закрыть меню"
                class="rounded p-1.5 text-[#1f2a44] transition-colors hover:bg-[#d8deea]"
                onClick={() => setMenuOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <div class="flex flex-col gap-5 p-4">
              <NavContent onLinkClick={() => setMenuOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

const App: Component = () => (
  <HashRouter root={Layout}>
    <Route path="/" component={() => <Welcome />} />
    <Route path="/stage-1a" component={Stage1a} />
    <Route path="/stage-1b" component={Stage1b} />
    <Route path="/stage-2" component={Stage2} />
    <Route path="/stage-3a" component={Stage3a} />
    <Route path="/stage-3b" component={Stage3b} />
    <Route path="/stage-3c" component={Stage3c} />
    <Route path="/stage-4a" component={Stage4a} />
    <Route path="/stage-4b" component={Stage4b} />
    <Route path="/stage-5a" component={Stage5a} />
    <Route path="/stage-5b" component={Stage5b} />
    <Route path="/stage-5c" component={Stage5c} />
    <Route path="/stage-5d" component={Stage5d} />
    <Route path="/stage-5e" component={Stage5e} />
    <Route path="/stage-5f" component={Stage5f} />
    <Route path="/stage-5g" component={Stage5g} />
    <Route path="/stage-5h" component={Stage5h} />
    <Route path="/stage-5i" component={Stage5i} />
    <Route path="/stage-6a" component={Stage6a} />
    <Route path="/stage-6b" component={Stage6b} />
    <Route path="/stage-6c" component={Stage6c} />
    <Route path="/stage-6d" component={Stage6d} />
    <Route path="/stage-6e" component={Stage6e} />
    <Route path="/stage-6f" component={Stage6f} />
    <Route path="*" component={() => 'Not found'} />
  </HashRouter>
);

export default App;

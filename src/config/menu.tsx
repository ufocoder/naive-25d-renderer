export type MenuLink = {
  href: string;
  label: string;
};

export type MenuGroup = {
  title: string;
  links: MenuLink[];
};

export type MenuEntry = MenuGroup | MenuLink;

export function isMenuGroup(entry: MenuEntry): entry is MenuGroup {
  return 'links' in entry;
}

export function linkClass(active: boolean) {
  return `block rounded-lg border px-3 py-2 text-sm no-underline transition-colors ${
    active
      ? 'border-[#9eb3da] bg-[#dce6fa] text-[#1f2a44]'
      : 'border-transparent text-[#4a5a75] hover:border-[#c3d0ea] hover:bg-[#e3ebfa]'
  }`;
}

export function isPathActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/' || pathname === '';
  return pathname === href;
}

export const menuGroups: MenuEntry[] = [
  { href: '/welcome', label: 'Приветствие' },
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
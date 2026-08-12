export type PageMetadata = {
  title: string;
  groupTitle?: string;
};

export type PageModule = {
  metadata?: PageMetadata;
};

export type MenuLink = {
  href: string;
  label: string;
};

export type MenuGroup = {
  title: string;
  links: MenuLink[];
};

export type MenuEntry = MenuGroup | MenuLink;

export type PageEntry = MenuLink & {
  groupTitle: string;
};

export type PageHeader = {
  title: string;
  label: string | null;
  isLink: boolean;
};

const pageModules = import.meta.glob<PageModule>(
  ['../pages/**/*.astro', '!../pages/**/_components/**/*.astro'],
  {
    eager: true,
  },
);

function pagePathToHref(path: string) {
  const pagePath = path
    .replace('../pages', '')
    .replace(/\.astro$/, '')
    .replace(/\/index$/, '/');

  if (!pagePath) {
    throw new Error(`Invalid page path: ${path}`);
  }

  return pagePath === '/' ? '/' : pagePath;
}

function pageSortRank(href: string) {
  if (href === '/about') return 0;
  if (href === '/preface') return 0.5;
  if (href.startsWith('/stage/')) return 1;
  if (href === '/demo') return 2;
  if (href === '/editor') return 10;
  return 3;
}

export function isMenuGroup(entry: MenuEntry): entry is MenuGroup {
  return 'links' in entry;
}

export function linkClass(active: boolean) {
  return `docs-nav-link ${active ? 'docs-nav-link-active' : ''}`;
}

export function normalizePathname(pathname: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  let path = pathname;

  if (base && base !== '/' && (path === base || path.startsWith(`${base}/`))) {
    path = path.slice(base.length) || '/';
  }

  return path.replace(/\/$/, '') || '/';
}

export function withBase(href: string) {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;

  if (href === '/') return base;
  return `${normalizedBase}${href}`;
}

export function isPathActive(pathname: string, href: string) {
  const normalizedPathname = normalizePathname(pathname);
  if (href === '/') return normalizedPathname === '/';
  return normalizedPathname === href;
}

export function getAllPages() {
  return Object.entries(pageModules)
    .filter((entry): entry is [string, PageModule & { metadata: PageMetadata }] =>
      Boolean(entry[1]?.metadata),
    )
    .map(([path, page]) => ({
      href: pagePathToHref(path),
      label: page.metadata.title,
      groupTitle: page.metadata.groupTitle ?? '',
    }))
    .sort((a, b) => {
      const rankDiff = pageSortRank(a.href) - pageSortRank(b.href);
      if (rankDiff !== 0) return rankDiff;

      return a.href.localeCompare(b.href, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
}

export function getMenuEntries() {
  const entries: MenuEntry[] = [];
  const groups = new Map<string, MenuGroup>();

  for (const page of getAllPages()) {
    const link = { href: page.href, label: page.label };

    if (!page.groupTitle) {
      entries.push(link);
      continue;
    }

    let group = groups.get(page.groupTitle);
    if (!group) {
      group = { title: page.groupTitle, links: [] };
      groups.set(page.groupTitle, group);
      entries.push(group);
    }

    group.links.push(link);
  }

  return entries;
}

export function getCurrentPageIndex(pathname: string) {
  const currentPath = normalizePathname(pathname);
  return getAllPages().findIndex((page) => page.href === currentPath);
}

export function getPrevNextLinks(pathname: string) {
  const pages = getAllPages();
  const currentIndex = getCurrentPageIndex(pathname);

  return {
    previous: currentIndex > 0 ? pages[currentIndex - 1] : null,
    next:
      currentIndex >= 0 && currentIndex < pages.length - 1
        ? pages[currentIndex + 1]
        : null,
  };
}

export function getPageHeader(pathname: string): PageHeader | null {
  const currentPath = normalizePathname(pathname);
  const page = getAllPages().find((item) => item.href === currentPath);

  if (!page) return null;

  if (page.groupTitle) {
    return {
      title: page.groupTitle,
      label: page.label,
      isLink: true,
    };
  }

  return {
    title: page.label,
    label: null,
    isLink: false,
  };
}

import { A, useLocation } from '@solidjs/router';
import type { Component } from 'solid-js';
import { createEffect, onCleanup } from 'solid-js';
import { menuGroups, isMenuGroup, linkClass, isPathActive } from '../config/menu';

export const DrawerContent: Component<{ onLinkClick?: () => void }> = (props) => {
  const location = useLocation();

  return (
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
    </div>
  );
};

export const Drawer: Component<{ isOpen: boolean; onClose: () => void }> = (props) => {
  let drawerRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (props.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    onCleanup(() => {
      document.body.style.overflow = '';
    });
  });

  createEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && props.isOpen) {
        props.onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  return (
    <div
      class={`fixed inset-0 z-50 transition-all duration-300 ${
        props.isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Затемнение */}
      <div
        class={`absolute inset-0 bg-black transition-opacity duration-300 ${
          props.isOpen ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={props.onClose}
      />
      
      {/* Drawer панель */}
      <aside
        ref={drawerRef}
        class={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] transform bg-[#eef2fb] shadow-2xl transition-transform duration-300 ease-out ${
          props.isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div class="flex items-center justify-between border-b border-[#d8deea] px-4 py-4">
          <span class="text-lg font-bold text-[#1f2a44]">Naive 2.5 Render</span>
          <button
            aria-label="Закрыть меню"
            class="rounded p-1.5 text-[#1f2a44] transition-colors hover:bg-[#d8deea]"
            onClick={props.onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <div class="flex flex-col gap-5 overflow-y-auto p-4" style="max-height: calc(100vh - 60px);">
          <DrawerContent onLinkClick={props.onClose} />
        </div>
      </aside>
    </div>
  );
};
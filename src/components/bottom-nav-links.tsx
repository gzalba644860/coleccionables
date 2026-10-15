"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UnreadBadge } from "./unread-badge";

const ICONS = {
  home: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  album: (
    <>
      <rect x="4" y="4" width="7" height="9" rx="1.5" />
      <rect x="13" y="4" width="7" height="9" rx="1.5" />
      <path d="M4 17h16M4 20h10" />
    </>
  ),
  match: (
    <>
      <path d="M7 7h11l-3-3M17 17H6l3 3" />
    </>
  ),
  chat: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 20 12Z" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
};

type Tab = { href: string; label: string; icon: keyof typeof ICONS; badge?: boolean };

const IN: Tab[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/buscar", label: "Buscar", icon: "search" },
  { href: "/mi-cuenta", label: "Mi colección", icon: "album" },
  { href: "/mi-cuenta/coincidencias", label: "Cambios", icon: "match" },
  { href: "/mensajes", label: "Mensajes", icon: "chat", badge: true },
];
const OUT: Tab[] = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/buscar", label: "Buscar", icon: "search" },
  { href: "/ingresar", label: "Ingresar", icon: "user" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/mi-cuenta") return pathname === "/mi-cuenta" || pathname === "/mi-cuenta/perfil";
  return pathname.startsWith(href);
}

export function BottomNavLinks({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  // Dentro de un chat, la caja de texto ocupa el borde inferior.
  if (/^\/mensajes\/\d+$/.test(pathname)) return null;
  const tabs = loggedIn ? IN : OUT;
  return (
    <>
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] sm:hidden" />
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        <ul className="mx-auto flex h-16 max-w-md items-stretch">
          {tabs.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <span className="relative">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={active ? 2.2 : 1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      {ICONS[t.icon]}
                    </svg>
                    {t.badge && <UnreadBadge initial={0} />}
                  </span>
                  {t.label}
                  {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

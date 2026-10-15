"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pestañas de sección con la actual resaltada. */
export function SubNav({ tabs }: { tabs: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <div className="inline-flex gap-1 rounded-xl border border-border bg-card p-1 text-sm shadow-soft">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-4 py-2 font-semibold transition ${
                active ? "bg-foreground text-background shadow-soft" : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

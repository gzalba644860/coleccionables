import Link from "next/link";

const TABS = [
  { href: "/mi-cuenta", label: "Mi colección" },
  { href: "/mi-cuenta/coincidencias", label: "Coincidencias" },
  { href: "/mi-cuenta/perfil", label: "Mis datos" },
] as const;

export default function AccountLayout({ children }: LayoutProps<"/mi-cuenta">) {
  return (
    <div className="grid gap-5">
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 font-medium"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

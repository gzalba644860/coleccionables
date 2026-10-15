import { SubNav } from "@/components/sub-nav";

const TABS = [
  { href: "/mi-cuenta", label: "Mi colección" },
  { href: "/mi-cuenta/coincidencias", label: "Coincidencias" },
  { href: "/mi-cuenta/perfil", label: "Mis datos" },
] as const;

export default function AccountLayout({ children }: LayoutProps<"/mi-cuenta">) {
  return (
    <div className="grid gap-5">
      <SubNav tabs={TABS} />
      {children}
    </div>
  );
}

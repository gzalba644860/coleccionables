import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { UserNav } from "@/components/user-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Coleccionables", template: "%s · Coleccionables" },
  description: "Comprá, vendé e intercambiá figuritas y cartas coleccionables.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e4572e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-accent">●</span> Coleccionables
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm">
              <Link href="/buscar" className="rounded-lg px-3 py-2 hover:bg-background">
                Buscar
              </Link>
              <Suspense fallback={<span className="w-20" />}>
                <UserNav />
              </Suspense>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          Las fotos del catálogo son ilustrativas. Las fotos reales se comparten entre
          usuarios por fuera del sitio.
        </footer>
      </body>
    </html>
  );
}

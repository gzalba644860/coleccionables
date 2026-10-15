import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#19191d" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-card/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
            <Link href="/" aria-label="Coleccionables, inicio" className="min-w-0 shrink-0">
              <Logo />
            </Link>
            <nav className="ml-auto flex shrink-0 items-center gap-0.5 text-sm font-medium sm:gap-1">
              <Link href="/buscar" className="rounded-lg px-3 py-2 text-muted hover:bg-subtle hover:text-foreground max-sm:hidden">
                Buscar
              </Link>
              <Suspense fallback={<span className="w-20" />}>
                <UserNav />
              </Suspense>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
        <footer className="border-t border-border bg-card/50">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm sm:flex sm:items-start sm:justify-between">
            <div className="grid max-w-sm gap-2">
              <Logo />
              <p className="text-muted">
                La comunidad para completar el álbum: marcá lo que tenés, encontrá lo que te falta y
                cambiá con gente cerca tuyo.
              </p>
            </div>
            <div className="grid gap-2 text-muted sm:text-right">
              <div className="flex gap-4 sm:justify-end">
                <Link href="/buscar" className="hover:text-foreground">Catálogo</Link>
                <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link>
              </div>
              <p className="max-w-xs text-xs">
                Las fotos del catálogo son ilustrativas. Las fotos reales se comparten entre usuarios
                por fuera del sitio.
              </p>
            </div>
          </div>
        </footer>
        <Suspense>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}

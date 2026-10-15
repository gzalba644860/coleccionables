/** Marca del sitio: dos figuritas superpuestas. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="3" y="6" width="16" height="21" rx="3.5" transform="rotate(-10 11 16.5)" className="fill-accent/35" />
      <rect x="11" y="4" width="17" height="23" rx="3.5" className="fill-accent" />
      <path d="m19.5 10.5 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" className="fill-accent-fg" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[17px] font-extrabold tracking-tight sm:text-lg">
        Coleccionables
      </span>
    </span>
  );
}

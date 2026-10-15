"use client";

import { useEffect, useRef } from "react";

/** Menú desplegable de la cuenta: se cierra al elegir una opción o al tocar afuera. */
export function AccountMenu({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) ref.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <details ref={ref} className="relative">
      <summary
        aria-label="Mi cuenta"
        className="ml-1 flex cursor-pointer list-none items-center rounded-full p-0.5 hover:bg-background [&::-webkit-details-marker]:hidden"
      >
        {trigger}
      </summary>
      <div
        className="card absolute right-0 top-full z-30 mt-2 grid w-52 gap-1 p-2 text-sm shadow-lg"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a,button")) ref.current!.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}

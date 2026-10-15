"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { pollCounts } from "@/app/actions/notifications";

const POLL_MS = 30_000;

type Counts = { mensajes: number; avisos: number };

/* Una sola consulta compartida por todos los globitos del menú. */
let counts: Counts | null = null;
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

/** Vuelve a consultar los contadores (p.ej. después de marcar avisos como leídos). */
export function refreshCounts() {
  if (document.visibilityState !== "visible") return;
  inflight ??= pollCounts()
    .then((c) => {
      counts = c;
      listeners.forEach((l) => l());
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Globito con la cantidad sin leer; se actualiza al navegar y cada 30 s. */
export function UnreadBadge({ kind, initial }: { kind: keyof Counts; initial: number }) {
  const live = useSyncExternalStore(
    subscribe,
    () => counts?.[kind],
    () => undefined,
  );
  const [first] = useState(initial);
  const pathname = usePathname();

  useEffect(() => {
    refreshCounts();
    const id = setInterval(refreshCounts, POLL_MS);
    const onFocus = () => refreshCounts();
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [pathname]);

  const count = live ?? first;
  if (!count) return null;
  return (
    <span className="absolute -right-2 -top-1.5 min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] font-bold leading-5 text-accent-fg ring-2 ring-card">
      {count > 99 ? "99+" : count}
    </span>
  );
}

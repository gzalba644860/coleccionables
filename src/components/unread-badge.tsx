"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { pollUnread } from "@/app/actions/messages";

const POLL_MS = 30_000;

/** Contador de mensajes sin leer; se actualiza al navegar y cada 30 s. */
export function UnreadBadge({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      pollUnread()
        .then((n) => alive && setCount(n))
        .catch(() => {});
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pathname]);

  if (!count) return null;
  return (
    <span className="absolute -right-2 -top-1.5 min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] font-bold leading-5 text-accent-fg ring-2 ring-card">
      {count > 99 ? "99+" : count}
    </span>
  );
}

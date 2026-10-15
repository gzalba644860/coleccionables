"use client";

import { useEffect } from "react";
import { markAvisosRead } from "@/app/actions/notifications";
import { refreshCounts } from "@/components/unread-badge";

/** Al abrir la página, los avisos quedan leídos y la campanita vuelve a cero. */
export function MarkRead({ pending }: { pending: boolean }) {
  useEffect(() => {
    if (!pending) return;
    markAvisosRead()
      .then(refreshCounts)
      .catch(() => {});
  }, [pending]);
  return null;
}

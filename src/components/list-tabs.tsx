"use client";

import { useState } from "react";

type Tab = "tengo" | "busco";

/** Pestañas Ofrezco / Busco: cambian al instante y recuerdan la elegida en la URL. */
export function ListTabs({
  initial,
  haveCount,
  wantCount,
  have,
  want,
}: {
  initial: Tab;
  haveCount: number;
  wantCount: number;
  have: React.ReactNode;
  want: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>(initial);
  const select = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    url.searchParams.set("lista", t);
    window.history.replaceState(null, "", url);
  };
  const base = "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition";
  return (
    <div className="grid gap-4">
      <div role="tablist" className="sticky top-14 z-10 -mx-1 flex gap-1 rounded-xl border border-border bg-card p-1">
        <button
          role="tab"
          aria-selected={tab === "tengo"}
          onClick={() => select("tengo")}
          className={`${base} ${tab === "tengo" ? "bg-have text-white" : "text-have"}`}
        >
          Ofrezco ({haveCount})
        </button>
        <button
          role="tab"
          aria-selected={tab === "busco"}
          onClick={() => select("busco")}
          className={`${base} ${tab === "busco" ? "bg-want text-white" : "text-want"}`}
        >
          Busco ({wantCount})
        </button>
      </div>
      <div hidden={tab !== "tengo"}>{have}</div>
      <div hidden={tab !== "busco"}>{want}</div>
    </div>
  );
}

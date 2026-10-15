"use client";

import { useEffect, useState } from "react";
import {
  getPushKey,
  removePushSubscription,
  savePushSubscription,
} from "@/app/actions/notifications";

type State = "checking" | "unsupported" | "ios" | "denied" | "off" | "on" | "busy";

const DISMISS_KEY = "avisos-banner-cerrado";

function base64ToBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return reg ? reg.pushManager.getSubscription() : null;
}

function detect(): Promise<State> {
  if (typeof window === "undefined") return Promise.resolve("checking");
  const supported =
    "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return Promise.resolve(ios ? "ios" : "unsupported");
  }
  if (Notification.permission === "denied") return Promise.resolve("denied");
  return currentSubscription()
    .then(async (sub) => {
      if (!sub || Notification.permission !== "granted") return "off" as const;
      // Por si en este dispositivo entró otra cuenta: la suscripción pasa a esta.
      await savePushSubscription(sub.toJSON()).catch(() => {});
      return "on" as const;
    })
    .catch(() => "off" as const);
}

/**
 * Activa/desactiva las notificaciones del navegador en este dispositivo.
 * variant="banner": aviso chico que solo aparece si todavía no se decidió.
 */
export function PushToggle({ variant = "card" }: { variant?: "card" | "banner" }) {
  const [state, setState] = useState<State>("checking");
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let alive = true;
    detect().then((s) => {
      if (!alive) return;
      let closed = false;
      try {
        closed = localStorage.getItem(DISMISS_KEY) === "1";
      } catch {}
      setDismissed(closed);
      setState(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setError("");
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const key = await getPushKey();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToBytes(key),
        }));
      await savePushSubscription(sub.toJSON());
      setState("on");
    } catch {
      setError("No se pudo activar. Probá de nuevo en un rato.");
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const sub = await currentSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
    } finally {
      setState("off");
    }
  }

  if (variant === "banner") {
    if (state !== "off" || dismissed) return null;
    return (
      <div className="card flex flex-wrap items-center gap-3 border-accent/40 bg-accent/5 p-3 sm:flex-nowrap">
        <BellIcon className="size-9 shrink-0 rounded-full bg-accent/15 p-2 text-accent" />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">Enterate al toque.</span>{" "}
          <span className="text-muted">
            Te avisamos cuando alguien te escribe o tiene una figurita que buscás.
          </span>
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <button onClick={enable} className="btn-primary flex-1 !py-2 sm:flex-none">
            Activar avisos
          </button>
          <button
            onClick={() => {
              setDismissed(true);
              try {
                localStorage.setItem(DISMISS_KEY, "1");
              } catch {}
            }}
            className="btn-ghost !py-2"
          >
            Ahora no
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="card grid gap-3 p-4">
      <div className="flex items-start gap-3">
        <BellIcon
          className={`size-10 shrink-0 rounded-full p-2 ${
            state === "on" ? "bg-have/15 text-have" : "bg-accent/15 text-accent"
          }`}
        />
        <div className="grid min-w-0 flex-1 gap-1">
          <h2 className="font-semibold">Notificaciones en este dispositivo</h2>
          <p className="text-sm text-muted">{describe(state)}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
      {(state === "off" || state === "on" || state === "busy") && (
        <div className="flex justify-end">
          {state === "on" ? (
            <button onClick={disable} className="btn-ghost">
              Desactivar en este dispositivo
            </button>
          ) : (
            <button onClick={enable} disabled={state === "busy"} className="btn-primary">
              {state === "busy" ? "Activando…" : "Activar notificaciones"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function describe(state: State) {
  switch (state) {
    case "on":
      return "Activadas. Te llega un aviso aunque tengas el sitio cerrado cuando alguien te escribe, tiene algo que buscás o busca algo que tenés.";
    case "denied":
      return "Las notificaciones están bloqueadas en este navegador. Para activarlas, tocá el candado al lado de la dirección del sitio y permití Notificaciones.";
    case "ios":
      return "En iPhone y iPad el navegador no permite avisos de sitios web. Igual vas a ver todo acá, en la campanita.";
    case "unsupported":
      return "Este navegador no permite avisos. Igual vas a ver todo acá, en la campanita.";
    case "checking":
      return "Revisando…";
    default:
      return "Recibí un aviso en el celular o la compu cuando alguien te escribe, tiene algo que buscás o busca algo que tenés, aunque no estés en el sitio.";
  }
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinejoin="round" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  );
}

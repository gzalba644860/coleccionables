/* Service worker de Coleccionables: solo muestra los avisos del navegador. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const url = data.url || "/";
  event.waitUntil(
    (async () => {
      // Si ya tenés esa pantalla abierta y a la vista, no hace falta avisar.
      const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const watching = open.some(
        (c) => c.visibilityState === "visible" && new URL(c.url).pathname === url,
      );
      if (watching) return;
      await self.registration.showNotification(data.title || "Coleccionables", {
        body: data.body || "",
        tag: data.tag,
        renotify: Boolean(data.tag),
        icon: "/icono-avisos.png",
        badge: "/icono-avisos-badge.png",
        data: { url },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of open) {
        if (new URL(c.url).origin === self.location.origin && "focus" in c) {
          await c.focus();
          if ("navigate" in c) await c.navigate(url).catch(() => {});
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});

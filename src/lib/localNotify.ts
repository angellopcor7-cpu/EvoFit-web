// Notificación local del navegador (sin push/servidor) — se usa para avisos
// instantáneos mientras la app está abierta o en segundo plano, como el fin
// del descanso durante un entrenamiento. Distinta del sistema de Web Push
// (src/lib/notifications.ts), que sí requiere ida y vuelta al servidor.
export function notifyLocal(title: string, body?: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
    });
  } catch {
    // Algunos navegadores (sobre todo móviles) no permiten `new Notification`
    // directo y exigen usar el service worker — si falla, simplemente no
    // mostramos nada en vez de romper la sesión de entrenamiento.
  }
}

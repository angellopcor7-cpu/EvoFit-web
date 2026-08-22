// Notificación local del navegador (sin push/servidor) — se usa para avisos
// instantáneos mientras la app está abierta, como el fin del descanso
// durante un entrenamiento. Distinta del sistema de Web Push
// (src/lib/notifications.ts), que sí requiere ida y vuelta al servidor.
export async function notifyLocal(title: string, body?: string): Promise<void> {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const options: NotificationOptions = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  };

  // EvoFit registra un service worker (para el push), y en la mayoría de
  // navegadores móviles (sobre todo Android/Chrome) eso hace que
  // `new Notification(...)` lance "Illegal constructor" — piden usar
  // `ServiceWorkerRegistration.showNotification()` en su lugar. Por eso
  // esta es la vía preferida; el constructor directo queda solo como
  // respaldo para navegadores sin service worker activo (la mayoría de
  // desktop).
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    } catch {
      // Si falla, se intenta el constructor directo abajo.
    }
  }

  try {
    new Notification(title, options);
  } catch {
    // Último recurso: si tampoco funciona el constructor directo, no hay
    // forma de avisar — no rompemos la sesión de entrenamiento por esto.
  }
}

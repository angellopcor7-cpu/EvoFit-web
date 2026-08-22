"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function postSubscription(path: string, subscription: PushSubscription) {
  const json = subscription.toJSON();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "No se pudo actualizar el push");
  }
}

// Maneja permiso del navegador + suscripción push. No usa react-query
// porque el estado real vive en el navegador (Notification.permission /
// PushManager), no en el servidor — se refleja en un estado local simple.
export const usePushNotifications = () => {
  // Soporte del navegador y permiso actual no cambian solos — se calculan
  // una vez al montar (lazy init), en vez de vía setState dentro de un
  // efecto.
  const [supported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    isPushSupported() ? Notification.permission : "default",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!isPushSupported()) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const existing = await registration?.pushManager.getSubscription();
      setSubscribed(!!existing);
    } catch {
      setSubscribed(false);
    }
  }, []);

  useEffect(() => {
    // checkStatus solo actualiza subscribed después de dos await (llamadas
    // async al service worker) — no dispara un setState síncrono real, pero
    // la regla no puede verlo a través del await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkStatus();
  }, [checkStatus]);

  const enable = useCallback(async () => {
    if (!isPushSupported() || !VAPID_PUBLIC_KEY) {
      setError("Tu navegador no soporta notificaciones push");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        throw new Error("No diste permiso para las notificaciones");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY,
        ) as BufferSource,
      });

      await postSubscription("/api/push/subscribe", subscription);
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar el push");
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const existing = await registration?.pushManager.getSubscription();
      if (existing) {
        await postSubscription("/api/push/unsubscribe", existing);
        await existing.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar el push");
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, permission, subscribed, loading, error, enable, disable };
};

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  type AppNotification,
  type NotificationRow,
  mapNotificationRow,
} from "@/lib/notifications";

const QUERY_KEY = ["notifications", "list"];
const LIMIT = 30;

export const useNotifications = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<{ notifications: AppNotification[] }> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      if (error) throw new Error(error.message);
      return {
        notifications: ((data ?? []) as NotificationRow[]).map(
          mapNotificationRow,
        ),
      };
    },
    // Refresca sola mientras la app está abierta, para que la campana se
    // entere de recordatorios nuevos (del cron) sin recargar la página.
    refetchInterval: 60_000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_notifications")
        .update({ read: true })
        .eq("id", notificationId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useSendTestNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ pushSent: number; hasSubscription: boolean }> => {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo mandar la prueba");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase
        .from("user_notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

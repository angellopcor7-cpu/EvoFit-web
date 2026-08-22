"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Dumbbell, UtensilsCrossed, Flame, HeartCrack, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/hooks/useNotifications";
import { formatNotificationTime, type NotificationType } from "@/lib/notifications";
import styles from "./NotificationBell.module.css";

const ICONS: Record<NotificationType, React.ComponentType<{ size?: number }>> = {
  workout_reminder: Dumbbell,
  diet_reminder: UtensilsCrossed,
  streak_risk: Flame,
  streak_lost: HeartCrack,
  achievement: Trophy,
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (id: string, read: boolean, link: string | null) => {
    if (!read) markRead.mutate(id);
    if (link) {
      setOpen(false);
      router.push(link);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setOpen(true)}
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>Notificaciones</DialogTitle>
            <DialogDescription>
              {notifications.length === 0
                ? "Todavía no tienes notificaciones."
                : "Recordatorios y avisos de EvoFit."}
            </DialogDescription>
          </DialogHeader>

          {notifications.length > 0 && (
            <div className={styles.list}>
              {notifications.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`${styles.item} ${n.read ? "" : styles.itemUnread}`}
                    onClick={() => handleClick(n.id, n.read, n.link)}
                  >
                    <span className={styles.itemIcon}>
                      <Icon size={16} />
                    </span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemTitle}>{n.title}</span>
                      <span className={styles.itemText}>{n.body}</span>
                      <span className={styles.itemTime}>
                        {formatNotificationTime(n.createdAt)}
                      </span>
                    </span>
                    {!n.read && <span className={styles.dot} />}
                  </button>
                );
              })}
            </div>
          )}

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={styles.markAllButton}
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Marcar todas como leídas
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

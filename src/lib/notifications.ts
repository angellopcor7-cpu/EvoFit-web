export const NOTIFICATION_TYPES = [
  "workout_reminder",
  "diet_reminder",
  "streak_risk",
  "achievement",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function formatNotificationTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "ayer";
  return `hace ${diffDays} días`;
}

export function mapNotificationRow(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.read,
    createdAt: row.created_at,
  };
}

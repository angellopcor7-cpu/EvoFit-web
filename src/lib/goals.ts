export type GoalType = "peso" | "distancia" | "repeticiones" | "personalizada";

export type Goal = {
  id: string;
  title: string;
  goalType: GoalType;
  unit: string;
  targetValue: number;
  currentValue: number;
  targetDate: string | null;
  createdAt: string;
};

export type GoalRow = {
  id: string;
  title: string;
  goal_type: GoalType;
  unit: string;
  target_value: number;
  current_value: number;
  target_date: string | null;
  created_at: string;
};

export function mapGoalRow(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    goalType: row.goal_type,
    unit: row.unit,
    targetValue: row.target_value,
    currentValue: row.current_value,
    targetDate: row.target_date,
    createdAt: row.created_at,
  };
}

export const GOAL_TYPE_META: Record<
  GoalType,
  { label: string; unit: string; placeholder: string }
> = {
  peso: { label: "Peso", unit: "kg", placeholder: "Ej. 80" },
  distancia: { label: "Distancia", unit: "km", placeholder: "Ej. 5" },
  repeticiones: { label: "Repeticiones", unit: "reps", placeholder: "Ej. 20" },
  personalizada: { label: "Personalizada", unit: "", placeholder: "Ej. 10" },
};

export function goalProgress(goal: Goal): number {
  if (goal.targetValue <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)));
}

// Opciones rápidas de tiempo límite para cuando se crea una meta desde el
// onboarding — la persona elige "en cuánto tiempo" en vez de tener que
// pensar una fecha exacta de calendario.
export const GOAL_DEADLINE_PRESETS: { label: string; days: number }[] = [
  { label: "1 semana", days: 7 },
  { label: "2 semanas", days: 14 },
  { label: "1 mes", days: 30 },
  { label: "3 meses", days: 90 },
  { label: "6 meses", days: 180 },
];

export function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function goalDeadlineLabel(targetDate: string | null): string | null {
  if (!targetDate) return null;
  const target = new Date(`${targetDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Vencida";
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays <= 7) return `Faltan ${diffDays} días`;
  const weeks = Math.round(diffDays / 7);
  if (diffDays <= 30) return `Faltan ${weeks} semana${weeks === 1 ? "" : "s"}`;
  const months = Math.round(diffDays / 30);
  return `Faltan ${months} mes${months === 1 ? "" : "es"}`;
}

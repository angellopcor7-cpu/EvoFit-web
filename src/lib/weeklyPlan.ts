export const DAY_OF_WEEK_LABEL: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export const DAY_OF_WEEK_SHORT: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

// Orden de despliegue tipo semana (lunes primero) — day_of_week en la base
// sigue la convención de JS Date.getDay() (0 = domingo).
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export type WeeklyPlanEntry = {
  id: string;
  dayOfWeek: number;
  workoutRoutineId: string | null;
  userRoutineId: string | null;
  plannedTime: string | null;
};

export type WeeklyPlanRow = {
  id: string;
  day_of_week: number;
  workout_routine_id: string | null;
  user_routine_id: string | null;
  planned_time: string | null;
};

export function mapWeeklyPlanRow(row: WeeklyPlanRow): WeeklyPlanEntry {
  return {
    id: row.id,
    dayOfWeek: row.day_of_week,
    workoutRoutineId: row.workout_routine_id,
    userRoutineId: row.user_routine_id,
    plannedTime: row.planned_time,
  };
}

// "14:30:00" (como lo guarda Postgres) -> "14:30" para mostrar/editar.
export function formatPlannedTime(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 5);
}

// "14:30" (de un <input type="time">) -> "14:30:00" para guardar.
export function toPlannedTimeValue(value: string): string | null {
  if (!value) return null;
  return `${value}:00`;
}

import {
  isSessionCategory,
  toEntrenamientosUiCategory,
  WORKOUT_CATEGORY_LABEL,
  type WorkoutRoutine,
} from "@/lib/workouts";
import { MUSCLE_GROUP_LABEL } from "@/lib/exercises";
import type { UserRoutine } from "@/lib/userRoutines";

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

export type DayRoutinePlan = {
  title: string;
  focusLabel: string;
  plannedTime: string | null;
  href: string;
};

// Resuelve una entrada del plan semanal (predeterminada o propia) al título +
// grupo muscular/categoría que se muestra tanto en la tarjeta "Hoy toca"
// como en el resumen de toda la semana en Inicio.
export function computeDayRoutinePlan(
  entry: WeeklyPlanEntry | undefined,
  allRoutines: WorkoutRoutine[],
  myRoutines: UserRoutine[],
): DayRoutinePlan | null {
  if (!entry) return null;

  if (entry.userRoutineId) {
    const routine = myRoutines.find((r) => r.id === entry.userRoutineId);
    if (!routine) return null;
    const groups = Array.from(new Set(routine.exercises.map((e) => e.muscleGroup)));
    return {
      title: routine.title,
      focusLabel:
        groups.map((g) => MUSCLE_GROUP_LABEL[g]).join(", ") || "Tu rutina",
      plannedTime: formatPlannedTime(entry.plannedTime) || null,
      href: `/entrenamientos?routine=${routine.id}&type=propia`,
    };
  }

  const routine = allRoutines.find((r) => r.id === entry.workoutRoutineId);
  if (!routine) return null;
  const focusLabel = isSessionCategory(routine.category)
    ? WORKOUT_CATEGORY_LABEL[routine.category]
    : Array.from(new Set(routine.exercises.map((e) => e.muscleGroup)))
        .map((g) => MUSCLE_GROUP_LABEL[g])
        .join(", ");

  return {
    title: routine.title,
    focusLabel,
    plannedTime: formatPlannedTime(entry.plannedTime) || null,
    href: `/entrenamientos?category=${toEntrenamientosUiCategory(routine.category)}&routine=${routine.id}&type=predef`,
  };
}

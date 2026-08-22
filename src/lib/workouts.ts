import type { MuscleGroup } from "@/lib/exercises";

export const BODY_TYPES = ["ectomorfo", "mesomorfo", "endomorfo"] as const;

export type BodyType = (typeof BODY_TYPES)[number];

export const BODY_TYPE_LABEL: Record<BodyType, string> = {
  ectomorfo: "Ectomorfo",
  mesomorfo: "Mesomorfo",
  endomorfo: "Endomorfo",
};

export const WORKOUT_CATEGORIES = [
  "musculacion",
  "calistenia",
  "cardio_hiit",
  "zumba",
  "crossfit",
  "yoga_pilates",
  "boxeo_kickboxing",
  "equipo_especial",
  "hibrido",
] as const;

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

export const WORKOUT_CATEGORY_LABEL: Record<WorkoutCategory, string> = {
  musculacion: "Musculación",
  calistenia: "Calistenia",
  cardio_hiit: "Cardio",
  zumba: "Zumba",
  crossfit: "CrossFit",
  yoga_pilates: "Yoga / Pilates",
  boxeo_kickboxing: "Boxeo / Kickbox",
  equipo_especial: "Equipo especial",
  hibrido: "Híbridos",
};

// Categorías de "sesión completa" (no se eligen ejercicio por ejercicio,
// así que su muscle_group real no dice mucho — mostramos la categoría en
// vez del grupo muscular, por ejemplo en la tarjeta "Hoy toca" de Inicio).
export const SESSION_CATEGORIES: WorkoutCategory[] = [
  "zumba",
  "crossfit",
  "yoga_pilates",
  "boxeo_kickboxing",
  "equipo_especial",
  "hibrido",
];

export function isSessionCategory(category: WorkoutCategory): boolean {
  return (SESSION_CATEGORIES as string[]).includes(category);
}

// "cardio_hiit" es el único caso donde el valor de la categoría en la base
// de datos no coincide con la clave usada en la UI de Entrenamientos.
export function toEntrenamientosUiCategory(category: WorkoutCategory): string {
  return category === "cardio_hiit" ? "cardio" : category;
}

export const LEVEL_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  todos: "Todos los niveles",
};

export type WorkoutExercise = {
  id: string;
  orderIndex: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: number;
  repsLabel: string | null;
  durationLabel: string | null;
  restLabel: string;
};

export type WorkoutRoutine = {
  id: string;
  level: "principiante" | "intermedio" | "avanzado" | "todos";
  splitType: "fullbody" | "ab" | "abc" | "grupo_muscular" | "sesion";
  category: WorkoutCategory;
  optionNumber: number;
  dayLabel: string | null;
  title: string;
  bodyType: BodyType | null;
  exercises: WorkoutExercise[];
};

export type RoutineRow = {
  id: string;
  level: string;
  split_type: string;
  category: string;
  option_number: number;
  day_label: string | null;
  title: string;
  order_index: number;
  body_type: string | null;
  routine_exercises: {
    id: string;
    order_index: number;
    exercise_name: string;
    muscle_group: string;
    sets: number;
    reps_label: string | null;
    duration_label: string | null;
    rest_label: string;
  }[];
};

export function mapRoutineRow(row: RoutineRow): WorkoutRoutine {
  return {
    id: row.id,
    level: row.level as WorkoutRoutine["level"],
    splitType: row.split_type as WorkoutRoutine["splitType"],
    category: row.category as WorkoutCategory,
    optionNumber: row.option_number,
    dayLabel: row.day_label,
    title: row.title,
    bodyType: (row.body_type as BodyType | null) ?? null,
    exercises: [...row.routine_exercises]
      .sort((a, b) => a.order_index - b.order_index)
      .map((e) => ({
        id: e.id,
        orderIndex: e.order_index,
        exerciseName: e.exercise_name,
        muscleGroup: e.muscle_group as MuscleGroup,
        sets: e.sets,
        repsLabel: e.reps_label,
        durationLabel: e.duration_label,
        restLabel: e.rest_label,
      })),
  };
}

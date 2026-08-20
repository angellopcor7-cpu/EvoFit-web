export const WORKOUT_CATEGORIES = [
  "musculacion",
  "calistenia",
  "cardio_hiit",
  "zumba",
  "crossfit",
  "yoga_pilates",
  "boxeo_kickboxing",
  "equipo_especial",
] as const;

export type WorkoutCategory = (typeof WORKOUT_CATEGORIES)[number];

export type WorkoutExercise = {
  id: string;
  orderIndex: number;
  exerciseName: string;
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
  routine_exercises: {
    id: string;
    order_index: number;
    exercise_name: string;
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
    exercises: [...row.routine_exercises]
      .sort((a, b) => a.order_index - b.order_index)
      .map((e) => ({
        id: e.id,
        orderIndex: e.order_index,
        exerciseName: e.exercise_name,
        sets: e.sets,
        repsLabel: e.reps_label,
        durationLabel: e.duration_label,
        restLabel: e.rest_label,
      })),
  };
}

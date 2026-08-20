import type { MuscleGroup } from "./exercises";

export type UserRoutineExercise = {
  id: string;
  orderIndex: number;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: number;
  repsLabel: string | null;
  durationLabel: string | null;
  restLabel: string;
};

export type UserRoutine = {
  id: string;
  title: string;
  createdAt: string;
  exercises: UserRoutineExercise[];
};

export type NewRoutineExerciseInput = {
  exerciseId: string | null;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: number;
  repsLabel: string | null;
  durationLabel: string | null;
  restLabel: string;
};

export type UserRoutineRow = {
  id: string;
  title: string;
  created_at: string;
  user_routine_exercises: {
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

export function mapUserRoutineRow(row: UserRoutineRow): UserRoutine {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    exercises: [...row.user_routine_exercises]
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

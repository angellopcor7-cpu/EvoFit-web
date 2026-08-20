import type { WorkoutCategory } from "@/lib/workouts";

export type WorkoutCompletion = {
  id: string;
  category: WorkoutCategory;
  routineTitle: string;
  workoutRoutineId: string | null;
  userRoutineId: string | null;
  completedAt: string;
};

export type WorkoutCompletionRow = {
  id: string;
  category: string;
  routine_title: string;
  workout_routine_id: string | null;
  user_routine_id: string | null;
  completed_at: string;
};

export function mapWorkoutCompletionRow(
  row: WorkoutCompletionRow,
): WorkoutCompletion {
  return {
    id: row.id,
    category: row.category as WorkoutCategory,
    routineTitle: row.routine_title,
    workoutRoutineId: row.workout_routine_id,
    userRoutineId: row.user_routine_id,
    completedAt: row.completed_at,
  };
}

export type NewWorkoutCompletionInput = {
  category: WorkoutCategory;
  routineTitle: string;
  workoutRoutineId?: string | null;
  userRoutineId?: string | null;
};

export type CompleteWorkoutResult = {
  currentStreak: number;
  longestStreak: number;
  alreadyLoggedToday: boolean;
};

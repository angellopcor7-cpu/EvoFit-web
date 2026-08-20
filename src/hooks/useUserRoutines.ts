"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  type UserRoutine,
  type UserRoutineRow,
  type NewRoutineExerciseInput,
  mapUserRoutineRow,
} from "@/lib/userRoutines";

const QUERY_KEY = ["userRoutines", "list"];

export const useUserRoutines = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<{ routines: UserRoutine[] }> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_routines")
        .select("*,user_routine_exercises(*)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return {
        routines: ((data ?? []) as UserRoutineRow[]).map(mapUserRoutineRow),
      };
    },
  });
};

export const useCreateUserRoutine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      exercises: NewRoutineExerciseInput[];
    }): Promise<UserRoutine> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { data: routineRow, error: routineError } = await supabase
        .from("user_routines")
        .insert({ user_id: user.id, title: input.title })
        .select()
        .single();
      if (routineError || !routineRow) {
        throw new Error(routineError?.message ?? "No se pudo crear la rutina");
      }

      if (input.exercises.length > 0) {
        const { error: exercisesError } = await supabase
          .from("user_routine_exercises")
          .insert(
            input.exercises.map((exercise, index) => ({
              user_routine_id: routineRow.id,
              exercise_id: exercise.exerciseId,
              order_index: index,
              exercise_name: exercise.exerciseName,
              muscle_group: exercise.muscleGroup,
              sets: exercise.sets,
              reps_label: exercise.repsLabel,
              duration_label: exercise.durationLabel,
              rest_label: exercise.restLabel,
            })),
          );
        if (exercisesError) {
          throw new Error(
            "No se pudieron guardar los ejercicios de la rutina",
          );
        }
      }

      return {
        id: routineRow.id,
        title: routineRow.title,
        createdAt: routineRow.created_at,
        exercises: input.exercises.map((exercise, index) => ({
          id: `${routineRow.id}-${index}`,
          orderIndex: index,
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup,
          sets: exercise.sets,
          repsLabel: exercise.repsLabel,
          durationLabel: exercise.durationLabel,
          restLabel: exercise.restLabel,
        })),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { type WorkoutRoutine, type RoutineRow, mapRoutineRow } from "@/lib/workouts";

export const useWorkoutRoutines = () => {
  return useQuery({
    queryKey: ["workouts", "routines"],
    queryFn: async (): Promise<{ routines: WorkoutRoutine[] }> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("workout_routines")
        .select("*,routine_exercises(*)")
        .order("order_index", { ascending: true });
      if (error) throw new Error(error.message);
      return { routines: ((data ?? []) as RoutineRow[]).map(mapRoutineRow) };
    },
  });
};

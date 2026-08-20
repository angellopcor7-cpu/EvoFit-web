"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { type Exercise, type ExerciseRow, mapExerciseRow } from "@/lib/exercises";

export const useExercises = () => {
  return useQuery({
    queryKey: ["exercises", "list"],
    queryFn: async (): Promise<{ exercises: Exercise[] }> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("muscle_group", { ascending: true })
        .order("order_index", { ascending: true });
      if (error) throw new Error(error.message);
      return { exercises: ((data ?? []) as ExerciseRow[]).map(mapExerciseRow) };
    },
    staleTime: 5 * 60 * 1000,
  });
};

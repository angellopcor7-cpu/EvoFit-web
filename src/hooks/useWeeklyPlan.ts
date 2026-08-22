"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  type WeeklyPlanEntry,
  type WeeklyPlanRow,
  mapWeeklyPlanRow,
} from "@/lib/weeklyPlan";

const QUERY_KEY = ["weeklyPlan", "list"];

export const useWeeklyPlan = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<{ entries: WeeklyPlanEntry[] }> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_weekly_plan")
        .select("*")
        .order("day_of_week", { ascending: true });
      if (error) throw new Error(error.message);
      return {
        entries: ((data ?? []) as WeeklyPlanRow[]).map(mapWeeklyPlanRow),
      };
    },
  });
};

export const useSaveWeeklyPlanEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dayOfWeek: number;
      workoutRoutineId: string | null;
      userRoutineId: string | null;
      plannedTime: string | null;
    }): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("user_weekly_plan").upsert(
        {
          user_id: user.id,
          day_of_week: input.dayOfWeek,
          workout_routine_id: input.workoutRoutineId,
          user_routine_id: input.userRoutineId,
          planned_time: input.plannedTime,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,day_of_week" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useDeleteWeeklyPlanEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dayOfWeek: number): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_weekly_plan")
        .delete()
        .eq("day_of_week", dayOfWeek);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

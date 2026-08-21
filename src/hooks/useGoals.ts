"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { type Goal, type GoalRow, type GoalType, mapGoalRow } from "@/lib/goals";

const QUERY_KEY = ["goals", "list"];

export const useGoals = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<{ goals: Goal[] }> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return { goals: ((data ?? []) as GoalRow[]).map(mapGoalRow) };
    },
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      goalType: GoalType;
      unit: string;
      targetValue: number;
      targetDate: string | null;
    }): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("user_goals").insert({
        user_id: user.id,
        title: input.title,
        goal_type: input.goalType,
        unit: input.unit,
        target_value: input.targetValue,
        target_date: input.targetDate,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("user_goals").delete().eq("id", goalId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useUpdateGoalProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { goalId: string; currentValue: number }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("user_goals")
        .update({ current_value: input.currentValue })
        .eq("id", input.goalId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

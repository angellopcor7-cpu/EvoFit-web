"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  type WorkoutCompletion,
  type WorkoutCompletionRow,
  type NewWorkoutCompletionInput,
  type CompleteWorkoutResult,
  mapWorkoutCompletionRow,
} from "@/lib/workoutCompletions";
import type { WorkoutCategory } from "@/lib/workouts";

const STATS_QUERY_KEY = ["workoutCompletions", "stats"];
const STATS_WINDOW_DAYS = 30;

export type DayActivity = {
  date: string;
  label: string;
  count: number;
};

export type CategoryBreakdownEntry = {
  category: WorkoutCategory;
  count: number;
};

export type WorkoutStats = {
  totalCount: number;
  last7Days: DayActivity[];
  categoryBreakdown: CategoryBreakdownEntry[];
  recent: WorkoutCompletion[];
};

const WEEKDAY_LABEL = ["D", "L", "M", "M", "J", "V", "S"];

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const useWorkoutStats = () => {
  return useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: async (): Promise<WorkoutStats> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { totalCount: 0, last7Days: [], categoryBreakdown: [], recent: [] };
      }

      const { count, error: countError } = await supabase
        .from("workout_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (countError) throw new Error(countError.message);

      const since = new Date();
      since.setDate(since.getDate() - STATS_WINDOW_DAYS);

      const { data, error } = await supabase
        .from("workout_completions")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", since.toISOString())
        .order("completed_at", { ascending: false });
      if (error) throw new Error(error.message);

      const completions = ((data ?? []) as WorkoutCompletionRow[]).map(
        mapWorkoutCompletionRow,
      );

      const last7Days: DayActivity[] = Array.from({ length: 7 }).map((_, index) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - index));
        const dateStr = toDateOnly(day);
        const count = completions.filter(
          (c) => toDateOnly(new Date(c.completedAt)) === dateStr,
        ).length;
        return { date: dateStr, label: WEEKDAY_LABEL[day.getDay()], count };
      });

      const categoryCounts = new Map<WorkoutCategory, number>();
      for (const completion of completions) {
        categoryCounts.set(
          completion.category,
          (categoryCounts.get(completion.category) ?? 0) + 1,
        );
      }
      const categoryBreakdown: CategoryBreakdownEntry[] = Array.from(
        categoryCounts.entries(),
      )
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalCount: count ?? 0,
        last7Days,
        categoryBreakdown,
        recent: completions.slice(0, 8),
      };
    },
  });
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? "Algo salió mal");
  }
  return json as T;
}

export const useCompleteWorkout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewWorkoutCompletionInput) =>
      postJson<CompleteWorkoutResult>("/api/workouts/complete", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
};

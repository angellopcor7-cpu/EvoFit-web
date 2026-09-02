"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  type DietPlan,
  type DietPlanRow,
  type DietGoal,
  type DietStyle,
  type DietBudget,
  type DietProteinType,
  type WeeklyDietMeal,
  type WeeklyDietMealRow,
  type ShoppingListItem,
  mapDietPlanRow,
  mapWeeklyDietMealRow,
  buildShoppingList,
} from "@/lib/diet";
import type { ActivityLevel, Sex } from "@/lib/dietCalculations";

const QUERY_KEY = ["dietPlans", "active"];

export const useDietPlan = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<{ plan: DietPlan | null }> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { plan: null };

      const { data, error } = await supabase
        .from("user_diet_plans")
        .select("*,user_diet_plan_meals(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw new Error(error.message);

      const row = (data ?? [])[0] as DietPlanRow | undefined;
      return { plan: row ? mapDietPlanRow(row) : null };
    },
  });
};

export type CreateDietPlanInput = {
  goal: DietGoal;
  dietStyle: DietStyle;
  budget: DietBudget;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  proteinPreferences: DietProteinType[];
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

export const useCreateDietPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDietPlanInput) =>
      postJson<{ plan: DietPlan }>("/api/diet-plans/create", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export const useRegenerateDietPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { proteinPreferences?: DietProteinType[] } = {}) =>
      postJson<{ plan: DietPlan }>("/api/diet-plans/regenerate", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_QUERY_KEY });
    },
  });
};

const SHOPPING_LIST_QUERY_KEY = ["dietPlans", "shoppingList"];

// Lista de compras de la semana activa: junta los ingredientes de las 7
// comidas × slots que ya se generaron para domingo-sábado.
export const useWeeklyShoppingList = (planId: string | undefined) => {
  return useQuery({
    queryKey: [...SHOPPING_LIST_QUERY_KEY, planId],
    enabled: !!planId,
    queryFn: async (): Promise<{
      weekStartDate: string | null;
      items: ShoppingListItem[];
      meals: WeeklyDietMeal[];
    }> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !planId) return { weekStartDate: null, items: [], meals: [] };

      const { data, error } = await supabase
        .from("user_weekly_diet_meals")
        .select("*")
        .eq("user_diet_plan_id", planId)
        .eq("user_id", user.id)
        .order("day_of_week", { ascending: true })
        .order("order_index", { ascending: true });
      if (error) throw new Error(error.message);

      const meals = ((data ?? []) as WeeklyDietMealRow[]).map(mapWeeklyDietMealRow);
      const weekStartDate = (data ?? [])[0]?.week_start_date ?? null;
      return { weekStartDate, items: buildShoppingList(meals), meals };
    },
  });
};

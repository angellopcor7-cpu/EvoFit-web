import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  DIET_PROTEIN_TYPES,
  type DietMealOptionRow,
  type DietPlanRow,
  mapMealOptionRow,
  mapDietPlanRow,
  pickWeeklyMealsForPlan,
  getWeekStartDate,
  parseAllergyTerms,
} from "@/lib/diet";

const schema = z.object({
  proteinPreferences: z.array(z.enum(DIET_PROTEIN_TYPES)).max(6).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const input = schema.parse(json);

    const { data: planRows, error: planError } = await supabase
      .from("user_diet_plans")
      .select("*,user_diet_plan_meals(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (planError) throw new Error(planError.message);

    const existingRow = (planRows ?? [])[0] as DietPlanRow | undefined;
    if (!existingRow) {
      throw new Error("Todavía no tienes un plan de alimentación activo");
    }
    const existing = mapDietPlanRow(existingRow);
    const proteinPreferences =
      input.proteinPreferences ?? existing.proteinPreferences;

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("allergies")
      .eq("id", user.id)
      .maybeSingle();
    const allergyTerms = parseAllergyTerms(profileRow?.allergies ?? null);

    const { data: optionRows, error: optionsError } = await supabase
      .from("diet_meal_options")
      .select("*")
      .eq("diet_style", existing.dietStyle)
      .eq("budget", existing.budget)
      .order("meal_slot", { ascending: true })
      .order("order_index", { ascending: true });
    if (optionsError) throw new Error(optionsError.message);

    const options = ((optionRows ?? []) as DietMealOptionRow[]).map(
      mapMealOptionRow,
    );
    const weeklyMeals = pickWeeklyMealsForPlan(
      options,
      proteinPreferences,
      allergyTerms,
    );
    const today = new Date();
    const weekStartDate = getWeekStartDate(today);
    const todayDow = today.getDay();
    const todaysMeals = weeklyMeals.filter((m) => m.dayOfWeek === todayDow);

    const { error: deleteError } = await supabase
      .from("user_diet_plan_meals")
      .delete()
      .eq("user_diet_plan_id", existing.id);
    if (deleteError) throw new Error(deleteError.message);

    const { error: deleteWeeklyError } = await supabase
      .from("user_weekly_diet_meals")
      .delete()
      .eq("user_diet_plan_id", existing.id);
    if (deleteWeeklyError) throw new Error(deleteWeeklyError.message);

    const { data: mealRows, error: insertError } = await supabase
      .from("user_diet_plan_meals")
      .insert(
        todaysMeals.map((meal) => ({
          user_diet_plan_id: existing.id,
          meal_slot: meal.mealSlot,
          order_index: meal.orderIndex,
          name: meal.name,
          description: meal.description,
          kcal: meal.kcal,
          protein_g: meal.proteinG,
          carbs_g: meal.carbsG,
          fat_g: meal.fatG,
        })),
      )
      .select();
    if (insertError) throw new Error(insertError.message);

    const { error: weeklyInsertError } = await supabase
      .from("user_weekly_diet_meals")
      .insert(
        weeklyMeals.map((meal) => ({
          user_diet_plan_id: existing.id,
          user_id: user.id,
          week_start_date: weekStartDate,
          day_of_week: meal.dayOfWeek,
          meal_slot: meal.mealSlot,
          order_index: meal.orderIndex,
          name: meal.name,
          description: meal.description,
          kcal: meal.kcal,
          protein_g: meal.proteinG,
          carbs_g: meal.carbsG,
          fat_g: meal.fatG,
          ingredients: meal.ingredients,
        })),
      );
    if (weeklyInsertError) throw new Error(weeklyInsertError.message);

    const todayStr = today.toISOString().slice(0, 10);
    await supabase
      .from("user_diet_plans")
      .update({
        updated_at: new Date().toISOString(),
        protein_preferences: proteinPreferences,
        meals_generated_on: todayStr,
        week_start_date: weekStartDate,
      })
      .eq("id", existing.id);

    return NextResponse.json({
      plan: {
        ...existing,
        updatedAt: new Date().toISOString(),
        proteinPreferences,
        mealsGeneratedOn: todayStr,
        weekStartDate,
        meals: (mealRows ?? [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((m) => ({
            id: m.id,
            mealSlot: m.meal_slot,
            orderIndex: m.order_index,
            name: m.name,
            description: m.description,
            kcal: m.kcal,
            proteinG: m.protein_g,
            carbsG: m.carbs_g,
            fatG: m.fat_g,
          })),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo regenerar tu menú";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

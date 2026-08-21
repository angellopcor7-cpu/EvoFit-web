import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  DIET_GOALS,
  DIET_STYLES,
  DIET_BUDGETS,
  DIET_PROTEIN_TYPES,
  DIET_MEAL_SLOTS,
  type DietMealOptionRow,
  mapMealOptionRow,
  pickMealsForPlan,
  parseAllergyTerms,
} from "@/lib/diet";
import { ACTIVITY_LEVELS, SEX_OPTIONS, calculateDietTargets } from "@/lib/dietCalculations";

const schema = z.object({
  goal: z.enum(DIET_GOALS),
  dietStyle: z.enum(DIET_STYLES),
  budget: z.enum(DIET_BUDGETS),
  sex: z.enum(SEX_OPTIONS),
  age: z.number().int().min(14).max(90),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(35).max(250),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  proteinPreferences: z.array(z.enum(DIET_PROTEIN_TYPES)).max(6),
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

    const targets = calculateDietTargets(input);

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("allergies")
      .eq("id", user.id)
      .maybeSingle();
    const allergyTerms = parseAllergyTerms(profileRow?.allergies ?? null);

    const { data: optionRows, error: optionsError } = await supabase
      .from("diet_meal_options")
      .select("*")
      .eq("diet_style", input.dietStyle)
      .eq("budget", input.budget)
      .order("meal_slot", { ascending: true })
      .order("order_index", { ascending: true });
    if (optionsError) throw new Error(optionsError.message);

    const options = ((optionRows ?? []) as DietMealOptionRow[]).map(
      mapMealOptionRow,
    );
    const meals = pickMealsForPlan(
      options,
      input.proteinPreferences,
      [],
      allergyTerms,
    );

    // Solo un plan activo por usuario: se borra el anterior (cascada a sus comidas).
    await supabase.from("user_diet_plans").delete().eq("user_id", user.id);

    const { data: planRow, error: planError } = await supabase
      .from("user_diet_plans")
      .insert({
        user_id: user.id,
        goal: input.goal,
        diet_style: input.dietStyle,
        budget: input.budget,
        target_kcal: targets.targetKcal,
        target_protein_g: targets.targetProteinG,
        target_carbs_g: targets.targetCarbsG,
        target_fat_g: targets.targetFatG,
        meals_per_day: DIET_MEAL_SLOTS.length,
        protein_preferences: input.proteinPreferences,
      })
      .select()
      .single();
    if (planError || !planRow) {
      throw new Error(
        planError?.message ?? "No se pudo crear tu plan de alimentación",
      );
    }

    const { data: mealRows, error: mealsError } = await supabase
      .from("user_diet_plan_meals")
      .insert(
        meals.map((meal) => ({
          user_diet_plan_id: planRow.id,
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
    if (mealsError) throw new Error(mealsError.message);

    return NextResponse.json({
      plan: {
        id: planRow.id,
        goal: planRow.goal,
        dietStyle: planRow.diet_style,
        budget: planRow.budget,
        targetKcal: planRow.target_kcal,
        targetProteinG: planRow.target_protein_g,
        targetCarbsG: planRow.target_carbs_g,
        targetFatG: planRow.target_fat_g,
        mealsPerDay: planRow.meals_per_day,
        createdAt: planRow.created_at,
        updatedAt: planRow.updated_at,
        proteinPreferences: planRow.protein_preferences,
        mealsGeneratedOn: planRow.meals_generated_on,
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
      error instanceof Error
        ? error.message
        : "No se pudo crear tu plan de alimentación";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

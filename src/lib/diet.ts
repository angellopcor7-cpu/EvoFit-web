export const DIET_GOALS = [
  "recomposicion",
  "definicion",
  "volumen_limpio",
  "volumen_clasico",
  "mantenimiento",
  "perdida_peso",
  "fuerza_rendimiento",
] as const;

export type DietGoal = (typeof DIET_GOALS)[number];

export const DIET_GOAL_LABEL: Record<DietGoal, string> = {
  recomposicion: "Recomposición",
  definicion: "Definición",
  volumen_limpio: "Volumen limpio",
  volumen_clasico: "Volumen clásico",
  mantenimiento: "Mantenimiento",
  perdida_peso: "Pérdida de peso",
  fuerza_rendimiento: "Fuerza y rendimiento",
};

export const DIET_STYLES = [
  "estandar",
  "alta_proteina",
  "baja_carbos",
  "vegetariana",
  "vegana",
  "mediterranea",
] as const;

export type DietStyle = (typeof DIET_STYLES)[number];

export const DIET_STYLE_LABEL: Record<DietStyle, string> = {
  estandar: "Estándar",
  alta_proteina: "Alta en proteína",
  baja_carbos: "Baja en carbohidratos",
  vegetariana: "Vegetariana",
  vegana: "Vegana",
  mediterranea: "Mediterránea",
};

export const DIET_MEAL_SLOTS = ["desayuno", "comida", "cena", "snack"] as const;

export type DietMealSlot = (typeof DIET_MEAL_SLOTS)[number];

export const DIET_MEAL_SLOT_LABEL: Record<DietMealSlot, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
  snack: "Snack",
};

export const DIET_PROTEIN_TYPES = [
  "pollo",
  "res",
  "pescado",
  "huevo",
  "vegetal",
  "ninguna",
] as const;

export type DietProteinType = (typeof DIET_PROTEIN_TYPES)[number];

export const DIET_PROTEIN_TYPE_LABEL: Record<DietProteinType, string> = {
  pollo: "Pollo",
  res: "Res",
  pescado: "Pescado",
  huevo: "Huevo",
  vegetal: "Vegetal",
  ninguna: "Sin proteína específica",
};

export type DietMealOption = {
  id: string;
  dietStyle: DietStyle;
  mealSlot: DietMealSlot;
  proteinType: DietProteinType;
  name: string;
  description: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  orderIndex: number;
};

export type DietMealOptionRow = {
  id: string;
  diet_style: string;
  meal_slot: string;
  protein_type: string;
  name: string;
  description: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  order_index: number;
};

export function mapMealOptionRow(row: DietMealOptionRow): DietMealOption {
  return {
    id: row.id,
    dietStyle: row.diet_style as DietStyle,
    mealSlot: row.meal_slot as DietMealSlot,
    proteinType: row.protein_type as DietProteinType,
    name: row.name,
    description: row.description,
    kcal: row.kcal,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    orderIndex: row.order_index,
  };
}

export type DietPlanMeal = {
  id: string;
  mealSlot: DietMealSlot;
  orderIndex: number;
  name: string;
  description: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type DietPlan = {
  id: string;
  goal: DietGoal;
  dietStyle: DietStyle;
  targetKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  mealsPerDay: number;
  createdAt: string;
  updatedAt: string;
  meals: DietPlanMeal[];
};

export type DietPlanRow = {
  id: string;
  goal: string;
  diet_style: string;
  target_kcal: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  meals_per_day: number;
  created_at: string;
  updated_at: string;
  user_diet_plan_meals: {
    id: string;
    meal_slot: string;
    order_index: number;
    name: string;
    description: string;
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
};

export function mapDietPlanRow(row: DietPlanRow): DietPlan {
  return {
    id: row.id,
    goal: row.goal as DietGoal,
    dietStyle: row.diet_style as DietStyle,
    targetKcal: row.target_kcal,
    targetProteinG: row.target_protein_g,
    targetCarbsG: row.target_carbs_g,
    targetFatG: row.target_fat_g,
    mealsPerDay: row.meals_per_day,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    meals: [...row.user_diet_plan_meals]
      .sort((a, b) => a.order_index - b.order_index)
      .map((m) => ({
        id: m.id,
        mealSlot: m.meal_slot as DietMealSlot,
        orderIndex: m.order_index,
        name: m.name,
        description: m.description,
        kcal: m.kcal,
        proteinG: m.protein_g,
        carbsG: m.carbs_g,
        fatG: m.fat_g,
      })),
  };
}

export type NewPlanMealInput = {
  mealSlot: DietMealSlot;
  orderIndex: number;
  name: string;
  description: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

// Elige 1 platillo por meal_slot, filtrando por proteína preferida cuando aplica,
// evitando repetir el nombre actual si hay alternativas (usado al "Regenerar").
export function pickMealsForPlan(
  options: DietMealOption[],
  proteinPreferences: DietProteinType[],
  excludeNames: string[] = [],
): NewPlanMealInput[] {
  return DIET_MEAL_SLOTS.map((slot, index) => {
    const slotOptions = options.filter((o) => o.mealSlot === slot);
    if (slotOptions.length === 0) {
      throw new Error(`No hay opciones de menú para ${slot}`);
    }

    const preferred =
      proteinPreferences.length > 0
        ? slotOptions.filter(
            (o) =>
              proteinPreferences.includes(o.proteinType) ||
              o.proteinType === "ninguna",
          )
        : slotOptions;
    const pool = preferred.length > 0 ? preferred : slotOptions;
    const fresh = pool.filter((o) => !excludeNames.includes(o.name));
    const finalPool = fresh.length > 0 ? fresh : pool;
    const choice = finalPool[Math.floor(Math.random() * finalPool.length)];

    return {
      mealSlot: slot,
      orderIndex: index,
      name: choice.name,
      description: choice.description,
      kcal: choice.kcal,
      proteinG: choice.proteinG,
      carbsG: choice.carbsG,
      fatG: choice.fatG,
    };
  });
}

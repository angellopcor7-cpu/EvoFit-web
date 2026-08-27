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

export const DIET_BUDGETS = ["economico", "moderado", "premium"] as const;

export type DietBudget = (typeof DIET_BUDGETS)[number];

export const DIET_BUDGET_LABEL: Record<DietBudget, string> = {
  economico: "Económico",
  moderado: "Moderado",
  premium: "Premium",
};

export const DIET_MEAL_SLOTS = ["desayuno", "comida", "cena", "snack"] as const;

export type DietMealSlot = (typeof DIET_MEAL_SLOTS)[number];

export const DIET_MEAL_SLOT_LABEL: Record<DietMealSlot, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
  snack: "Snack",
};

// Franjas horarias fijas para saber qué comida le toca al usuario ahora
// mismo: desayuno 00:00–12:00, comida 12:01pm–6pm, cena 6:01pm–11:59pm.
export function getCurrentMealSlot(date: Date): "desayuno" | "comida" | "cena" {
  const totalMin = date.getHours() * 60 + date.getMinutes();
  if (totalMin < 720) return "desayuno"; // antes de las 12:00 pm
  if (totalMin <= 1080) return "comida"; // 12:00 pm – 6:00 pm
  return "cena"; // después de las 6:00 pm
}

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
  budget: DietBudget;
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
  budget: string;
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
    budget: row.budget as DietBudget,
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
  budget: DietBudget;
  targetKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  mealsPerDay: number;
  createdAt: string;
  updatedAt: string;
  proteinPreferences: DietProteinType[];
  mealsGeneratedOn: string;
  meals: DietPlanMeal[];
};

export type DietPlanRow = {
  id: string;
  goal: string;
  diet_style: string;
  budget: string;
  target_kcal: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  meals_per_day: number;
  created_at: string;
  updated_at: string;
  protein_preferences: string[];
  meals_generated_on: string;
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
    budget: row.budget as DietBudget,
    targetKcal: row.target_kcal,
    targetProteinG: row.target_protein_g,
    targetCarbsG: row.target_carbs_g,
    targetFatG: row.target_fat_g,
    mealsPerDay: row.meals_per_day,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    proteinPreferences: (row.protein_preferences ?? []) as DietProteinType[],
    mealsGeneratedOn: row.meals_generated_on,
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

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(DIACRITICS_REGEX, "").toLowerCase();
}

// Convierte el texto libre de alergias del perfil ("maní, mariscos y lactosa")
// en términos individuales normalizados (sin acentos, minúsculas) listos para
// buscar como substring dentro de nombre/descripción de cada platillo.
export function parseAllergyTerms(
  allergies: string | null | undefined,
): string[] {
  if (!allergies) return [];
  return allergies
    .split(/[,;/]| y | and /i)
    .map((term) => normalizeText(term.trim()))
    .filter((term) => term.length > 1);
}

function containsAllergen(option: DietMealOption, allergyTerms: string[]): boolean {
  const haystack = normalizeText(`${option.name} ${option.description}`);
  return allergyTerms.some((term) => haystack.includes(term));
}

// Elige 1 platillo por meal_slot, evitando alérgenos declarados, filtrando por
// proteína preferida cuando aplica, y evitando repetir el nombre actual si hay
// alternativas (usado al "Regenerar"). Nota: si excluir alérgenos dejara un
// slot sin ninguna opción, se ignora ese filtro para ese slot en particular —
// en la práctica casi no pasa porque solo una fracción de los platillos de
// cada slot comparte un mismo alérgeno.
export function pickMealsForPlan(
  options: DietMealOption[],
  proteinPreferences: DietProteinType[],
  excludeNames: string[] = [],
  allergyTerms: string[] = [],
): NewPlanMealInput[] {
  return DIET_MEAL_SLOTS.map((slot, index) => {
    const slotOptions = options.filter((o) => o.mealSlot === slot);
    if (slotOptions.length === 0) {
      throw new Error(`No hay opciones de menú para ${slot}`);
    }

    const allergySafe =
      allergyTerms.length > 0
        ? slotOptions.filter((o) => !containsAllergen(o, allergyTerms))
        : slotOptions;
    const basePool = allergySafe.length > 0 ? allergySafe : slotOptions;

    const preferred =
      proteinPreferences.length > 0
        ? basePool.filter(
            (o) =>
              proteinPreferences.includes(o.proteinType) ||
              o.proteinType === "ninguna",
          )
        : basePool;
    const pool = preferred.length > 0 ? preferred : basePool;
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

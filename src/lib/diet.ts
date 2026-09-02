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

export const CURRENT_SLOT_LABEL: Record<"desayuno" | "comida" | "cena" | "ayuno", string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
  ayuno: "Ayuno",
};

// Franjas horarias para saber qué comida le toca al usuario ahora mismo.
// Por default: desayuno 00:00–12:00, comida 12:01pm–6pm, cena 6:01pm–11:59pm.
// En modo ayuno no hay desayuno: el ayuno empieza a las 00:00 y termina a
// la hora que la persona elija ("fastingEndTime", ej. "14:30") — de ahí en
// adelante es su comida, y la cena se mantiene fija a partir de las 6pm.
export function getCurrentMealSlot(
  date: Date,
  fastingMode = false,
  fastingEndTime = "12:00",
): "desayuno" | "comida" | "cena" | "ayuno" {
  const totalMin = date.getHours() * 60 + date.getMinutes();

  if (fastingMode) {
    const [endH, endM] = fastingEndTime.split(":").map(Number);
    const fastingEndMin = (endH || 0) * 60 + (endM || 0);
    if (totalMin < fastingEndMin) return "ayuno";
    if (totalMin < 1080) return "comida"; // hasta las 6:00 pm
    return "cena";
  }

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

export type MealIngredient = string;

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
  ingredients: MealIngredient[];
  prepSteps: string[];
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
  ingredients: MealIngredient[] | null;
  prep_steps: string[] | null;
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
    ingredients: row.ingredients ?? [],
    prepSteps: row.prep_steps ?? [],
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
  prepSteps: string[];
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
  weekStartDate: string | null;
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
  week_start_date: string | null;
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
    prep_steps: string[] | null;
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
    weekStartDate: row.week_start_date,
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
        prepSteps: m.prep_steps ?? [],
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
  prepSteps: string[];
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
      prepSteps: choice.prepSteps,
    };
  });
}

// La semana de dieta corre domingo→sábado, igual que el plan semanal de
// entrenamientos (day_of_week 0 = domingo). Así, cada domingo arranca una
// semana nueva y se regenera el menú completo con su lista de compras.
export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

export type WeeklyDietMeal = {
  id: string;
  dayOfWeek: number;
  mealSlot: DietMealSlot;
  orderIndex: number;
  name: string;
  description: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: MealIngredient[];
};

export type WeeklyDietMealRow = {
  id: string;
  day_of_week: number;
  meal_slot: string;
  order_index: number;
  name: string;
  description: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: MealIngredient[] | null;
};

export function mapWeeklyDietMealRow(row: WeeklyDietMealRow): WeeklyDietMeal {
  return {
    id: row.id,
    dayOfWeek: row.day_of_week,
    mealSlot: row.meal_slot as DietMealSlot,
    orderIndex: row.order_index,
    name: row.name,
    description: row.description,
    kcal: row.kcal,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    ingredients: row.ingredients ?? [],
  };
}

export type NewWeeklyMealInput = NewPlanMealInput & {
  dayOfWeek: number;
  ingredients: MealIngredient[];
};

// Arma los 7 días (domingo a sábado) × comidas por día para toda la
// semana, evitando repetir el mismo platillo en un mismo slot dentro de
// la semana mientras el catálogo lo permita.
export function pickWeeklyMealsForPlan(
  options: DietMealOption[],
  proteinPreferences: DietProteinType[],
  allergyTerms: string[] = [],
): NewWeeklyMealInput[] {
  const result: NewWeeklyMealInput[] = [];
  const usedNamesBySlot: Record<string, string[]> = {};

  for (let day = 0; day < 7; day++) {
    const dayMeals = pickMealsForPlan(
      options,
      proteinPreferences,
      Object.values(usedNamesBySlot).flat(),
      allergyTerms,
    );
    for (const meal of dayMeals) {
      const chosenOption = options.find(
        (o) => o.name === meal.name && o.mealSlot === meal.mealSlot,
      );
      usedNamesBySlot[meal.mealSlot] = [
        ...(usedNamesBySlot[meal.mealSlot] ?? []),
        meal.name,
      ];
      result.push({
        ...meal,
        dayOfWeek: day,
        ingredients: chosenOption?.ingredients ?? [],
      });
    }
  }
  return result;
}

// Junta los ingredientes de todas las comidas de la semana en una sola
// lista de compras. Cada ingrediente ya viene como una línea completa
// (ej. "150 g de pechuga de pollo"); si la misma línea se repite varias
// veces en la semana, se muestra una sola vez con cuántas veces se
// necesita en total, en vez de tratar de sumar cantidades en texto libre.
export type ShoppingListItem = {
  name: string;
  amount: string;
};

export function buildShoppingList(meals: WeeklyDietMeal[]): ShoppingListItem[] {
  const counts = new Map<string, { display: string; count: number }>();

  for (const meal of meals) {
    for (const line of meal.ingredients) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const key = normalizeText(trimmed);
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { display: trimmed, count: 1 });
      }
    }
  }

  return Array.from(counts.values())
    .map(({ display, count }) => ({
      name: display,
      amount: count > 1 ? `× ${count}` : "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

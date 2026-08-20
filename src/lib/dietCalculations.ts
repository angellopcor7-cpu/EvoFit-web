import type { DietGoal, DietStyle } from "./diet";

export const ACTIVITY_LEVELS = [
  "sedentario",
  "ligero",
  "moderado",
  "activo",
  "muy_activo",
] as const;

export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const ACTIVITY_LEVEL_LABEL: Record<ActivityLevel, string> = {
  sedentario: "Sedentario (poco o nada de ejercicio)",
  ligero: "Ligero (1-3 días/semana)",
  moderado: "Moderado (3-5 días/semana)",
  activo: "Activo (6-7 días/semana)",
  muy_activo: "Muy activo (entrenamiento intenso o trabajo físico)",
};

export const SEX_OPTIONS = ["masculino", "femenino"] as const;

export type Sex = (typeof SEX_OPTIONS)[number];

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

// Ajuste sobre el TDEE según la meta (lineamientos generales de nutrición deportiva ISSN).
const GOAL_KCAL_ADJUSTMENT: Record<DietGoal, number> = {
  recomposicion: -0.05,
  definicion: -0.15,
  volumen_limpio: 0.1,
  volumen_clasico: 0.2,
  mantenimiento: 0,
  perdida_peso: -0.25,
  fuerza_rendimiento: 0.05,
};

// Gramos de proteína por kg de peso corporal según la meta.
const GOAL_PROTEIN_PER_KG: Record<DietGoal, number> = {
  recomposicion: 2.2,
  definicion: 2.2,
  volumen_limpio: 1.8,
  volumen_clasico: 1.8,
  mantenimiento: 1.8,
  perdida_peso: 2.0,
  fuerza_rendimiento: 2.0,
};

const STYLE_FAT_PERCENT: Record<DietStyle, number> = {
  estandar: 0.28,
  alta_proteina: 0.25,
  baja_carbos: 0.4,
  vegetariana: 0.3,
  vegana: 0.3,
  mediterranea: 0.35,
};

const STYLE_PROTEIN_BONUS_PER_KG: Record<DietStyle, number> = {
  estandar: 0,
  alta_proteina: 0.3,
  baja_carbos: 0.1,
  vegetariana: 0,
  vegana: 0,
  mediterranea: 0,
};

export type DietTargets = {
  targetKcal: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
};

export function calculateDietTargets(input: {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: DietGoal;
  dietStyle: DietStyle;
}): DietTargets {
  // Mifflin-St Jeor
  const bmr =
    10 * input.weightKg +
    6.25 * input.heightCm -
    5 * input.age +
    (input.sex === "masculino" ? 5 : -161);

  const tdee = bmr * ACTIVITY_MULTIPLIER[input.activityLevel];
  const goalAdjustment = GOAL_KCAL_ADJUSTMENT[input.goal];
  const targetKcal = Math.max(1200, Math.round(tdee * (1 + goalAdjustment)));

  const proteinPerKg =
    GOAL_PROTEIN_PER_KG[input.goal] +
    STYLE_PROTEIN_BONUS_PER_KG[input.dietStyle];
  const targetProteinG = Math.round(input.weightKg * proteinPerKg);

  const fatPercent = STYLE_FAT_PERCENT[input.dietStyle];
  const targetFatG = Math.round((targetKcal * fatPercent) / 9);

  const proteinKcal = targetProteinG * 4;
  const fatKcal = targetFatG * 9;
  const remainingKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
  const targetCarbsG = Math.round(remainingKcal / 4);

  return { targetKcal, targetProteinG, targetCarbsG, targetFatG };
}

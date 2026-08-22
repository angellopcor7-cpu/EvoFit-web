export const MUSCLE_GROUPS = [
  "pecho",
  "espalda",
  "hombros",
  "biceps",
  "triceps",
  "cuadriceps",
  "isquiotibiales",
  "gluteos",
  "pantorrillas",
  "abdomen",
  "cardio",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  cuadriceps: "Cuádriceps",
  isquiotibiales: "Isquiotibiales",
  gluteos: "Glúteos",
  pantorrillas: "Pantorrillas",
  abdomen: "Abdomen",
  cardio: "Cardio",
};

export const EQUIPMENT_TYPES = ["gym", "peso_corporal"] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export type Exercise = {
  id: string;
  muscleGroup: MuscleGroup;
  name: string;
  defaultSets: number;
  defaultRepsLabel: string | null;
  defaultDurationLabel: string | null;
  defaultRestLabel: string;
  equipmentType: EquipmentType;
  orderIndex: number;
};

export type ExerciseRow = {
  id: string;
  muscle_group: string;
  name: string;
  default_sets: number;
  default_reps_label: string | null;
  default_duration_label: string | null;
  default_rest_label: string;
  equipment_type: string;
  order_index: number;
};

export function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    muscleGroup: row.muscle_group as MuscleGroup,
    name: row.name,
    defaultSets: row.default_sets,
    defaultRepsLabel: row.default_reps_label,
    defaultDurationLabel: row.default_duration_label,
    defaultRestLabel: row.default_rest_label,
    equipmentType: row.equipment_type as EquipmentType,
    orderIndex: row.order_index,
  };
}

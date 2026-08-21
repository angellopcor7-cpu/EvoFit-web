import type { MuscleGroup } from "@/lib/exercises";
import type { WorkoutCategory } from "@/lib/workouts";

// Sistema de "patrones de movimiento": en vez de una foto real por cada uno
// de los ~150+ ejercicios (no viable sin banco de imágenes con licencia ni
// herramienta de generación de imágenes en este proyecto), agrupamos los
// ejercicios en un set chico de patrones de movimiento reconocibles
// (press, remo, sentadilla, curl, plancha, etc.) y dibujamos, para cada uno,
// un mono simple en dos posiciones: inicio y final del movimiento. Varios
// ejercicios parecidos comparten patrón (p. ej. "Press de banca con barra" y
// "Press de banca con mancuernas" se ven igual) — es una simplificación
// consciente para que sea rápido de mantener y siga siendo honesto sobre lo
// que muestra (el movimiento general, no la técnica exacta de cada variante).

export const EXERCISE_PATTERNS = [
  "press_banca",
  "press_hombro",
  "aper_pecho",
  "aper_espalda",
  "remo",
  "jalon",
  "dominada",
  "curl_biceps",
  "extension_triceps",
  "fondo",
  "flexion",
  "elevacion_lateral",
  "elevacion_frontal",
  "encogimiento",
  "sentadilla",
  "zancada",
  "peso_muerto",
  "prensa_pierna",
  "extension_pierna",
  "curl_femoral",
  "puente_gluteo",
  "elevacion_talon",
  "elevacion_pierna",
  "abdominal",
  "plancha",
  "escalador",
  "burpee",
  "jumping_jack",
  "kettlebell_swing",
  "hiperextension",
  "correr",
  "cuerda",
  "boxeo",
  "patada",
  "baile",
  "yoga",
  "estiramiento",
] as const;

export type ExercisePattern = (typeof EXERCISE_PATTERNS)[number];

export type FigurePose = {
  hip: [number, number];
  torsoAngle: number;
  armAngle: number;
  forearmAngle: number;
  legAngle: number;
  shinAngle: number;
};

export type PatternPoses = { start: FigurePose; end: FigurePose };

const DEFAULT_POSE: FigurePose = {
  hip: [30, 36],
  torsoAngle: 0,
  armAngle: 24,
  forearmAngle: 28,
  legAngle: 0,
  shinAngle: 6,
};

function pose(overrides: Partial<FigurePose>): FigurePose {
  return { ...DEFAULT_POSE, ...overrides };
}

export const PATTERN_POSES: Record<ExercisePattern, PatternPoses> = {
  press_banca: {
    start: pose({ hip: [40, 42], torsoAngle: -90, legAngle: 170, shinAngle: 110, armAngle: 100, forearmAngle: 185 }),
    end: pose({ hip: [40, 42], torsoAngle: -90, legAngle: 170, shinAngle: 110, armAngle: 178, forearmAngle: 180 }),
  },
  press_hombro: {
    start: pose({ armAngle: 95, forearmAngle: 185 }),
    end: pose({ armAngle: 178, forearmAngle: 182 }),
  },
  aper_pecho: {
    start: pose({ hip: [40, 42], torsoAngle: -90, legAngle: 170, shinAngle: 110, armAngle: 70, forearmAngle: 75 }),
    end: pose({ hip: [40, 42], torsoAngle: -90, legAngle: 170, shinAngle: 110, armAngle: 175, forearmAngle: 178 }),
  },
  aper_espalda: {
    start: pose({ torsoAngle: 60, legAngle: 0, shinAngle: 10, armAngle: 10, forearmAngle: 15 }),
    end: pose({ torsoAngle: 60, legAngle: 0, shinAngle: 10, armAngle: 100, forearmAngle: 100 }),
  },
  remo: {
    start: pose({ torsoAngle: 45, legAngle: 5, shinAngle: 15, armAngle: 75, forearmAngle: 75 }),
    end: pose({ torsoAngle: 45, legAngle: 5, shinAngle: 15, armAngle: 5, forearmAngle: 175 }),
  },
  jalon: {
    start: pose({ hip: [30, 40], legAngle: 85, shinAngle: -80, armAngle: 170, forearmAngle: 170 }),
    end: pose({ hip: [30, 40], legAngle: 85, shinAngle: -80, armAngle: 100, forearmAngle: 190 }),
  },
  dominada: {
    start: pose({ hip: [30, 44], legAngle: 5, shinAngle: 10, armAngle: 175, forearmAngle: 175 }),
    end: pose({ hip: [30, 44], legAngle: 5, shinAngle: 10, armAngle: 160, forearmAngle: 60 }),
  },
  curl_biceps: {
    start: pose({ armAngle: 24, forearmAngle: 24 }),
    end: pose({ armAngle: 24, forearmAngle: 178 }),
  },
  extension_triceps: {
    start: pose({ armAngle: 175, forearmAngle: 80 }),
    end: pose({ armAngle: 175, forearmAngle: 175 }),
  },
  fondo: {
    start: pose({ hip: [30, 42], armAngle: 20, forearmAngle: 90, legAngle: 15, shinAngle: 20 }),
    end: pose({ hip: [30, 34], armAngle: 15, forearmAngle: 20, legAngle: 15, shinAngle: 20 }),
  },
  flexion: {
    start: pose({ hip: [40, 46], torsoAngle: -90, legAngle: 85, shinAngle: 85, armAngle: 70, forearmAngle: 320 }),
    end: pose({ hip: [40, 40], torsoAngle: -90, legAngle: 85, shinAngle: 85, armAngle: 5, forearmAngle: 5 }),
  },
  elevacion_lateral: {
    start: pose({ armAngle: 24, forearmAngle: 28 }),
    end: pose({ armAngle: 90, forearmAngle: 92 }),
  },
  elevacion_frontal: {
    start: pose({ armAngle: 24, forearmAngle: 28 }),
    end: pose({ armAngle: 88, forearmAngle: 90 }),
  },
  encogimiento: {
    start: pose({ hip: [30, 36], armAngle: 24, forearmAngle: 26 }),
    end: pose({ hip: [30, 34], armAngle: 24, forearmAngle: 26 }),
  },
  sentadilla: {
    start: pose({ torsoAngle: 5, armAngle: 80, forearmAngle: 85 }),
    end: pose({ hip: [30, 46], torsoAngle: 15, legAngle: 60, shinAngle: -40, armAngle: 80, forearmAngle: 85 }),
  },
  zancada: {
    start: pose({}),
    end: pose({ hip: [30, 42], legAngle: 55, shinAngle: -50 }),
  },
  peso_muerto: {
    start: pose({ torsoAngle: 80, armAngle: 80, forearmAngle: 80 }),
    end: pose({ hip: [30, 34], torsoAngle: 0, armAngle: 24, forearmAngle: 26 }),
  },
  prensa_pierna: {
    start: pose({ hip: [26, 40], torsoAngle: -70, legAngle: 70, shinAngle: -100 }),
    end: pose({ hip: [26, 40], torsoAngle: -70, legAngle: 75, shinAngle: -10 }),
  },
  extension_pierna: {
    start: pose({ hip: [30, 40], legAngle: 85, shinAngle: -85 }),
    end: pose({ hip: [30, 40], legAngle: 85, shinAngle: -5 }),
  },
  curl_femoral: {
    start: pose({ hip: [35, 42], torsoAngle: -90, legAngle: 88, shinAngle: 88 }),
    end: pose({ hip: [35, 42], torsoAngle: -90, legAngle: 88, shinAngle: -20 }),
  },
  puente_gluteo: {
    start: pose({ hip: [35, 50], torsoAngle: -90, legAngle: 60, shinAngle: -80 }),
    end: pose({ hip: [35, 40], torsoAngle: -90, legAngle: 60, shinAngle: -80 }),
  },
  elevacion_talon: {
    start: pose({ hip: [30, 37] }),
    end: pose({ hip: [30, 34] }),
  },
  elevacion_pierna: {
    start: pose({ hip: [30, 44], armAngle: 175, forearmAngle: 175, legAngle: 0, shinAngle: 6 }),
    end: pose({ hip: [30, 44], armAngle: 175, forearmAngle: 175, legAngle: 90, shinAngle: 85 }),
  },
  abdominal: {
    start: pose({ hip: [38, 46], torsoAngle: -90, legAngle: 70, shinAngle: -70 }),
    end: pose({ hip: [38, 46], torsoAngle: -60, legAngle: 70, shinAngle: -70 }),
  },
  plancha: {
    start: pose({ hip: [35, 40], torsoAngle: -90, legAngle: 85, shinAngle: 85, armAngle: 40, forearmAngle: 310 }),
    end: pose({ hip: [35, 40], torsoAngle: -90, legAngle: 85, shinAngle: 85, armAngle: 40, forearmAngle: 310 }),
  },
  escalador: {
    start: pose({ hip: [35, 40], torsoAngle: -90, armAngle: 5, forearmAngle: 5, legAngle: 85, shinAngle: 85 }),
    end: pose({ hip: [35, 40], torsoAngle: -90, armAngle: 5, forearmAngle: 5, legAngle: 60, shinAngle: -90 }),
  },
  burpee: {
    start: pose({ hip: [30, 34], armAngle: 175, forearmAngle: 175 }),
    end: pose({ hip: [38, 44], torsoAngle: -70, armAngle: 10, forearmAngle: 10, legAngle: 80, shinAngle: 80 }),
  },
  jumping_jack: {
    start: pose({ armAngle: 10, forearmAngle: 12, legAngle: 0, shinAngle: 0 }),
    end: pose({ armAngle: 175, forearmAngle: 175, legAngle: 35, shinAngle: 35 }),
  },
  kettlebell_swing: {
    start: pose({ torsoAngle: 55, armAngle: 90, forearmAngle: 90 }),
    end: pose({ hip: [30, 34], torsoAngle: 0, armAngle: 95, forearmAngle: 95 }),
  },
  hiperextension: {
    start: pose({ hip: [35, 44], torsoAngle: -90, legAngle: 85, shinAngle: 85 }),
    end: pose({ hip: [35, 44], torsoAngle: -105, legAngle: 75, shinAngle: 75 }),
  },
  correr: {
    start: pose({ torsoAngle: 10, armAngle: 60, forearmAngle: 150, legAngle: 40, shinAngle: -60 }),
    end: pose({ torsoAngle: 10, armAngle: -40, forearmAngle: -100, legAngle: -30, shinAngle: 40 }),
  },
  cuerda: {
    start: pose({ hip: [30, 37], armAngle: 20, forearmAngle: 100, legAngle: 0, shinAngle: 6 }),
    end: pose({ hip: [30, 33], armAngle: 25, forearmAngle: 105, legAngle: 10, shinAngle: 25 }),
  },
  boxeo: {
    start: pose({ torsoAngle: 8, armAngle: 70, forearmAngle: 170 }),
    end: pose({ torsoAngle: 8, armAngle: 95, forearmAngle: 95 }),
  },
  patada: {
    start: pose({}),
    end: pose({ legAngle: 95, shinAngle: 100 }),
  },
  baile: {
    start: pose({ hip: [28, 36], torsoAngle: -8, armAngle: 40, forearmAngle: 60, legAngle: -10, shinAngle: -5 }),
    end: pose({ hip: [32, 36], torsoAngle: 8, armAngle: -30, forearmAngle: -40, legAngle: 10, shinAngle: 5 }),
  },
  yoga: {
    start: pose({ armAngle: 140, forearmAngle: 145 }),
    end: pose({ armAngle: 170, forearmAngle: 172 }),
  },
  estiramiento: {
    start: pose({ armAngle: 90, forearmAngle: 90 }),
    end: pose({ armAngle: 150, forearmAngle: 155 }),
  },
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const CATEGORY_FALLBACK: Partial<Record<WorkoutCategory, ExercisePattern>> = {
  boxeo_kickboxing: "boxeo",
  yoga_pilates: "yoga",
  zumba: "baile",
  cardio_hiit: "correr",
  hibrido: "correr",
  crossfit: "correr",
  equipo_especial: "correr",
};

const MUSCLE_GROUP_FALLBACK: Record<MuscleGroup, ExercisePattern> = {
  pecho: "press_banca",
  espalda: "remo",
  hombros: "elevacion_lateral",
  biceps: "curl_biceps",
  triceps: "extension_triceps",
  cuadriceps: "sentadilla",
  isquiotibiales: "peso_muerto",
  gluteos: "puente_gluteo",
  pantorrillas: "elevacion_talon",
  abdomen: "abdominal",
  cardio: "correr",
};

// Clasifica un ejercicio (por nombre + grupo muscular, y opcionalmente la
// categoría de la rutina) en uno de los patrones de movimiento de arriba.
// El orden de las reglas importa: las más específicas van primero. Si nada
// coincide, cae a un patrón genérico por categoría y, si tampoco, por grupo
// muscular — así SIEMPRE hay un ícono razonable, incluso para bloques libres
// como "Repetir circuito x2" que no describen un movimiento concreto.
export function classifyExercisePattern(
  exerciseName: string,
  muscleGroup: MuscleGroup,
  categoryHint?: WorkoutCategory,
): ExercisePattern {
  const n = normalize(exerciseName);
  const has = (...needles: string[]) => needles.some((needle) => n.includes(needle));

  if (has("patada") && muscleGroup === "triceps") return "extension_triceps";
  if (has("patada") && muscleGroup === "gluteos") return "puente_gluteo";
  if (has("rodillazo")) return "patada";

  if (has("press militar", "press arnold", "press kettlebell", "snatch") || (has("press") && has("hombro"))) {
    return "press_hombro";
  }
  if (has("press") && has("banca", "pecho", "inclinad", "declinad", "smith", "cerrado", "trx")) {
    return "press_banca";
  }
  if (has("press frances", "triceps en testa") || (has("triceps") && !has("press"))) {
    return "extension_triceps";
  }
  if (has("press")) {
    return muscleGroup === "hombros" ? "press_hombro" : "press_banca";
  }

  if (has("apertura", "cruce de poleas", "pullover")) return "aper_pecho";
  if (has("pajaro")) return "aper_espalda";
  if (has("dominada")) return "dominada";
  if (has("jalon")) return "jalon";
  if (has("remo", "face pull")) return "remo";

  if (has("curl") && (muscleGroup === "isquiotibiales" || has("femoral", "nordic"))) return "curl_femoral";
  if (has("curl")) return "curl_biceps";

  if (has("extension") && muscleGroup === "cuadriceps") return "extension_pierna";
  if (has("extension lumbar", "hiperextension", "superman")) return "hiperextension";
  if (has("extension de cadera")) return "puente_gluteo";
  if (has("extension") && muscleGroup === "triceps") return "extension_triceps";

  if (has("fondo")) return "fondo";
  if (has("flexion")) return "flexion";
  if (has("elevacion lateral")) return "elevacion_lateral";
  if (has("elevacion frontal")) return "elevacion_frontal";
  if (has("elevacion de talon")) return "elevacion_talon";
  if (has("elevacion pelvica", "puente de gluteo", "puente de pilates", "hip thrust", "cuatro apoyos", "abduccion", "abductor")) {
    return "puente_gluteo";
  }
  if (has("elevacion de pierna", "l-sit", "l sit")) return "elevacion_pierna";
  if (has("encogimiento")) return "encogimiento";

  if (has("step up", "step /")) return "zancada";
  if (has("zancada")) return "zancada";
  if (has("sentadilla", "pistol squat", "front squat")) return "sentadilla";
  if (has("peso muerto", "buenos dias", "good morning")) return "peso_muerto";
  if (has("prensa de piernas", "leg press")) return "prensa_pierna";

  if (has("giro ruso", "abdominal", "crunch", "rueda abdominal", "hundred", "roll up")) return "abdominal";
  if (has("plancha")) return "plancha";
  if (has("mountain climber", "escalador")) return "escalador";
  if (has("burpee")) return "burpee";
  if (has("jumping jack")) return "jumping_jack";
  if (has("kettlebell swing", "swing")) return "kettlebell_swing";
  if (has("cuerda")) return "cuerda";

  if (has("boxeo", "jab", "gancho", "cruzado", "golpes", "guardia", "esquiva", "velocidad de manos", "sombra")) {
    return "boxeo";
  }
  if (has("patada", "kickboxing")) return "patada";

  if (has("combo", "baile", "cumbia", "salsa", "reggaeton", "bachata", "merengue", "perreo", "dembow")) {
    return "baile";
  }
  if (has("guerrero", "paloma", "gato-vaca", "postura del nino", "saludo al sol", "savasana")) return "yoga";
  if (has("calentamiento", "enfriamiento", "estiramiento", "movilidad", "respiracion", "relajacion", "centrado")) {
    return "estiramiento";
  }
  if (
    has(
      "correr",
      "trote",
      "trotar",
      "sprint",
      "caminadora",
      "caminata",
      "marcha en el lugar",
      "eliptica",
      "escaladora",
      "bicicleta",
      "spinning",
      "ciclismo",
      "natacion",
    )
  ) {
    return "correr";
  }

  if (categoryHint && CATEGORY_FALLBACK[categoryHint]) {
    return CATEGORY_FALLBACK[categoryHint]!;
  }
  return MUSCLE_GROUP_FALLBACK[muscleGroup] ?? "correr";
}

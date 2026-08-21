// Mapa de nombre de ejercicio -> imagen de inicio/final generada por IA,
// alojada en Supabase Storage (bucket público "exercise-images").
// Se va llenando poco a poco, ejercicio por ejercicio, a medida que se
// aprueba el estilo visual. Un ejercicio sin entrada aquí simplemente no
// muestra imagen (ver uso en entrenamientos/page.tsx).
const BASE_URL =
  "https://lcbgbbwzfbaliluimbwp.supabase.co/storage/v1/object/public/exercise-images";

export const EXERCISE_IMAGES: Record<string, string> = {
  "Remo con barra": `${BASE_URL}/remo-con-barra.png`,
  "Jalón al pecho supinado": `${BASE_URL}/jalon-al-pecho-supinado.png`,
};

export function getExerciseImageUrl(exerciseName: string): string | null {
  return EXERCISE_IMAGES[exerciseName] ?? null;
}

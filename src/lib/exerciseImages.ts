// Mapa de nombre de ejercicio -> imagen de inicio/final.
// Algunas están alojadas en Supabase Storage (bucket público "exercise-images",
// generadas por IA) y otras viven localmente en /public/exercise-images
// (provistas directamente por el usuario). Se va llenando poco a poco,
// ejercicio por ejercicio. Un ejercicio sin entrada aquí simplemente no
// muestra imagen (ver uso en entrenamientos/page.tsx y entrenamientos/crear).
const SUPABASE_BASE_URL =
  "https://lcbgbbwzfbaliluimbwp.supabase.co/storage/v1/object/public/exercise-images";

export const EXERCISE_IMAGES: Record<string, string> = {
  // Espalda
  "Remo con barra": `${SUPABASE_BASE_URL}/remo-con-barra.png`,
  "Jalón al pecho supinado": "/exercise-images/jalon-al-pecho-supinado.png",
  "Jalón al pecho abierto": "/exercise-images/jalon-al-pecho-abierto.png",
  "Jalón con triángulo": "/exercise-images/jalon-triangulo.png",
  "Dominadas (barra fija)": "/exercise-images/dominadas.png",
  "Encogimiento de hombros (trapecio)": "/exercise-images/encogimiento-hombros.png",
  "Face pull": "/exercise-images/face-pull.png",
  "Hiperextensión (extensión lumbar)": "/exercise-images/hiperextension.png",
  "Peso muerto convencional": "/exercise-images/peso-muerto-convencional.png",
  "Peso muerto rumano": "/exercise-images/peso-muerto-rumano.png",
  "Pullover en polea": "/exercise-images/pullover-polea.png",
  "Remo abierto en polea": "/exercise-images/remo-abierto-polea.png",
  "Remo cerrado en polea": "/exercise-images/remo-cerrado-polea.png",
  "Remo con mancuerna a un brazo": "/exercise-images/remo-mancuerna-un-brazo.png",
  "Remo en máquina sentado": "/exercise-images/remo-maquina-sentado.png",
  "Remo invertido (Australian row)": "/exercise-images/remo-invertido.png",
  "Remo serrote": "/exercise-images/remo-serrote.png",
  "Remo T": "/exercise-images/remo-t.png",
  "Superman": "/exercise-images/superman.png",
  // Pecho
  "Flexiones de pecho": "/exercise-images/flexiones-pecho.png",
  "Aperturas con mancuernas": "/exercise-images/aperturas-mancuernas.png",
  "Aperturas en máquina (contractora)": "/exercise-images/aperturas-maquina-contractora.png",
  "Aperturas inclinadas con mancuernas": "/exercise-images/aperturas-inclinadas-mancuernas.png",
  "Cruce de poleas (cross over)": "/exercise-images/cruce-poleas.png",
  "Cruce de poleas alto": "/exercise-images/cruce-poleas-alto.png",
  "Cruce de poleas bajo": "/exercise-images/cruce-poleas-bajo.png",
  "Flexiones diamante": "/exercise-images/flexiones-diamante.png",
  "Flexiones declinadas": "/exercise-images/flexiones-declinadas.png",
  "Fondos en paralelas (pecho)": "/exercise-images/fondos-paralelas.png",
  "Press de banca con barra": "/exercise-images/press-banca-barra.png",
  "Press de banca con mancuernas": "/exercise-images/press-banca-mancuernas.png",
  "Press de banca declinado con barra": "/exercise-images/press-banca-declinado-barra.png",
  "Press de banca inclinado con barra": "/exercise-images/press-banca-inclinado-barra.png",
  "Press en máquina": "/exercise-images/press-maquina.png",
  "Press en Smith inclinado": "/exercise-images/press-smith-inclinado.png",
  "Press inclinado con mancuernas": "/exercise-images/press-inclinado-mancuernas.png",
  "Press inclinado en máquina": "/exercise-images/press-inclinado-maquina.png",
  "Pullover con mancuerna": "/exercise-images/pullover-mancuerna.png",
};

export function getExerciseImageUrl(exerciseName: string): string | null {
  return EXERCISE_IMAGES[exerciseName] ?? null;
}

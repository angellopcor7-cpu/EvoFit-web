// Frases cortas usadas tanto en la tarjeta motivacional de Inicio como en
// las notificaciones del cron cuando llevas 2+ días sin entrenar — mismo
// pool para que el mensaje se sienta consistente en toda la app.
export const MOTIVATIONAL_QUOTES: string[] = [
  "Un entrenamiento corto hoy es mejor que uno perfecto que nunca haces.",
  "Tu yo de mañana te va a agradecer lo que hagas ahora.",
  "No tienes que ser perfecto, solo tienes que empezar.",
  "Cada rep cuenta. Cada día cuenta. Vamos.",
  "La constancia le gana al talento cuando el talento no entrena.",
  "Nadie se arrepiente de haber entrenado. Ve por esa racha.",
  "5 minutos de calentamiento pueden convertirse en un gran entreno.",
];

export function pickMotivationalQuote(seed: number): string {
  const index = ((seed % MOTIVATIONAL_QUOTES.length) + MOTIVATIONAL_QUOTES.length) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[index];
}

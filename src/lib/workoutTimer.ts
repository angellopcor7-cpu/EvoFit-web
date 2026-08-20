// Convierte etiquetas como "90 seg", "2 min", "20 seg x 6" o "Sin descanso"
// en segundos utilizables por un cronómetro. Etiquetas sin un número al
// inicio (p. ej. "Incluido en Tabata") devuelven null: no hay un cronómetro
// discreto que mostrar y el flujo guiado simplemente avanza.
export function parseSecondsLabel(label: string | null): number | null {
  if (!label) return null;
  const match = label.match(/(\d+)\s*(seg|min)/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  return unit === "min" ? value * 60 : value;
}

export function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

import type { MuscleGroup } from "@/lib/exercises";
import { Heart } from "lucide-react";

// Silueta simple y consistente que resalta la zona muscular trabajada por el
// ejercicio. No pretende mostrar la técnica exacta del movimiento (para eso
// se necesitarían fotos/video reales), pero le da a la persona una
// referencia visual inmediata de qué está entrenando, sin depender de
// bancos de imágenes externos ni arriesgar mostrar una forma incorrecta.
const HIGHLIGHTS: Record<Exclude<MuscleGroup, "cardio">, { cx: number; cy: number; rx: number; ry: number }[]> = {
  pecho: [{ cx: 32, cy: 22, rx: 11, ry: 7 }],
  espalda: [{ cx: 32, cy: 22, rx: 11, ry: 9 }],
  hombros: [
    { cx: 20, cy: 17, rx: 5, ry: 5 },
    { cx: 44, cy: 17, rx: 5, ry: 5 },
  ],
  biceps: [
    { cx: 17, cy: 27, rx: 4, ry: 6 },
    { cx: 47, cy: 27, rx: 4, ry: 6 },
  ],
  triceps: [
    { cx: 17, cy: 27, rx: 4, ry: 6 },
    { cx: 47, cy: 27, rx: 4, ry: 6 },
  ],
  cuadriceps: [
    { cx: 26, cy: 46, rx: 5, ry: 9 },
    { cx: 38, cy: 46, rx: 5, ry: 9 },
  ],
  isquiotibiales: [
    { cx: 26, cy: 46, rx: 5, ry: 9 },
    { cx: 38, cy: 46, rx: 5, ry: 9 },
  ],
  gluteos: [{ cx: 32, cy: 38, rx: 10, ry: 5 }],
  pantorrillas: [
    { cx: 26, cy: 58, rx: 4, ry: 6 },
    { cx: 38, cy: 58, rx: 4, ry: 6 },
  ],
  abdomen: [{ cx: 32, cy: 30, rx: 7, ry: 8 }],
};

export function MuscleIcon({
  group,
  size = 28,
  className,
}: {
  group: MuscleGroup;
  size?: number;
  className?: string;
}) {
  if (group === "cardio") {
    return <Heart size={size} className={className} />;
  }

  const highlights = HIGHLIGHTS[group];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-label={`Zona muscular: ${group}`}
    >
      {/* Silueta base */}
      <circle cx="32" cy="8" r="6" fill="currentColor" opacity="0.25" />
      <path
        d="M20 20c0-4 5-7 12-7s12 3 12 7v14c0 3-2 5-4 6l2 22c0 2-2 3-4 3h-4c-1.5 0-3-1-3-3l-1-16-1 16c0 2-1.5 3-3 3h-4c-2 0-4-1-4-3l2-22c-2-1-4-3-4-6V20z"
        fill="currentColor"
        opacity="0.25"
      />
      {/* Zona resaltada */}
      {highlights.map((h, i) => (
        <ellipse
          key={i}
          cx={h.cx}
          cy={h.cy}
          rx={h.rx}
          ry={h.ry}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

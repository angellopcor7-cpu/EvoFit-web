import {
  classifyExercisePattern,
  PATTERN_POSES,
  type FigurePose,
} from "@/lib/exercisePatterns";
import type { MuscleGroup } from "@/lib/exercises";
import type { WorkoutCategory } from "@/lib/workouts";

// Figura con cuerpo (cabeza + torso ancho + brazo + pierna con grosor de
// "cápsula", vista de lado) que se dibuja en dos posiciones — inicio y
// final del movimiento — para mostrar "cómo se hace" el ejercicio sin
// necesitar fotos reales. Ver src/lib/exercisePatterns.ts para el porqué
// de este enfoque.

const TORSO_LEN = 16;
const HEAD_R = 6.5;
const HEAD_GAP = 1.5;
const UPPER_ARM = 9;
const FOREARM = 9;
const THIGH = 12;
const SHIN = 12;

const TORSO_WIDTH = 10.5;
const LIMB_WIDTH = 6.5;
const HAND_R = 3.4;
const FOOT_R = 3.6;

function dirUp(deg: number): [number, number] {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r), -Math.cos(r)];
}
function dirDown(deg: number): [number, number] {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
}
function add(p: [number, number], d: [number, number], len: number): [number, number] {
  return [p[0] + d[0] * len, p[1] + d[1] * len];
}

function computeFigure(figurePose: FigurePose) {
  const hip = figurePose.hip;
  const shoulder = add(hip, dirUp(figurePose.torsoAngle), TORSO_LEN);
  const head = add(shoulder, dirUp(figurePose.torsoAngle), HEAD_R + HEAD_GAP);
  const elbow = add(shoulder, dirDown(figurePose.armAngle), UPPER_ARM);
  const hand = add(elbow, dirDown(figurePose.forearmAngle), FOREARM);
  const knee = add(hip, dirDown(figurePose.legAngle), THIGH);
  const foot = add(knee, dirDown(figurePose.shinAngle), SHIN);
  return { hip, shoulder, head, elbow, hand, knee, foot };
}

function Figure({
  figurePose,
  color,
  limbColor,
  offsetX,
}: {
  figurePose: FigurePose;
  color: string;
  limbColor: string;
  offsetX: number;
}) {
  const f = computeFigure(figurePose);
  const pts = (a: [number, number], b: [number, number], c?: [number, number]) =>
    c ? `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}` : `${a[0]},${a[1]} ${b[0]},${b[1]}`;
  return (
    <g transform={`translate(${offsetX}, 0)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* pierna y brazo (más delgados, "detrás" del torso) */}
      <polyline points={pts(f.hip, f.knee, f.foot)} stroke={limbColor} strokeWidth={LIMB_WIDTH} />
      <polyline points={pts(f.shoulder, f.elbow, f.hand)} stroke={limbColor} strokeWidth={LIMB_WIDTH} />
      {/* mano y pie: bultos redondeados al final de cada extremidad */}
      <circle cx={f.hand[0]} cy={f.hand[1]} r={HAND_R} fill={limbColor} stroke="none" />
      <circle cx={f.foot[0]} cy={f.foot[1]} r={FOOT_R} fill={limbColor} stroke="none" />
      {/* torso: cápsula ancha */}
      <polyline points={pts(f.shoulder, f.hip)} stroke={color} strokeWidth={TORSO_WIDTH} />
      {/* cabeza */}
      <circle cx={f.head[0]} cy={f.head[1]} r={HEAD_R} fill={color} stroke="none" />
    </g>
  );
}

const FIGURE_WIDTH = 60;
const FIGURE_HEIGHT = 68;
const GAP = 16;
const VIEW_WIDTH = FIGURE_WIDTH * 2 + GAP;

export function ExercisePoseIcon({
  exerciseName,
  muscleGroup,
  categoryHint,
  width = 118,
  height,
  className,
}: {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  categoryHint?: WorkoutCategory;
  width?: number;
  height?: number;
  className?: string;
}) {
  const pattern = classifyExercisePattern(exerciseName, muscleGroup, categoryHint);
  const { start, end } = PATTERN_POSES[pattern];
  const computedHeight = height ?? Math.round((width * FIGURE_HEIGHT) / VIEW_WIDTH);

  const arrowY = FIGURE_HEIGHT / 2 - 4;
  const arrowX1 = FIGURE_WIDTH + 2;
  const arrowX2 = FIGURE_WIDTH + GAP - 2;

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${FIGURE_HEIGHT}`}
      width={width}
      height={computedHeight}
      className={className}
      role="img"
      aria-label={`Movimiento de ${exerciseName}: inicio y final`}
    >
      <Figure
        figurePose={start}
        color="var(--muted-foreground)"
        limbColor="color-mix(in srgb, var(--muted-foreground) 78%, transparent)"
        offsetX={0}
      />
      <g stroke="var(--muted-foreground)" strokeWidth={1.4} opacity={0.55}>
        <line x1={arrowX1} y1={arrowY} x2={arrowX2 - 3} y2={arrowY} strokeDasharray="2 2" />
        <polygon points={`${arrowX2 - 4},${arrowY - 3} ${arrowX2},${arrowY} ${arrowX2 - 4},${arrowY + 3}`} fill="var(--muted-foreground)" stroke="none" />
      </g>
      <Figure
        figurePose={end}
        color="var(--primary)"
        limbColor="color-mix(in srgb, var(--primary) 78%, transparent)"
        offsetX={FIGURE_WIDTH + GAP}
      />
    </svg>
  );
}

"use client";

import Link from "next/link";
import {
  Flame,
  TrendingUp,
  Dumbbell,
  ArrowRight,
  Utensils,
  RefreshCw,
  Check,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthSession } from "@/hooks/useProfile";
import { useDietPlan } from "@/hooks/useDietPlan";
import { useWorkoutStats } from "@/hooks/useWorkoutCompletions";
import { useWeeklyPlan } from "@/hooks/useWeeklyPlan";
import { useWorkoutRoutines } from "@/hooks/useWorkoutRoutines";
import { useUserRoutines } from "@/hooks/useUserRoutines";
import { DIET_GOAL_LABEL } from "@/lib/diet";
import { formatPlannedTime, type WeeklyPlanEntry } from "@/lib/weeklyPlan";
import {
  isSessionCategory,
  toEntrenamientosUiCategory,
  WORKOUT_CATEGORY_LABEL,
  type WorkoutRoutine,
} from "@/lib/workouts";
import { MUSCLE_GROUP_LABEL } from "@/lib/exercises";
import type { UserRoutine } from "@/lib/userRoutines";
import { pickMotivationalQuote } from "@/lib/motivation";
import styles from "./page.module.css";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

type TodayPlan = {
  title: string;
  focusLabel: string;
  plannedTime: string | null;
  href: string;
};

function computeTodayPlan(
  entry: WeeklyPlanEntry | undefined,
  allRoutines: WorkoutRoutine[],
  myRoutines: UserRoutine[],
): TodayPlan | null {
  if (!entry) return null;

  if (entry.userRoutineId) {
    const routine = myRoutines.find((r) => r.id === entry.userRoutineId);
    if (!routine) return null;
    const groups = Array.from(new Set(routine.exercises.map((e) => e.muscleGroup)));
    return {
      title: routine.title,
      focusLabel:
        groups.map((g) => MUSCLE_GROUP_LABEL[g]).join(", ") || "Tu rutina",
      plannedTime: formatPlannedTime(entry.plannedTime) || null,
      href: `/entrenamientos?routine=${routine.id}&type=propia`,
    };
  }

  const routine = allRoutines.find((r) => r.id === entry.workoutRoutineId);
  if (!routine) return null;
  const focusLabel = isSessionCategory(routine.category)
    ? WORKOUT_CATEGORY_LABEL[routine.category]
    : Array.from(new Set(routine.exercises.map((e) => e.muscleGroup)))
        .map((g) => MUSCLE_GROUP_LABEL[g])
        .join(", ");

  return {
    title: routine.title,
    focusLabel,
    plannedTime: formatPlannedTime(entry.plannedTime) || null,
    href: `/entrenamientos?category=${toEntrenamientosUiCategory(routine.category)}&routine=${routine.id}&type=predef`,
  };
}

export default function HomePage() {
  const { data } = useAuthSession();
  const profile = data?.profile;
  const { data: dietData } = useDietPlan();
  const dietPlan = dietData?.plan ?? null;
  const { data: stats } = useWorkoutStats();
  const { data: planData } = useWeeklyPlan();
  const { data: routinesData } = useWorkoutRoutines();
  const { data: userRoutinesData } = useUserRoutines();

  const trainedToday = profile?.lastActiveDate === todayStr();

  const planEntries = planData?.entries ?? [];
  const hasAnyPlan = planEntries.length > 0;
  const todayEntry = planEntries.find((e) => e.dayOfWeek === new Date().getDay());
  const todayPlan = computeTodayPlan(
    todayEntry,
    routinesData?.routines ?? [],
    userRoutinesData?.routines ?? [],
  );

  const daysSinceLastActive = profile?.lastActiveDate
    ? Math.floor(
        (Date.now() - new Date(`${profile.lastActiveDate}T00:00:00Z`).getTime()) /
          86_400_000,
      )
    : Infinity;
  const showMotivation = !trainedToday && daysSinceLastActive >= 2;

  return (
    <div className={styles.page}>
      <div>
        <p className={styles.eyebrow}>Bienvenido de vuelta</p>
        <h1 className={styles.name}>{profile?.displayName ?? "Atleta"}</h1>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.stat}>
          <Flame size={18} className={styles.statIconStreak} />
          <span className={styles.statValue}>
            {profile?.currentStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Racha</span>
        </div>
        <div className={styles.stat}>
          <TrendingUp size={18} className={styles.statIconBest} />
          <span className={styles.statValue}>
            {profile?.longestStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Mejor racha</span>
        </div>
        <div className={styles.stat}>
          <Dumbbell size={18} className={styles.statIconWorkouts} />
          <span className={styles.statValue}>{stats?.totalCount ?? 0}</span>
          <span className={styles.statLabel}>Entrenos</span>
        </div>
      </div>

      {showMotivation && (
        <div className={styles.motivationCard}>
          <Flame size={18} className={styles.motivationIcon} />
          <p className={styles.motivationText}>
            {pickMotivationalQuote(new Date().getDate())}
          </p>
        </div>
      )}

      <div className={styles.ctaCard}>
        <div>
          <p className={styles.ctaEyebrow}>Hoy</p>
          {trainedToday ? (
            <p className={styles.ctaTitle}>¡Ya entrenaste hoy! Sigue así</p>
          ) : todayPlan ? (
            <>
              <p className={styles.ctaTitle}>Hoy toca: {todayPlan.focusLabel}</p>
              <p className={styles.ctaSubtitle}>
                {todayPlan.title}
                {todayPlan.plannedTime ? ` · ${todayPlan.plannedTime}` : ""}
              </p>
            </>
          ) : hasAnyPlan ? (
            <p className={styles.ctaTitle}>Hoy es tu día de descanso</p>
          ) : (
            <p className={styles.ctaTitle}>
              Aún no tienes un entrenamiento registrado
            </p>
          )}
        </div>
        {trainedToday ? (
          <Button asChild variant="outline" className={styles.ctaButton}>
            <Link href="/progreso">
              <Check size={16} /> Progreso
            </Link>
          </Button>
        ) : todayPlan ? (
          <Button asChild className={styles.ctaButton}>
            <Link href={todayPlan.href}>
              Empezar <ArrowRight size={16} />
            </Link>
          </Button>
        ) : (
          <Button asChild className={styles.ctaButton}>
            <Link href="/entrenamientos">
              Empezar <ArrowRight size={16} />
            </Link>
          </Button>
        )}
      </div>

      <Link href="/plan" className={styles.planLink}>
        <CalendarDays size={14} />
        {hasAnyPlan ? "Editar tu plan semanal" : "Arma tu plan semanal"}
      </Link>

      <p className={styles.note}>
        Cada entrenamiento que completes mantiene tu racha viva.
      </p>

      <Link href="/dieta" className={styles.dietCard}>
        <div className={styles.dietCardIcon}>
          {dietPlan ? <RefreshCw size={22} /> : <Utensils size={22} />}
        </div>
        <div className={styles.dietCardInfo}>
          <p className={styles.dietCardEyebrow}>Nutrición</p>
          {dietPlan ? (
            <>
              <p className={styles.dietCardTitle}>
                {DIET_GOAL_LABEL[dietPlan.goal]} · {dietPlan.targetKcal} kcal/día
              </p>
              <p className={styles.dietCardSubtitle}>
                Ver tu menú de hoy y macros
              </p>
            </>
          ) : (
            <>
              <p className={styles.dietCardTitle}>Arma tu dieta</p>
              <p className={styles.dietCardSubtitle}>
                Calcula tus calorías y macros con un menú real
              </p>
            </>
          )}
        </div>
        <ArrowRight size={18} className={styles.dietCardArrow} />
      </Link>
    </div>
  );
}

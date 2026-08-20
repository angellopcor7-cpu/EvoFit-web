"use client";

import Link from "next/link";
import { Flame, TrendingUp, Dumbbell, ArrowRight, Utensils, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthSession } from "@/hooks/useProfile";
import { useDietPlan } from "@/hooks/useDietPlan";
import { useWorkoutStats } from "@/hooks/useWorkoutCompletions";
import { DIET_GOAL_LABEL } from "@/lib/diet";
import styles from "./page.module.css";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const { data } = useAuthSession();
  const profile = data?.profile;
  const { data: dietData } = useDietPlan();
  const dietPlan = dietData?.plan ?? null;
  const { data: stats } = useWorkoutStats();

  const trainedToday = profile?.lastActiveDate === todayStr();

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

      <div className={styles.ctaCard}>
        <div>
          <p className={styles.ctaEyebrow}>Hoy</p>
          <p className={styles.ctaTitle}>
            {trainedToday
              ? "¡Ya entrenaste hoy! Sigue así"
              : "Aún no tienes un entrenamiento registrado"}
          </p>
        </div>
        {trainedToday ? (
          <Button asChild variant="outline" className={styles.ctaButton}>
            <Link href="/progreso">
              <Check size={16} /> Progreso
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

      <p className={styles.note}>
        Cada entrenamiento que completes mantiene tu racha viva.
      </p>

      <Link href="/dieta" className={styles.dietCard}>
        <div className={styles.dietCardIcon}>
          {dietPlan ? <RefreshCw size={20} /> : <Utensils size={20} />}
        </div>
        <div className={styles.dietCardInfo}>
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

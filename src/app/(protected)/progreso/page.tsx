"use client";

import { Flame, Dumbbell, TrendingUp } from "lucide-react";
import { useAuthSession } from "@/hooks/useProfile";
import { useWorkoutStats } from "@/hooks/useWorkoutCompletions";
import { Progress } from "@/components/ui/Progress";
import { WORKOUT_CATEGORY_LABEL } from "@/lib/workouts";
import styles from "./page.module.css";

function relativeDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const dateOnly = date.toISOString().slice(0, 10);
  const todayOnly = today.toISOString().slice(0, 10);
  const yesterdayOnly = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  if (dateOnly === todayOnly) return "Hoy";
  if (dateOnly === yesterdayOnly) return "Ayer";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function ProgresoPage() {
  const { data } = useAuthSession();
  const profile = data?.profile;
  const { data: stats, isLoading } = useWorkoutStats();

  const last7Days = stats?.last7Days ?? [];
  const maxDayCount = Math.max(1, ...last7Days.map((d) => d.count));
  const categoryBreakdown = stats?.categoryBreakdown ?? [];
  const maxCategoryCount = Math.max(1, ...categoryBreakdown.map((c) => c.count));
  const recent = stats?.recent ?? [];
  const hasActivity = (stats?.totalCount ?? 0) > 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tu progreso</h1>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Flame size={18} className={styles.statIconStreak} />
          <span className={styles.statValue}>
            {profile?.currentStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Racha actual</span>
        </div>
        <div className={styles.statCard}>
          <TrendingUp size={18} className={styles.statIconBest} />
          <span className={styles.statValue}>
            {profile?.longestStreak ?? 0}
          </span>
          <span className={styles.statLabel}>Mejor racha</span>
        </div>
        <div className={styles.statCard}>
          <Dumbbell size={18} className={styles.statIconWorkouts} />
          <span className={styles.statValue}>{stats?.totalCount ?? 0}</span>
          <span className={styles.statLabel}>Entrenamientos</span>
        </div>
      </div>

      <div className={styles.chartCard}>
        <p className={styles.chartTitle}>Actividad de la semana</p>
        <div className={styles.bars}>
          {last7Days.map((entry) => (
            <div key={entry.date} className={styles.barColumn}>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    height: `${entry.count === 0 ? 0 : Math.max(10, (entry.count / maxDayCount) * 100)}%`,
                  }}
                />
              </div>
              <span className={styles.barLabel}>{entry.label}</span>
            </div>
          ))}
        </div>
      </div>

      {categoryBreakdown.length > 0 && (
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>Por categoría (últimos 30 días)</p>
          <div className={styles.categoryList}>
            {categoryBreakdown.map((entry) => (
              <div key={entry.category} className={styles.categoryRow}>
                <div className={styles.categoryRowHeader}>
                  <span className={styles.categoryName}>
                    {WORKOUT_CATEGORY_LABEL[entry.category]}
                  </span>
                  <span className={styles.categoryCount}>{entry.count}</span>
                </div>
                <Progress value={(entry.count / maxCategoryCount) * 100} />
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>Actividad reciente</p>
          <div className={styles.recentList}>
            {recent.map((completion) => (
              <div key={completion.id} className={styles.recentRow}>
                <div className={styles.recentIcon}>
                  <Dumbbell size={16} />
                </div>
                <div className={styles.recentInfo}>
                  <p className={styles.recentTitle}>{completion.routineTitle}</p>
                  <p className={styles.recentMeta}>
                    {WORKOUT_CATEGORY_LABEL[completion.category]}
                  </p>
                </div>
                <span className={styles.recentDate}>
                  {relativeDate(completion.completedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !hasActivity && (
        <p className={styles.note}>
          Completa entrenamientos para ver aquí tu evolución real.
        </p>
      )}
    </div>
  );
}

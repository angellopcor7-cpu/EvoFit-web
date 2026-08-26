"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Dumbbell, TrendingUp, CalendarDays } from "lucide-react";
import { useAuthSession, useMarkTutorialSeen } from "@/hooks/useProfile";
import { useWorkoutStats } from "@/hooks/useWorkoutCompletions";
import { Progress } from "@/components/ui/Progress";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
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

// Lunes=0 ... Domingo=6, para alinear el primer día del mes en la cuadrícula.
function mondayFirstWeekday(dateStr: string): number {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return (day + 6) % 7;
}

// Intensidad de la celda del calendario según cuántos entrenos tuvo ese día
// (un solo hue, más oscuro = más entrenos) — nunca color como único indicador,
// ya que el número de entrenos también se muestra en el título del día.
function calendarCellIntensity(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return styles.calendarDayLight ?? "";
  return styles.calendarDayStrong ?? "";
}

export default function ProgresoPage() {
  const { data } = useAuthSession();
  const profile = data?.profile;
  const { data: stats, isLoading } = useWorkoutStats();
  const markTutorialSeen = useMarkTutorialSeen("progreso");

  const [tourOpen, setTourOpen] = useState(false);
  const [tourDismissedThisVisit, setTourDismissedThisVisit] = useState(false);
  const statsGridRef = useRef<HTMLDivElement>(null);
  const weekCardRef = useRef<HTMLDivElement>(null);
  const calendarCardRef = useRef<HTMLDivElement>(null);

  const last7Days = stats?.last7Days ?? [];
  const maxDayCount = Math.max(1, ...last7Days.map((d) => d.count));
  const categoryBreakdown = stats?.categoryBreakdown ?? [];
  const maxCategoryCount = Math.max(1, ...categoryBreakdown.map((c) => c.count));
  const recent = stats?.recent ?? [];
  const hasActivity = (stats?.totalCount ?? 0) > 0;

  const calendarDays = stats?.calendarDays ?? [];
  const leadingBlanks = calendarDays.length > 0 ? mondayFirstWeekday(calendarDays[0].date) : 0;

  useEffect(() => {
    if (isLoading) return;
    if (!profile) return;
    if (profile.hasSeenProgresoTutorial) return;
    if (tourDismissedThisVisit) return;
    const timeout = setTimeout(() => setTourOpen(true), 300);
    return () => clearTimeout(timeout);
  }, [isLoading, profile, tourDismissedThisVisit]);

  const closeTour = () => {
    setTourOpen(false);
    setTourDismissedThisVisit(true);
  };

  const handleTourFinish = () => closeTour();
  const handleTourNeverShowAgain = () => {
    closeTour();
    markTutorialSeen.mutate();
  };

  const tourSteps: TourStep[] = [
    {
      ref: statsGridRef,
      title: "Tus números clave",
      description:
        "Aquí ves tu racha actual, tu mejor racha y el total de entrenamientos completados.",
    },
    {
      ref: weekCardRef,
      title: "Tu semana",
      description:
        "Esta gráfica muestra cuántos entrenamientos hiciste cada día, de lunes a domingo.",
    },
    {
      ref: calendarCardRef,
      title: "Tu calendario",
      description:
        "Cada día marcado es un día en que entrenaste. Entre más oscuro, más entrenos ese día.",
    },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tu progreso</h1>

      <div className={styles.statsGrid} ref={statsGridRef}>
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

      <div className={styles.chartCard} ref={weekCardRef}>
        <p className={styles.chartTitle}>Semana (lunes a domingo)</p>
        <div className={styles.bars}>
          {last7Days.map((entry) => (
            <div key={entry.date} className={styles.barColumn}>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${entry.isToday ? styles.barFillToday : ""}`}
                  style={{
                    height: `${entry.count === 0 ? 0 : Math.max(10, (entry.count / maxDayCount) * 100)}%`,
                  }}
                  title={`${entry.count} entreno${entry.count === 1 ? "" : "s"}`}
                />
              </div>
              <span className={`${styles.barLabel} ${entry.isToday ? styles.barLabelToday : ""}`}>
                {entry.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chartCard} ref={calendarCardRef}>
        <div className={styles.calendarHeader}>
          <CalendarDays size={16} className={styles.calendarIcon} />
          <p className={styles.chartTitle}>
            {stats?.calendarMonthLabel
              ? stats.calendarMonthLabel.charAt(0).toUpperCase() + stats.calendarMonthLabel.slice(1)
              : "Calendario"}
          </p>
        </div>
        <div className={styles.calendarWeekdays}>
          {["L", "M", "M", "J", "V", "S", "D"].map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
        <div className={styles.calendarGrid}>
          {Array.from({ length: leadingBlanks }).map((_, index) => (
            <div key={`blank-${index}`} className={styles.calendarBlank} />
          ))}
          {calendarDays.map((day) => (
            <div
              key={day.date}
              className={`${styles.calendarDay} ${calendarCellIntensity(day.count)} ${day.isToday ? styles.calendarDayToday : ""}`}
              title={`${day.count} entreno${day.count === 1 ? "" : "s"}`}
            >
              {day.dayOfMonth}
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

      {tourOpen && (
        <SpotlightTour
          steps={tourSteps}
          onFinish={handleTourFinish}
          onNeverShowAgain={handleTourNeverShowAgain}
        />
      )}
    </div>
  );
}

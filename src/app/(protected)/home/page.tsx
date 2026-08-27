"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  useAuthSession,
  useMarkHomeTutorialSeen,
} from "@/hooks/useProfile";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { useDietPlan } from "@/hooks/useDietPlan";
import { useWorkoutStats } from "@/hooks/useWorkoutCompletions";
import { useWeeklyPlan } from "@/hooks/useWeeklyPlan";
import { useWorkoutRoutines } from "@/hooks/useWorkoutRoutines";
import { useUserRoutines } from "@/hooks/useUserRoutines";
import { DIET_GOAL_LABEL, DIET_MEAL_SLOT_LABEL, getCurrentMealSlot } from "@/lib/diet";
import {
  computeDayRoutinePlan,
  DAY_ORDER,
  DAY_OF_WEEK_SHORT,
} from "@/lib/weeklyPlan";
import { pickMotivationalQuote } from "@/lib/motivation";
import styles from "./page.module.css";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const { data } = useAuthSession();
  const profile = data?.profile;
  const markHomeTutorialSeen = useMarkHomeTutorialSeen();
  const { data: dietData } = useDietPlan();
  const dietPlan = dietData?.plan ?? null;
  const { data: stats } = useWorkoutStats();
  const { data: planData } = useWeeklyPlan();
  const { data: routinesData } = useWorkoutRoutines();
  const { data: userRoutinesData } = useUserRoutines();

  const [tourOpen, setTourOpen] = useState(false);
  const [tourDismissedThisVisit, setTourDismissedThisVisit] = useState(false);
  const statsCardRef = useRef<HTMLDivElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const planLinkRef = useRef<HTMLAnchorElement>(null);
  const dietCardRef = useRef<HTMLAnchorElement>(null);
  const [currentMealSlot, setCurrentMealSlot] = useState<
    "desayuno" | "comida" | "cena" | null
  >(null);

  useEffect(() => {
    setCurrentMealSlot(getCurrentMealSlot(new Date()));
    const interval = setInterval(() => {
      setCurrentMealSlot(getCurrentMealSlot(new Date()));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const trainedToday = profile?.lastActiveDate === todayStr();

  const allRoutines = routinesData?.routines ?? [];
  const myRoutines = userRoutinesData?.routines ?? [];

  const planEntries = planData?.entries ?? [];
  const hasAnyPlan = planEntries.length > 0;
  const todayDow = new Date().getDay();
  const todayEntry = planEntries.find((e) => e.dayOfWeek === todayDow);
  const todayPlan = computeDayRoutinePlan(todayEntry, allRoutines, myRoutines);

  const weekRows = DAY_ORDER.map((dayOfWeek) => {
    const entry = planEntries.find((e) => e.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isToday: dayOfWeek === todayDow,
      plan: computeDayRoutinePlan(entry, allRoutines, myRoutines),
    };
  });

  const daysSinceLastActive = profile?.lastActiveDate
    ? Math.floor(
        (Date.now() - new Date(`${profile.lastActiveDate}T00:00:00Z`).getTime()) /
          86_400_000,
      )
    : Infinity;
  const showMotivation = !trainedToday && daysSinceLastActive >= 2;

  useEffect(() => {
    if (!profile) return;
    if (!profile.hasSeenWelcome || !profile.hasCompletedOnboarding) return;
    if (profile.hasSeenHomeTutorial) return;
    if (tourDismissedThisVisit) return;
    const timeout = setTimeout(() => setTourOpen(true), 300);
    return () => clearTimeout(timeout);
  }, [profile, tourDismissedThisVisit]);

  const closeTour = () => {
    setTourOpen(false);
    setTourDismissedThisVisit(true);
  };

  const handleTourFinish = () => closeTour();
  const handleTourNeverShowAgain = () => {
    closeTour();
    markHomeTutorialSeen.mutate();
  };

  const tourSteps: TourStep[] = [
    {
      ref: statsCardRef,
      title: "Tu racha de entrenos",
      description:
        "Aquí ves tu racha actual, tu mejor racha y el total de entrenamientos que has completado.",
    },
    {
      ref: ctaCardRef,
      title: "Lo que te toca hoy",
      description:
        "Esta tarjeta te dice qué te toca entrenar hoy según tu plan semanal, o te deja empezar directo.",
    },
    {
      ref: planLinkRef,
      title: "Tu plan semanal",
      description:
        "Aquí armas o editas qué rutina te toca cada día de la semana, para que aparezca aquí automáticamente.",
    },
    {
      ref: dietCardRef,
      title: "Tu nutrición",
      description:
        "Aquí armas tu plan de alimentación o revisas tu menú y macros del día.",
    },
  ];

  return (
    <div className={styles.page}>
      <div>
        <p className={styles.eyebrow}>Bienvenido de vuelta</p>
        <h1 className={styles.name}>{profile?.displayName ?? "Atleta"}</h1>
      </div>

      <div className={styles.statsCard} ref={statsCardRef}>
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

      <div className={styles.ctaCard} ref={ctaCardRef}>
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

      {hasAnyPlan && (
        <div className={styles.weekList}>
          {weekRows.map(({ dayOfWeek, isToday, plan }) => {
            const rowClassName = `${styles.weekRow} ${
              isToday ? styles.weekRowToday : styles.weekRowDimmed
            }`;
            const rowContent = (
              <>
                <span className={styles.weekDay}>
                  {DAY_OF_WEEK_SHORT[dayOfWeek]}
                  {isToday && <span className={styles.weekTodayBadge}>Hoy</span>}
                </span>
                {plan ? (
                  <span className={styles.weekInfo}>
                    <span className={styles.weekFocus}>{plan.focusLabel}</span>
                    <span className={styles.weekTitle}>
                      {plan.title}
                      {plan.plannedTime ? ` · ${plan.plannedTime}` : ""}
                    </span>
                  </span>
                ) : (
                  <span className={styles.weekRest}>Descanso</span>
                )}
              </>
            );
            return plan ? (
              <Link key={dayOfWeek} href={plan.href} className={rowClassName}>
                {rowContent}
              </Link>
            ) : (
              <div key={dayOfWeek} className={rowClassName}>
                {rowContent}
              </div>
            );
          })}
        </div>
      )}

      <Link href="/plan" className={styles.planLink} ref={planLinkRef}>
        <CalendarDays size={14} />
        {hasAnyPlan ? "Editar tu plan semanal" : "Arma tu plan semanal"}
      </Link>

      <p className={styles.note}>
        Cada entrenamiento que completes mantiene tu racha viva.
      </p>

      <Link href="/dieta" className={styles.dietCard} ref={dietCardRef}>
        <div className={styles.dietCardIcon}>
          {dietPlan ? <RefreshCw size={22} /> : <Utensils size={22} />}
        </div>
        <div className={styles.dietCardInfo}>
          {dietPlan ? (
            (() => {
              const currentMeal = currentMealSlot
                ? dietPlan.meals.find((m) => m.mealSlot === currentMealSlot)
                : null;
              return (
                <>
                  <p className={styles.dietCardEyebrow}>
                    {currentMealSlot
                      ? `Te toca: ${DIET_MEAL_SLOT_LABEL[currentMealSlot]}`
                      : "Nutrición"}
                  </p>
                  {currentMeal ? (
                    <>
                      <p className={styles.dietCardTitle}>{currentMeal.name}</p>
                      <p className={styles.dietCardSubtitle}>
                        {currentMeal.kcal} kcal · P {currentMeal.proteinG}g · C{" "}
                        {currentMeal.carbsG}g · G {currentMeal.fatG}g
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={styles.dietCardTitle}>
                        {DIET_GOAL_LABEL[dietPlan.goal]} · {dietPlan.targetKcal} kcal/día
                      </p>
                      <p className={styles.dietCardSubtitle}>
                        Ver tu menú de hoy y macros
                      </p>
                    </>
                  )}
                </>
              );
            })()
          ) : (
            <>
              <p className={styles.dietCardEyebrow}>Nutrición</p>
              <p className={styles.dietCardTitle}>Arma tu dieta</p>
              <p className={styles.dietCardSubtitle}>
                Calcula tus calorías y macros con un menú real
              </p>
            </>
          )}
        </div>
        <ArrowRight size={18} className={styles.dietCardArrow} />
      </Link>

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

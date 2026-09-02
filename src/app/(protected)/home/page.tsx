"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Flame,
  TrendingUp,
  Dumbbell,
  ArrowRight,
  Utensils,
  RefreshCw,
  Check,
  CalendarDays,
  Clock3,
  ShoppingCart,
  ChevronRight,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  useAuthSession,
  useMarkHomeTutorialSeen,
} from "@/hooks/useProfile";
import { SpotlightTour, type TourStep } from "@/components/SpotlightTour";
import { useDietPlan, useWeeklyShoppingList } from "@/hooks/useDietPlan";
import { useWorkoutStats } from "@/hooks/useWorkoutCompletions";
import { useWeeklyPlan } from "@/hooks/useWeeklyPlan";
import { useWorkoutRoutines } from "@/hooks/useWorkoutRoutines";
import { useUserRoutines } from "@/hooks/useUserRoutines";
import {
  DIET_GOAL_LABEL,
  DIET_MEAL_SLOT_LABEL,
  CURRENT_SLOT_LABEL,
  getCurrentMealSlot,
} from "@/lib/diet";
import { notifyLocal } from "@/lib/localNotify";
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
  const { data: shoppingListData } = useWeeklyShoppingList(dietPlan?.id);
  const { data: stats } = useWorkoutStats();
  const { data: planData } = useWeeklyPlan();
  const { data: routinesData } = useWorkoutRoutines();
  const { data: userRoutinesData } = useUserRoutines();

  const [tourOpen, setTourOpen] = useState(false);
  const [tourDismissedThisVisit, setTourDismissedThisVisit] = useState(false);
  const statsCardRef = useRef<HTMLDivElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);
  const planLinkRef = useRef<HTMLAnchorElement>(null);
  const mealsWeekRef = useRef<HTMLDivElement>(null);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [currentMealSlot, setCurrentMealSlot] = useState<
    "desayuno" | "comida" | "cena" | "ayuno" | null
  >(null);
  const fastingMode = profile?.fastingMode ?? false;
  const fastingEndTime = profile?.fastingEndTime ?? "12:00";

  useEffect(() => {
    setCurrentMealSlot(getCurrentMealSlot(new Date(), fastingMode, fastingEndTime));
    const interval = setInterval(() => {
      setCurrentMealSlot(getCurrentMealSlot(new Date(), fastingMode, fastingEndTime));
    }, 60_000);
    return () => clearInterval(interval);
  }, [fastingMode, fastingEndTime]);

  // Avisa cuando empieza cada comida (desayuno/comida/cena) mientras la
  // app está abierta — solo una vez por comida por día (se guarda en
  // localStorage). No es una notificación push real, así que solo llega
  // si tienes EvoFit abierto en ese momento.
  useEffect(() => {
    if (!currentMealSlot || currentMealSlot === "ayuno") return;
    if (typeof window === "undefined") return;
    const key = `evofit-meal-notify-${todayStr()}-${currentMealSlot}`;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
    const label = CURRENT_SLOT_LABEL[currentMealSlot];
    notifyLocal(
      `¡Ha comenzado tu ${label.toLowerCase()}! 🍽️`,
      "Abre EvoFit para ver tu menú de hoy.",
    );
  }, [currentMealSlot]);

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

  const weeklyMeals = shoppingListData?.meals ?? [];
  const mealsWeekRows = DAY_ORDER.map((dayOfWeek) => {
    const dayMeals = weeklyMeals
      .filter((m) => m.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    return { dayOfWeek, isToday: dayOfWeek === todayDow, meals: dayMeals };
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

  const handleShareShoppingList = async () => {
    const items = shoppingListData?.items ?? [];
    if (items.length === 0) return;
    const text =
      "🛒 Lista de compras de la semana — EvoFit\n\n" +
      items.map((item) => `• ${item.name}${item.amount ? ` (${item.amount})` : ""}`).join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Lista de compras — EvoFit", text });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lista copiada al portapapeles");
    } catch {
      // sin más opciones disponibles
    }
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
      ref: mealsWeekRef,
      title: "Tu nutrición",
      description:
        "Aquí ves tu menú de la semana. Toca el carrito para ver tu lista de compras con todos los ingredientes.",
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

      {weeklyMeals.length > 0 && (
        <div className={styles.mealsWeekSection} ref={mealsWeekRef}>
          <div className={styles.mealsWeekHeader}>
            <p className={styles.mealsWeekTitle}>Tu semana de comidas</p>
            {shoppingListData && shoppingListData.items.length > 0 && (
              <button
                type="button"
                className={styles.shoppingIconButton}
                onClick={() => setShoppingListOpen(true)}
                aria-label="Ver lista de compras"
              >
                <ShoppingCart size={15} />
                <span className={styles.shoppingIconButtonCount}>
                  {shoppingListData.items.length}
                </span>
              </button>
            )}
          </div>
          <div className={styles.mealsWeekList}>
            {mealsWeekRows.map(({ dayOfWeek, isToday, meals }) => (
              <div
                key={dayOfWeek}
                className={`${styles.mealsWeekRow} ${
                  isToday ? styles.mealsWeekRowToday : styles.mealsWeekRowDimmed
                }`}
              >
                <span className={styles.mealsWeekDay}>
                  {DAY_OF_WEEK_SHORT[dayOfWeek]}
                  {isToday && <span className={styles.weekTodayBadge}>Hoy</span>}
                </span>
                <span className={styles.mealsWeekDishes}>
                  {meals.map((m) => (
                    <span key={m.id} className={styles.mealsWeekDish}>
                      <span className={styles.mealsWeekSlotLabel}>
                        {DIET_MEAL_SLOT_LABEL[m.mealSlot]}:
                      </span>{" "}
                      {m.name}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tourOpen && (
        <SpotlightTour
          steps={tourSteps}
          onFinish={handleTourFinish}
          onNeverShowAgain={handleTourNeverShowAgain}
        />
      )}

      <Dialog open={shoppingListOpen} onOpenChange={setShoppingListOpen}>
        <DialogContent>
          <DialogHeader>
            <div className={styles.shoppingListDialogHeaderRow}>
              <DialogTitle className={styles.shoppingListDialogTitle}>
                <ShoppingCart size={18} /> Lista de compras de la semana
              </DialogTitle>
              <button
                type="button"
                className={styles.shoppingListShareButton}
                onClick={handleShareShoppingList}
                aria-label="Compartir lista de compras"
              >
                <Share2 size={16} />
              </button>
            </div>
            <DialogDescription>
              Ingredientes de todas tus comidas de domingo a sábado.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.shoppingListDialogItems}>
            {(shoppingListData?.items ?? []).map((item) => (
              <div key={item.name} className={styles.shoppingListDialogItem}>
                <span className={styles.shoppingListDialogItemName}>{item.name}</span>
                {item.amount && (
                  <span className={styles.shoppingListDialogItemAmount}>{item.amount}</span>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

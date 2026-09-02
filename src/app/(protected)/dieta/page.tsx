"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Flame, Beef, Wheat, Droplet, ShieldAlert, Clock3, ShoppingCart, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import { useDietPlan, useCreateDietPlan, useRegenerateDietPlan, useWeeklyShoppingList } from "@/hooks/useDietPlan";
import { useAuthSession } from "@/hooks/useProfile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  DIET_GOALS,
  DIET_GOAL_LABEL,
  DIET_STYLES,
  DIET_STYLE_LABEL,
  DIET_BUDGETS,
  DIET_BUDGET_LABEL,
  DIET_MEAL_SLOT_LABEL,
  CURRENT_SLOT_LABEL,
  DIET_PROTEIN_TYPES,
  DIET_PROTEIN_TYPE_LABEL,
  getCurrentMealSlot,
  getWeekStartDate,
  type DietGoal,
  type DietStyle,
  type DietBudget,
  type DietProteinType,
} from "@/lib/diet";
import {
  ACTIVITY_LEVELS,
  ACTIVITY_LEVEL_LABEL,
  type ActivityLevel,
  type Sex as DietSex,
} from "@/lib/dietCalculations";
import styles from "./page.module.css";

type Step = "meta" | "resultado";

// Los datos corporales del onboarding usan hombre/mujer/no_binario; los
// cálculos de macros de dieta usan masculino/femenino. "no_binario" se
// aproxima con la fórmula masculina, que es el estimador neutro más común.
function toDietSex(sex: "hombre" | "mujer" | "no_binario"): DietSex {
  return sex === "mujer" ? "femenino" : "masculino";
}

export default function DietaPage() {
  const { data, isLoading } = useDietPlan();
  const { data: sessionData } = useAuthSession();
  const createPlan = useCreateDietPlan();
  const regeneratePlan = useRegenerateDietPlan();
  const profile = sessionData?.profile ?? null;
  const allergies = profile?.allergies?.trim() || null;
  const { data: shoppingListData } = useWeeklyShoppingList(data?.plan?.id);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [expandedPrepIds, setExpandedPrepIds] = useState<Set<string>>(new Set());
  const isSunday = new Date().getDay() === 0;

  const [step, setStep] = useState<Step | null>(null);
  const [goal, setGoal] = useState<DietGoal | null>(null);
  const [dietStyle, setDietStyle] = useState<DietStyle | null>(null);
  const [budget, setBudget] = useState<DietBudget | null>(null);
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
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderado");
  const [proteinPreferences, setProteinPreferences] = useState<DietProteinType[]>([]);

  useEffect(() => {
    if (step === null && data !== undefined) {
      setStep(data.plan ? "resultado" : "meta");
    }
  }, [data, step]);

  // Cada semana (domingo), al abrir la pantalla, se regenera el menú
  // completo automáticamente — solo si todavía no se regeneró esta semana.
  useEffect(() => {
    const plan = data?.plan;
    if (!plan) return;
    const currentWeekStart = getWeekStartDate(new Date());
    if (plan.weekStartDate === currentWeekStart) return;
    regeneratePlan.mutate({ proteinPreferences: plan.proteinPreferences });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.plan?.id, data?.plan?.weekStartDate]);

  const toggleProtein = (protein: DietProteinType) => {
    setProteinPreferences((prev) =>
      prev.includes(protein)
        ? prev.filter((p) => p !== protein)
        : [...prev, protein],
    );
  };

  const handleCreatePlan = () => {
    if (!goal) {
      toast.error("Elige una meta");
      return;
    }
    if (!dietStyle) {
      toast.error("Elige un estilo de alimentación");
      return;
    }
    if (!budget) {
      toast.error("Elige tu presupuesto");
      return;
    }
    if (!profile?.age || !profile?.heightCm || !profile?.weightKg || !profile?.sex) {
      toast.error(
        "Nos faltan tus datos corporales. Complétalos en Perfil → Editar perfil → Datos corporales.",
      );
      return;
    }

    createPlan.mutate(
      {
        goal,
        dietStyle,
        budget,
        sex: toDietSex(profile.sex),
        age: profile.age,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        activityLevel,
        proteinPreferences,
      },
      {
        onSuccess: () => {
          toast.success("Tu plan de alimentación está listo");
          setStep("resultado");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "No se pudo crear tu plan",
          );
        },
      },
    );
  };

  const handleRegenerate = () => {
    regeneratePlan.mutate(
      { proteinPreferences },
      {
        onSuccess: () => toast.success("Menú actualizado"),
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "No se pudo regenerar tu menú",
          );
        },
      },
    );
  };

  const plan = data?.plan ?? null;

  if (isLoading || step === null) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/home" aria-label="Volver">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <h1 className={styles.title}>
          {step === "meta" && "Arma tu dieta"}
          {step === "resultado" && "Tu plan"}
        </h1>
        <div className={styles.headerSpacer} />
      </div>

      {step === "meta" && (
        <div className={styles.stepContent}>
          <p className={styles.hint}>¿Cuál es tu meta principal?</p>
          <div className={styles.chipGrid}>
            {DIET_GOALS.map((g) => (
              <button
                key={g}
                type="button"
                className={`${styles.chip} ${goal === g ? styles.chipActive : ""}`}
                onClick={() => setGoal(g)}
              >
                {DIET_GOAL_LABEL[g]}
              </button>
            ))}
          </div>

          <p className={styles.hint}>¿Qué estilo de alimentación prefieres?</p>
          <div className={styles.chipGrid}>
            {DIET_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.chip} ${dietStyle === s ? styles.chipActive : ""}`}
                onClick={() => setDietStyle(s)}
              >
                {DIET_STYLE_LABEL[s]}
              </button>
            ))}
          </div>

          <p className={styles.hint}>¿Cuál es tu presupuesto?</p>
          <div className={styles.chipGrid}>
            {DIET_BUDGETS.map((b) => (
              <button
                key={b}
                type="button"
                className={`${styles.chip} ${budget === b ? styles.chipActive : ""}`}
                onClick={() => setBudget(b)}
              >
                {DIET_BUDGET_LABEL[b]}
              </button>
            ))}
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Nivel de actividad</span>
            <Select
              value={activityLevel}
              onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {ACTIVITY_LEVEL_LABEL[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>
              Proteínas que prefieres (opcional)
            </span>
            <div className={styles.chipGrid}>
              {DIET_PROTEIN_TYPES.filter((p) => p !== "ninguna").map((protein) => (
                <button
                  key={protein}
                  type="button"
                  className={`${styles.chip} ${proteinPreferences.includes(protein) ? styles.chipActive : ""}`}
                  onClick={() => toggleProtein(protein)}
                >
                  {DIET_PROTEIN_TYPE_LABEL[protein]}
                </button>
              ))}
            </div>
          </div>

          <p className={styles.hint}>
            Usamos tu peso, estatura, edad y sexo ya registrados en tu perfil para
            calcular tus macros.
          </p>

          <Button
            type="button"
            className={styles.primaryButton}
            onClick={handleCreatePlan}
            disabled={createPlan.isPending}
          >
            {createPlan.isPending ? <Spinner size="sm" /> : "Calcular mi plan"}
          </Button>
        </div>
      )}

      {step === "resultado" && plan && (
        <div className={styles.stepContent}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryEyebrow}>
              {DIET_GOAL_LABEL[plan.goal]} · {DIET_STYLE_LABEL[plan.dietStyle]} ·{" "}
              {DIET_BUDGET_LABEL[plan.budget]}
            </p>
            <p className={styles.summaryKcal}>{plan.targetKcal} kcal/día</p>
            <div className={styles.macrosRow}>
              <div className={styles.macroStat}>
                <Beef size={16} className={styles.macroIconProtein} />
                <span>{plan.targetProteinG} g</span>
                <span className={styles.macroLabel}>Proteína</span>
              </div>
              <div className={styles.macroStat}>
                <Wheat size={16} className={styles.macroIconCarbs} />
                <span>{plan.targetCarbsG} g</span>
                <span className={styles.macroLabel}>Carbos</span>
              </div>
              <div className={styles.macroStat}>
                <Droplet size={16} className={styles.macroIconFat} />
                <span>{plan.targetFatG} g</span>
                <span className={styles.macroLabel}>Grasa</span>
              </div>
            </div>
          </div>

          {allergies && (
            <p className={styles.allergyNote}>
              <ShieldAlert size={14} /> Evitando alimentos con: {allergies}
            </p>
          )}

          {currentMealSlot && (
            <p className={styles.currentMealNote}>
              {currentMealSlot === "ayuno" ? (
                <>
                  <Clock3 size={14} /> Estás en tu ventana de{" "}
                  <strong>ayuno</strong> — tu primera comida es a las{" "}
                  {fastingEndTime}
                </>
              ) : (
                <>
                  <Clock3 size={14} /> Ahorita te toca:{" "}
                  <strong>{CURRENT_SLOT_LABEL[currentMealSlot]}</strong>
                </>
              )}
            </p>
          )}

          {shoppingListData && shoppingListData.items.length > 0 && (
            <button
              type="button"
              className={`${styles.shoppingListBanner} ${isSunday ? styles.shoppingListBannerSunday : ""}`}
              onClick={() => setShoppingListOpen(true)}
            >
              <ShoppingCart size={18} />
              <span className={styles.shoppingListBannerText}>
                <span className={styles.shoppingListBannerTitle}>
                  {isSunday ? "¡Nueva semana! Tu lista de compras" : "Lista de compras de la semana"}
                </span>
                <span className={styles.shoppingListBannerSubtitle}>
                  {shoppingListData.items.length} ingredientes para tus comidas de domingo a sábado
                </span>
              </span>
            </button>
          )}

          <div className={styles.mealList}>
            {plan.meals
              .filter((meal) => !(fastingMode && meal.mealSlot === "desayuno"))
              .map((meal) => {
                const isCurrent = meal.mealSlot === currentMealSlot;
                return (
                  <div
                    key={meal.id}
                    className={`${styles.mealCard} ${isCurrent ? styles.mealCardCurrent : ""}`}
                  >
                    <div className={styles.mealSlotRow}>
                      <p className={styles.mealSlot}>
                        {DIET_MEAL_SLOT_LABEL[meal.mealSlot]}
                      </p>
                      {isCurrent && <span className={styles.nowBadge}>Ahora</span>}
                    </div>
                    <p className={styles.mealName}>{meal.name}</p>
                    <p className={styles.mealDescription}>{meal.description}</p>
                    <p className={styles.mealMacros}>
                      <Flame size={12} /> {meal.kcal} kcal · P {meal.proteinG}g · C{" "}
                      {meal.carbsG}g · G {meal.fatG}g
                    </p>
                    {meal.prepSteps.length > 0 && (
                      <>
                        <button
                          type="button"
                          className={styles.mealPrepToggle}
                          onClick={() =>
                            setExpandedPrepIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(meal.id)) next.delete(meal.id);
                              else next.add(meal.id);
                              return next;
                            })
                          }
                        >
                          <ChefHat size={13} />
                          {expandedPrepIds.has(meal.id)
                            ? "Ocultar preparación"
                            : "Cómo prepararlo"}
                        </button>
                        {expandedPrepIds.has(meal.id) && (
                          <ol className={styles.mealPrepList}>
                            {meal.prepSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>
              Proteínas que prefieres al regenerar
            </span>
            <div className={styles.chipGrid}>
              {DIET_PROTEIN_TYPES.filter((p) => p !== "ninguna").map((protein) => (
                <button
                  key={protein}
                  type="button"
                  className={`${styles.chip} ${proteinPreferences.includes(protein) ? styles.chipActive : ""}`}
                  onClick={() => toggleProtein(protein)}
                >
                  {DIET_PROTEIN_TYPE_LABEL[protein]}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className={styles.primaryButton}
            onClick={handleRegenerate}
            disabled={regeneratePlan.isPending}
          >
            {regeneratePlan.isPending ? (
              <Spinner size="sm" />
            ) : (
              <>
                <RefreshCw size={16} /> Regenerar menú
              </>
            )}
          </Button>

          <button
            type="button"
            className={styles.rebuildLink}
            onClick={() => {
              setGoal(plan.goal);
              setDietStyle(plan.dietStyle);
              setBudget(plan.budget);
              setStep("meta");
            }}
          >
            Rehacer mi plan desde cero
          </button>
        </div>
      )}

      <Dialog open={shoppingListOpen} onOpenChange={setShoppingListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={styles.shoppingListTitle}>
              <ShoppingCart size={18} /> Lista de compras de la semana
            </DialogTitle>
            <DialogDescription>
              Ingredientes de todas tus comidas de domingo a sábado, ya
              sumados cuando se repiten.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.shoppingListItems}>
            {(shoppingListData?.items ?? []).map((item) => (
              <div key={item.name} className={styles.shoppingListItem}>
                <span className={styles.shoppingListItemName}>{item.name}</span>
                {item.amount && (
                  <span className={styles.shoppingListItemAmount}>{item.amount}</span>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
